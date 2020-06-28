import WebSocket from 'ws'
import mongodb, { ObjectID } from 'mongodb'
import mongoose from 'mongoose'
import { prop, getModelForClass, ReturnModelType } from '@typegoose/typegoose'
import * as querystring from 'querystring'
import { v4 as uuid } from 'uuid'
import Ajv from 'ajv'
import express from 'express'
import http, { Server } from 'http'
import url from 'url'
import { Socket } from 'net'
//use import json to keep type check
import cfg from './config.json'

//AJV Config
//use typescript-json-schema (https://github.com/YousefED/typescript-json-schema)
//to compile the interface to JSON Schema
//IDK why typescript doesn't let me to use import
//Anyway type checking is not needed in schema
import SCHEMA_DEF = require('./schemaDef.json') 
//import SCHEMA=require('./schemaDef.json')
const postSchema = SCHEMA_DEF.definitions.PostInterface
const boardSchema = SCHEMA_DEF.definitions.BoardInterface
const threadSchema = SCHEMA_DEF.definitions.ThreadInterface
const userSchema=SCHEMA_DEF.definitions.UserInterface
const ajv = new Ajv({ allErrors: true })

//Connect to ws://127.0.0.1:8081/thread?name=yourGroupname
//to test the server

/**
 * @TJS-additionalProperties false
 * 
 */
export interface PostInterface {
  /**
   * @minLength 6
   * @maxLength 26
   */
  nickname: string
  content:string
  token?: string
  threadId:string
}

class Post implements PostInterface{
  @prop()
  public id?: ObjectID

  @prop({required:true})
  public nickname!: string

  @prop({required:true})
  public content!:string
  
  @prop()
  public token?: string
  
  @prop({required:true})
  public threadId!:string
}

export interface ThreadInterface{
  boardName: string
    /**
   * @minLength 6
   * @maxLength 300
   */
  title: string
    /**
   * @minLength 6
   * @maxLength 26
   */
  creator?: string
  creatorToken?: string
  //postList?: ObjectID
  tag?:string[]
}
class Thread implements ThreadInterface{
  @prop()
  id: ObjectID
  @prop()
  boardName: string
  @prop()
  title: string
  @prop()
  creator: string
  @prop()
  creatorToken: string
  @prop({ref:Post})
  postList: ObjectID
  @prop()
  tag: string[]
  @prop()
  updateTime: ObjectID
  //Return latest post's ObjectID
}
export interface BoardInterface{
    /**
   * @minLength 6
   * @maxLength 26
   */
  name: string
  manager?:User[]
}
class Board implements BoardInterface{
  @prop()
  id: ObjectID
  @prop({ref:Thread})
  threadList: ObjectID[]
  @prop()
  name:string
  @prop()
  manager: User[]
}
export interface UserInterface{
  id?: ObjectID
    /**
   * @minLength 6
   * @maxLength 26
   * @pattern ^[a-zA-Z0-9_.-]*$
   */
  name: string
  password:string
}
class User implements UserInterface{
  @prop()
  id: ObjectID
  @prop()
  name: string
  @prop()
  password: string
}

class ErrorMsg {
  errorMap: Record<number, string> = {}
  toString(code: number): string {
    if (this.errorMap[code] != undefined) {
        const msg={
          code: code,
          description:this.errorMap[code]
        }
        return JSON.stringify(msg)
    } else {
      const msg={
        code: 622,
        description:"Unknown error"
      }
      return JSON.stringify(msg)
      }
    }
}

interface WsSessionGroup{
  id?: ObjectID
  name?:string
  wsSessions: WebSocket[]
  //Or use a map with uuid
  //wsSessions:Record<string,WebSocket>
}
class WsHub{
  wsSessionGroupMap: Record<string, WsSessionGroup> = {}
  //wsSessionGroupMap:Map<string,WsSessionGroup> = new Map
  addSession(groupName:string,session:WebSocket) {
    if (this.wsSessionGroupMap[groupName]==undefined){
      const sessionGroup = new ThreadSessionGroup
      sessionGroup.name = groupName
      sessionGroup.wsSessions.push(session)
      this.wsSessionGroupMap[groupName] = sessionGroup
      //If you wanna use uuid map
      // const uid = uuid()
      // this.wsSessionGroupMap[groupName].wsSessions[uid]=session
      console.log(`New group "${groupName}" created`)
    }
    else {
      this.wsSessionGroupMap[groupName].wsSessions.push(session)
      console.log(`Old group "${groupName}" connected`)
    }
  }
  deleteSession(groupName:string,session:WebSocket):void {
    const sessionList = this.wsSessionGroupMap[groupName].wsSessions
    sessionList.splice(sessionList.indexOf(session), 1)
    console.log(`A member from group "${groupName}" disconnected`)
    if (sessionList.length == 0) {
      delete this.wsSessionGroupMap[groupName]
      console.log(`Delete empty group "${groupName}"`)
    }
  }
  broadcastGroup(groupName:string, message: WebSocket.Data):void {
    const targetGroup = this.wsSessionGroupMap[groupName]
    targetGroup?.wsSessions.forEach((session) => {
      if (session.readyState === WebSocket.OPEN) {
        session.send(message)
      }
    })
    console.log(`"${message}" from "${groupName}"`)
  }
}
class ThreadSessionGroup implements WsSessionGroup{
  id?: ObjectID
  name?:string
  wsSessions: WebSocket[] =[]
}

function parsePost(wsData:WebSocket.Data) :Post|null{
  const wsDataStr = wsData.toString()

  try {
    const wsDataJson = JSON.parse(wsDataStr)
    const isValid = ajv.validate(postSchema,wsDataJson)
    if (isValid) {
      return wsDataJson as Post
    } else {
      return null
    }
  } catch{
    return null
  }
}
interface ResponseJSON{
  total: number
  from: number
  to: number
  data:any
}
class ResponseJson implements ResponseJSON{
  constructor(total:number,from:number,to:number,data:any){
    this.total=total
    this.from=from
    this.to=to
    this.data=data
  }
  total: number
  from: number
  to: number
  data: any
  threadId?: ObjectID
  boardId?: ObjectID
}
function getBoards(req: express.Request, res: express.Response) {
  req.params
  try {
    BoardModel.countDocuments({}, (err, countResult) => {
      BoardModel.find().lean().exec((err, obj) => {
        res.json(obj)
      })
    })
  } catch{
    res.json(errorMsg.toString(404))
  }
}
function postBoard(req:express.Request,res:express.Response) {
  try {

  } catch{
    res.json(errorMsg.toString(400))
  }
}
const PAGE_LIMIT=30
function getThreads(req: express.Request, res: express.Response) {
  const start = Number(req.query["st"])
  const end=Number(req.query["e"])
  const boardName=req.params["boardName"]
  //hasn't pass the board name
  ThreadModel.countDocuments({boardName:boardName}, (err, countResult) => {
    if (Number.isInteger(start) &&Number.isInteger(end)&& (end-start<PAGE_LIMIT) ) {
      try {
        ThreadModel.find({}, null, { skip: start, limit: end - start, sort: { updateTime: -1 } }).lean().exec((err, obj) => {
          const response = new ResponseJson(countResult,start,start+obj.length,obj)
          res.json(response)
        })
      } catch{
        res.json(errorMsg.toString(404))
      }
    } else {
      try {
        ThreadModel.find().lean().exec((err, obj) => {
          res.json(obj)
        })
      } catch{
        res.json(errorMsg.toString(404))
      }
    }
  })
}
function postThread(req:express.Request,res:express.Response) {
  try {

  } catch{
    res.json(errorMsg.toString(400))
  }
}

function getPosts(req:express.Request,res:express.Response) {
  try {
    PostModel.find().lean().exec((err, obj) => {
      res.json(obj)
    })
  } catch{
    res.json(errorMsg.toString(404))
  }
}
function postPost(req:express.Request,res:express.Response) {
  try {

  } catch{
    res.json(errorMsg.toString(400))
  }
}

//Express Web Server
const app = express()
app.get('/', (req,res) => {
  res.json({message:"Hello World"})
})
app.get('/board', (req, res) => {
  //Get board name
  //getBoards(res)
})
app.post('/board', (req, res) => {
  //Create a board
  postBoard(req,res)
})
app.get('/board/:boardName', (req, res) => {
  //Get all the thread in board

})
app.get('/board/:boardName/:threadId', (req, res) => {
  //Get all the post in thread
  try {
    
  } catch{
    res.json(errorMsg.toString(404))
  }
})
app.post('/board/:boardName', (req, res) => {
  //Create a thread belongs to the board
})
//Modify Post
app.get('/board/:boardName/:threadId/:postId', (req, res) => {
  //Get a post
})
app.post('/board/:boardName/:threadId', (req, res) => {
  //Create a post belongs to the thread
  //getPosts(res)
})

//Only for testing
app.get('/thread', (req, res) => {
  const start = Number(req.query["st"])
  const end = Number(req.query["e"])
  PostModel.countDocuments({}, (err, countResult) => {
    if (Number.isInteger(start) && Number.isInteger(end) && (end - start < PAGE_LIMIT)) {
      try {
        //A better way to filter
        PostModel.find({}, null, { skip: start, limit: end - start, sort: { _id: -1 } }).select("-threadId").lean().exec((err, obj) => {
          const response = new ResponseJson(countResult,start,start+obj.length,obj)
          res.json(response)
        })
      } catch{
        res.json(errorMsg.toString(404))
      }
    } else {
      try {
        //A better way to filter
        PostModel.find({}, null, { skip: 0, limit: PAGE_LIMIT, sort: { _id: -1 } }).select("-threadId").lean().exec((err, obj) => {
          const response = new ResponseJson(countResult,0,obj.length,obj)
          res.json(response)
        })
      } catch{
        res.json(errorMsg.toString(404))
      }
    }
  })
})
//Error Parse
const errorMsg = new ErrorMsg
errorMsg.errorMap = {
  400: "Bad request",
  404: "Not found",
  1003: "Params error",
  500:"Internal server error",
}

//MongoDB
const mongoURL = `mongodb://${cfg.database.hostname}:${cfg.database.port}/${cfg.database.name}`
const PostModel = getModelForClass(Post)
const ThreadModel = getModelForClass(Thread)
const BoardModel = getModelForClass(Board)
const UserModel=getModelForClass(User)
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true }).catch(err => {
  console.log(err)
})
const db=mongoose.connection
db.on('error', console.error.bind(console, 'error when connecting to mongodb'))
db.once('open', () => { //Do something when db connection on. 
  console.log("MongoDB is working")
})

//Server
const PORT=cfg.server.port
const httpServer = http.createServer()
httpServer.on('request', app) //app=express() is a callback function
httpServer.on('upgrade', (req:http.IncomingMessage, socket:Socket, head:Buffer) => {
  const pathname = url.parse(req.url!).pathname;
  if (pathname === '/board') {
    boardWs.handleUpgrade(req, socket, head, (webSocketConn) => {
      boardWs.emit('connection', webSocketConn,req)
    });
  } else if (pathname === '/thread') {
    threadWs.handleUpgrade(req, socket, head, (webSocketConn) => {
      threadWs.emit('connection', webSocketConn,req);
    });
  } else {
    socket.destroy();
  }
})
httpServer.listen(PORT, () => {
  console.log(`Listening ${PORT}`)
})


//Websocket Board Server
//Stupid you can't do that! A http server can only bind a websocket server. 
//Actually you can use node http server. 
const boardHub = new WsHub
const boardWs = new WebSocket.Server({
  noServer:true
})
boardWs.on('connection', (webSocketConn, req) => {
  webSocketConn.send("Hello World")
})

//Websocket Thread Server
const threadHub = new WsHub
const threadWs = new WebSocket.Server({
  noServer:true
})

threadWs.on('connection', (webSocketConn, req) => {
  threadApp(webSocketConn,req)
})
async function threadApp(webSocketConn: WebSocket, req: http.IncomingMessage) {
  //const urlParam = querystring.decode(urlParamMap!)
  try {
    const urlParamMap = url.parse(req.url!, true)
    const sessionNameInURL = urlParamMap.query["name"]?.toString()
    if (sessionNameInURL != undefined) {
      threadHub.addSession(sessionNameInURL,webSocketConn)
      webSocketConn.on('message', async (message) => { //Must add async here to keep the structure async
        onPost(webSocketConn,message,sessionNameInURL)
      })
      webSocketConn.on('close', () => {
        threadHub.deleteSession(sessionNameInURL, webSocketConn)
      })
    } else {
      throw new Error('Params error')
    }
  } catch{
    webSocketConn.send(errorMsg.toString(1003))
    webSocketConn.close(1003,"Params error")
  }
}

async function onPost(webSocketConn:WebSocket,message:WebSocket.Data,sessionGroupName:string) {
  const messageParsed = parsePost(message)
  if (messageParsed != null) {      
    let savedMsg = await savePost(messageParsed)
    if (savedMsg != null) {
      //Must use toObject() to delete some property
      savedMsg=savedMsg.toObject()
      delete savedMsg?.threadId
      const messageStr = JSON.stringify(savedMsg) 
      threadHub.broadcastGroup(sessionGroupName,messageStr)
    } else {
      webSocketConn.send(errorMsg.toString(500))
    }
  } else {
    webSocketConn.send(errorMsg.toString(400))
  }
}

async function savePost(messageParsed:Post) {
  try {
    let msgModel = new PostModel(messageParsed)
    const obj = await msgModel.save()
    console.log("Post created")
    return obj
  } catch{
    console.log("Post creating failed")
  }
}