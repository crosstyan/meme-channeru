import WebSocket from 'ws'
import mongodb, { ObjectID } from 'mongodb'
import * as mongoose from 'mongoose'
import { prop, getModelForClass } from '@typegoose/typegoose'
import * as querystring from 'querystring'
import { v4 as uuid } from 'uuid'
import Ajv from 'ajv'
import express from 'express'
import http, { Server } from 'http'
import url from 'url'
import { Socket } from 'net'

//use typescript-json-schema (https://github.com/YousefED/typescript-json-schema)
//to compile the interface to JSON Schema
const postSchema = require('./PostSchema.json') 

//A valid request example
//   {
//     "nickname":"rabbit",
//     "content":"little rabbit",
//     "threadId":"507f1f77bcf86cd799439011"
// }

//Connect to ws://127.0.0.1:8081/thread?name=yourGroupname
//to test the server

/**
 * @TJS-additionalProperties false
 */
export interface Post {
  id?: string
  nickname: string
  content:string
  token?: string
  threadId:string
}

class PostClass implements Post{
  @prop()
  public id?: string

  @prop({required:true})
  public nickname!: string

  @prop({required:true})
  public content!:string
  
  @prop()
  public token?: string
  
  @prop({required:true})
  public threadId!:string
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

function parsePost(wsData:WebSocket.Data) :PostClass|null{
  const wsDataStr = wsData.toString()
  const ajv = new Ajv({allErrors:true})
  try {
    const wsDataJson = JSON.parse(wsDataStr)
    const isValid = ajv.validate(postSchema,wsDataJson)
    if (isValid) {
      return wsDataJson as PostClass
    } else {
      return null
    }
  } catch{
    return null
  }
}

//Express Web Server
//const EXPRESS_PORT=8080
const app = express()
app.get('/', (req,res) => {
  res.send("hello world")
})
// app.listen(EXPRESS_PORT, () => {
//   console.log(`Express is listening ${EXPRESS_PORT}`)
// })

//Error Parse
const errorMsg = new ErrorMsg
errorMsg.errorMap = {
  400: "Bad request",
  404: "Not found",
}

//MongoDB
// const mongoURL = "mongodb://localhost:27017/wschat"
// mongoose.connect(mongoURL, { useNewUrlParser: true })
// const db=mongoose.connection
// db.on('error', console.error.bind(console, 'error when connecting to mongodb'))
// db.once('open', () => { //Do something when db connection on. 
//   const PostModel=getModelForClass(Post)
// })

//Server
const PORT=8081
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
//Actually you can
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
function threadApp(webSocketConn: WebSocket, req: http.IncomingMessage):void {
  const reParam=req.url?.match(/(?<=\?).+/)
  const urlParam = querystring.decode(reParam![0])
  const sessionNameInURL = urlParam.name?.toString()!
  if ('name' in urlParam) {
    threadHub.addSession(sessionNameInURL,webSocketConn)
  }
  else {
    webSocketConn.close(1003,"Params aren't correct. ")
  }
  webSocketConn.on('message', (message) => {
    const messageParsed = parsePost(message)
    if (messageParsed != null) {
      const messageStr = JSON.stringify(messageParsed) 
      threadHub.broadcastGroup(sessionNameInURL,messageStr)
    } else {
      webSocketConn.send(errorMsg.toString(400))
    }
  })
  webSocketConn.on('close', () => {
    threadHub.deleteSession(sessionNameInURL, webSocketConn)
  })
}