import WebSocket from 'ws'
import { ObjectID } from 'mongodb'
import http, { Server } from 'http'
import url from 'url'
import { Socket } from 'net'
//use import json to keep type check
import cfg from './config.json'
import { errorMsg,xssFilter } from './utils'
import { ajv, postSchema,verifyObject,verifyString } from './verify'
import * as model from './models/index'
import { Thread } from './models/index'

interface WsSessionGroup{
  //id?: ObjectID
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
      const sessionGroup = new SessionGroup
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
    if (targetGroup!=undefined) {
      targetGroup?.wsSessions.forEach((session) => {
        if (session.readyState === WebSocket.OPEN) {
          session.send(message)
        }
      })
      console.log(`"${message}" from "${groupName}"`)
    }
  }
}
class SessionGroup implements WsSessionGroup{
  id?: ObjectID
  name?:string
  wsSessions: WebSocket[] =[]
}

//Websocket Board Server
//Stupid you can't do that! A http server can only bind a websocket server. 
//Actually you can use node http server. 
export const boardHub = new WsHub
export const boardWs = new WebSocket.Server({
  noServer:true
})
boardWs.on('connection', (webSocketConn, req) => {
  const urlParamMap = url.parse(req.url!, true)
  const boardName = urlParamMap.query["name"]?.toString()
  if (boardName != undefined) {
    model.BoardModel.findOne({ name: boardName },(err,board)=> {
      if (board) {
        boardHub.addSession(boardName, webSocketConn)
        webSocketConn.on('close', () => {
          boardHub.deleteSession(boardName, webSocketConn)
        })
      } else {
        webSocketConn.send(errorMsg.toString(1003))
        webSocketConn.close(1003,"Params error")
      }
    })
  } else {
    webSocketConn.send(errorMsg.toString(1003))
    webSocketConn.close(1003,"Params error")
  }
})

//Websocket Thread Server
export const threadHub = new WsHub
export const threadWs = new WebSocket.Server({
  noServer:true
})

threadWs.on('connection', (webSocketConn, req) => {
  threadApp(webSocketConn,req)
})
async function threadApp(webSocketConn: WebSocket, req: http.IncomingMessage) {
  //const urlParam = querystring.decode(urlParamMap!)
  const urlParamMap = url.parse(req.url!, true)
  const threadId = urlParamMap.query["id"]?.toString()
  if (threadId!=undefined) {
    model.ThreadModel.findById(threadId, (err, thread) => {
      if (thread) {
        threadHub.addSession(threadId!,webSocketConn)
        webSocketConn.on('message', async (message) => { //Must add async here to keep the structure async
          onPost(webSocketConn,message,threadId!,thread)
        })
        webSocketConn.on('close', () => {
          threadHub.deleteSession(threadId!, webSocketConn)
        })
      } else {
        webSocketConn.send(errorMsg.toString(1003))
        webSocketConn.close(1003,"Params error")
      }
    })
  } else {
    webSocketConn.send(errorMsg.toString(1003))
    webSocketConn.close(1003,"Params error")
  }
}

async function onPost(webSocketConn: WebSocket, message: WebSocket.Data, sessionGroupName: string,thread:model.Thread) {
  //const messageClean = xssFilter.process(message.toString())
  //all the message is dirty. 
  //xss is handle by browser
  //using markdown-it

  //messageParsed may be null
  //@ts-ignore
  const messageParsed:model.Post = verifyString(message,postSchema)
  if (messageParsed) {
    let savedMsg = await savePost(messageParsed)
    if (savedMsg != null) {
      thread.postList.push(savedMsg._id)
      thread.count = thread.postList.length
      thread.lastContent = savedMsg.content
      thread.lastModified=savedMsg._id
      //Must use toObject() to delete some property
      //savedMsg=savedMsg.toObject()
      //delete savedMsg?.threadId

      //You must save it after modified. 
      //There's such method, ts is too stupid
      //@ts-ignore
      await thread.save()
      const messageStr = JSON.stringify(savedMsg) 
      threadHub.broadcastGroup(sessionGroupName, messageStr)
      //@ts-ignore
      delete thread._doc.postList
      boardHub.broadcastGroup(thread.boardName,JSON.stringify(thread))
    } else {
      webSocketConn.send(errorMsg.toString(500))
    }
  } else {
    webSocketConn.send(errorMsg.toString(400))
  }
}

async function savePost(messageParsed:model.Post) {
  try {
    let msgModel = new model.PostModel(messageParsed)
    const obj = await msgModel.save()
    console.log("Post created")
    return obj
  } catch{
    console.log("Post creating failed")
  }
}