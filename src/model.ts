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
import { errorMsg } from './utils'

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

export class Post implements PostInterface{
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
export class Thread implements ThreadInterface{
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
export class Board implements BoardInterface{
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
export class User implements UserInterface{
  @prop()
  id: ObjectID
  @prop()
  name: string
  @prop()
  password: string
}

//MongoDB
const mongoURL = `mongodb://${cfg.database.hostname}:${cfg.database.port}/${cfg.database.name}`
export const PostModel = getModelForClass(Post)
export const ThreadModel = getModelForClass(Thread)
export const BoardModel = getModelForClass(Board)
export const UserModel=getModelForClass(User)
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true }).catch(err => {
  console.log(err)
})
export const db=mongoose.connection