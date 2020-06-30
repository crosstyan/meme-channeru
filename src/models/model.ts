import mongodb, { ObjectID } from 'mongodb'
import mongoose from 'mongoose'
import { prop, getModelForClass, ReturnModelType,Ref,setGlobalOptions, Severity } from '@typegoose/typegoose'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'


//MongoDB
const mongoURL = `mongodb://${cfg.database.hostname}:${cfg.database.port}/${cfg.database.name}`
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify: false }).catch(err => {
  console.log(err)
})
export const db=mongoose.connection