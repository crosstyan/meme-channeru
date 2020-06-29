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

//Websocket Board Server
//Stupid you can't do that! A http server can only bind a websocket server. 
//Actually you can use node http server. 
export const boardHub = new WsHub
export const boardWs = new WebSocket.Server({
  noServer:true
})
boardWs.on('connection', (webSocketConn, req) => {
  webSocketConn.send("Hello World")
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

async function onPost(webSocketConn: WebSocket, message: WebSocket.Data, sessionGroupName: string) {
  //const messageClean = xssFilter.process(message.toString())
  //all the message is dirty. 
  //xss is handle by browser
  //using markdown-it
  const messageParsed:model.Post = verifyString(message,postSchema)
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