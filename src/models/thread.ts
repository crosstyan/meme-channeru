import mongodb, { ObjectID } from 'mongodb'
import mongoose from 'mongoose'
import { prop, getModelForClass, ReturnModelType,Ref,modelOptions } from '@typegoose/typegoose'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'
import { Post} from './post'
import {Board} from './board'
interface ThreadInterface{
  boardName?: string
  /**
   * @TJS-type string
   */
  boardId?:Ref<ObjectID>
    /**
   * @minLength 6
   * @maxLength 300
   */
  title: string
  content: string
  /**
   * @minLength 1
   * @maxLength 26
   */
  creator: string
  creatorToken?: string
  /**
   * @TJS-type string
   */
  postList?: Ref<Post>[]
  tag?:string[]
}

@modelOptions({ schemaOptions: { versionKey:false } })
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

  @prop({ref:'Post'})
  lastModified: Ref<Post>
  //Return latest post's ObjectID
  @prop()
  content: string
  @prop()
  pageInfo: object
  @prop()
  count: number
  
  public get postListLength() {
    return this.postList.length
  }
}
export const ThreadModel = getModelForClass(Thread)