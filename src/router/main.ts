import { ObjectID } from 'mongodb'
import express from 'express'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'
import * as model from '../models/index'
import { ajv, postSchema, boardSchema, threadSchema,verifyObject } from '../verify'
import bodyParser from 'body-parser'

export const PAGE_LIMIT = cfg.server.page_limit
interface ResponseJSON{
  total: number
  from: number
  to: number
  data:any
}
class ResponseJson implements ResponseJSON{
  constructor(total:number,from:number,to:number,data:any){
    this.total=total
    this.from=from
    this.to=to
    this.data=data
  }
  total: number
  from: number
  to: number
  data: any
  threadId?: ObjectID
  boardId?: ObjectID
}

//Express Web Server
export const app = express()
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

export async function postToDB(req:express.Request,res:express.Response,MongooseModel:any,verifySchema:object) {
  try {
    const postBody:object = req.body
    //console.log(typeof(postBody))
    //@ts-ignore
    const parsed=verifyObject(postBody,verifySchema)
    if (parsed != null) {
      let savedMsg = await (async (parsed) => {
        try {
          let msgModel = new MongooseModel(parsed)
          return await msgModel.save()
        } catch{
          res.json(errorMsg.toObject(500))
        }
      })(parsed)
      res.json(savedMsg)
    } else {
      res.json(errorMsg.toObject(400))
    }
  } catch{
    res.json(errorMsg.toObject(400))
  }
}