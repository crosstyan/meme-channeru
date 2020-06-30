import mongodb, { ObjectID } from 'mongodb'
import mongoose from 'mongoose'
import { prop, getModelForClass, ReturnModelType,Ref,modelOptions } from '@typegoose/typegoose'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'
import { Thread } from './thread'
import{User} from './user'
interface BoardInterface{
  /**
 * @minLength 1
 * @maxLength 26
 */
name: string
description:string
}

@modelOptions({ schemaOptions: { versionKey:false } })
export class Board implements BoardInterface{
@prop()
id?: ObjectID
@prop({ref:'Thread'})
threadList?: Ref<Thread>[]

@prop({ref:'User'})
manager?: Ref<User>[]
@prop({required:true})
name:string
@prop({required:true})
description:string

@prop()
count:number
}
export const BoardModel = getModelForClass(Board)