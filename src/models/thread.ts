import mongodb, { ObjectID } from 'mongodb'
import mongoose from 'mongoose'
import { prop, getModelForClass, ReturnModelType,Ref } from '@typegoose/typegoose'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'
import { Post} from './post'
import {Board} from './board'
export interface ThreadInterface{
  boardName: string
  /**
   * @TJS-type string
   */
  boardId:Ref<ObjectID>
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
  @prop({ref:'Board'})
  boardId:Ref<ObjectID>

  @prop()
  title: string

  @prop()
  creator: string
  @prop()
  creatorToken: string

  @prop({ref:'Post'})
  postList: Ref<Post>[]
  @prop()
  tag: string[]

  @prop()
  updateTime: ObjectID
  //Return latest post's ObjectID
}
export const ThreadModel = getModelForClass(Thread)