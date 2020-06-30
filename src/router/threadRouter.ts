import { ObjectID } from 'mongodb'
import express from 'express'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'
import * as model from '../models/index'
import { ajv, postSchema, boardSchema, threadSchema,verifyObject } from '../verify'
import bodyParser from 'body-parser'
import { app,postToDB,PAGE_LIMIT,PageInfo } from './router'
import { BoardModel, ThreadModel, Thread } from '../models/index'
import { count } from 'console'
import mongoose from 'mongoose'
import {boardHub} from '../wsmodule'
import { prop, getModelForClass, ReturnModelType,Ref } from '@typegoose/typegoose'

export class pageParams{
  start: number = 0
  end: number = PAGE_LIMIT
  length() {
    if (this.end > this.start) {
      return this.end-this.start
    }
  }
}

app.post('/board/:boardName', (req, res) => {
  postThread(req,res)
})
app.get('/board/:boardName/:threadId', async(req, res) => {
  //Get all the post in thread
  //Get a post
  const start = Number(req.query["st"])
  const end=Number(req.query["e"])
  const threadId = req.params["threadId"]
  const page = new pageParams
  let total: number = 0
    if (Number.isInteger(start)) {
    page.start = start
    page.end=start+PAGE_LIMIT
  }
  if (Number.isInteger(start) && Number.isInteger(end) && (end - start < PAGE_LIMIT)) { 
    page.start = start
    page.end=end
  }
  model.ThreadModel.findById(threadId).select('-__v').populate({
    path: 'postList',
    options:{skip: page.start, limit: page.length(), sort: { _id: -1 },select:{'__v':0}}
  }).exec((err, populated) => {
    if (populated) {
      const info = new PageInfo(page.start, page.start + populated.postList.length)
      populated.pageInfo=info
      res.json(populated)
    } else {
      res.json(errorMsg.toObject(400))
    }
  })
})
// app.get('/board/:boardName/:threadId/length', (req, res) => {
//   const threadId = req.params["threadId"]
//   console.log(threadId)
//   model.ThreadModel.findById(threadId).select('-postList').exec((err, thread) => {
//     if (thread) {
//       res.json(thread)
//     } else {
//       res.json(errorMsg.toObject(400))
//     }
//   })
// })

async function postThread(req: express.Request, res: express.Response) {
  const postParams=req.params
  const postBody = req.body
  const boardName=postParams['boardName']
  
  if (verifyObject(postBody, threadSchema)) {
    const verified = new model.ThreadModel(postBody) //got an ID when creating
    model.BoardModel.findOneAndUpdate({ name: boardName },{$push:{threadList:verified._id}}, async(err, board) => {
      if (board) {
        verified.boardName = postParams.boardName
        const firstPost = new model.PostModel({
          nickname: verified.creator,
          content: verified.content,
          threadId: verified._id,
          token:verified.creatorToken,
        })
        verified.postList.push(firstPost._id)
        verified.lastModified=firstPost._id
        const saved = await verified.save()
        await firstPost.save()
        //board.update({$push:{threadList:saved._id}})
        res.json(saved)
        //@ts-ignore
        delete saved._doc.postList
        boardHub.broadcastGroup(boardName,JSON.stringify(saved))
      } else {
        res.json(errorMsg.toObject(404))
      }
    })
  } else {
    res.json(errorMsg.toObject(400))
  }
}

// function getThreads(req: express.Request, res: express.Response) {
//   const start = Number(req.query["st"])
//   const end=Number(req.query["e"])
//   const boardName=req.params["boardName"]
//   //hasn't pass the board name
//   model.ThreadModel.countDocuments({boardName:boardName}, (err, countResult) => {
//     if (Number.isInteger(start) &&Number.isInteger(end)&& (end-start<PAGE_LIMIT) ) {
//       try {
//         model.ThreadModel.find({}, null, { skip: start, limit: end - start, sort: { updateTime: -1 } }).lean().exec((err, obj) => {
//           const response = new PageInfo(countResult,start,start+obj.length)
//           res.json(response)
//         })
//       } catch{
//         res.json(errorMsg.toString(404))
//       }
//     } else {
//       try {
//         model.ThreadModel.find().lean().exec((err, obj) => {
//           res.json(obj)
//         })
//       } catch{
//         res.json(errorMsg.toString(404))
//       }
//     }
//   })
// }