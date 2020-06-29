import http, { Server } from 'http'
import url from 'url'
import { Socket } from 'net'
//use import json to keep type check
import cfg from './config.json'

import * as model from './model'
import { app } from './httpserver'
import { errorMsg } from './utils'
import {boardWs, threadWs} from './wsmodule'

//DB
model.db.on('error', console.error.bind(console, 'error when connecting to mongodb'))
model.db.once('open', () => { //Do something when db connection on. 
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