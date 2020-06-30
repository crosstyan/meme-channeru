import mongodb, { ObjectID } from 'mongodb'
import mongoose from 'mongoose'
import { prop, getModelForClass, ReturnModelType,Ref,modelOptions } from '@typegoose/typegoose'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'

/**
 * @TJS-additionalProperties false
 * 
 */
export interface PostInterface {
  /**
   * @minLength 3
   * @maxLength 26
   * @pattern ^[^<>?]*$
   */
  nickname: string
  content: string
  token?: string
  /**
   * @TJS-type string
   */
  threadId?:Ref<ObjectID>
}

@modelOptions({ schemaOptions: { versionKey:false } })
export class Post implements PostInterface{
  @prop()
  public id?: ObjectID

  @prop({required:true})
  public nickname!: string

  @prop({required:true})
  public content!:string
  
  @prop()
  public token?: string
  
  @prop({ref:'Thread'})
  public threadId!:Ref<ObjectID>
}
export const PostModel = getModelForClass(Post)