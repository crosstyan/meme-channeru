import mongodb, { ObjectID } from 'mongodb'
import mongoose from 'mongoose'
import { prop, getModelForClass, ReturnModelType,Ref } from '@typegoose/typegoose'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'

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
export const UserModel=getModelForClass(User)