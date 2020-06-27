import express from "express"
import * as http from "http"
import WebSocket from 'ws'
import * as path from 'path'
import mongodb, { ObjectID } from 'mongodb'
import * as mongoose from 'mongoose'
import { type } from "os"
import { prop, Typegoose, ModelType, InstanceType } from 'typegoose'

const cfg = require("./config.json")

class PostAnother {
  @prop()
  id: ObjectID
  @prop()
  threadId: ObjectID
  @prop()
  nickname: string
  @prop()
  content: string
  @prop()
  token:string
}
class Thread{
  @prop()
  id: ObjectID
  @prop()
  boardId: ObjectID
  @prop()
  title: string
  @prop()
  creator: string
  @prop()
  creatorToken: string
  @prop({ref:PostAnother})
  postList: ObjectID
  @prop()
  tag:Tag[]
}
class Board{
  @prop()
  id: ObjectID
  @prop({ref:Thread})
  threadList: ObjectID[]
  @prop()
  manager: User[]
}
class User{
  @prop()
  id: ObjectID
  @prop()
  name: string
  @prop()
  password: string
}
class Tag{
  @prop()
  name:string
}

interface WsSession{
  id: ObjectID
  wsConnection:WebSocket[]
}
class BoardSession implements WsSession{
  id: ObjectID
  wsConnection:WebSocket[]
}

const boardWs = new WebSocket.Server({
  port: cfg.server.port,
  path: "/board",
})

boardWs.on('connection', (socket) => {
  
})