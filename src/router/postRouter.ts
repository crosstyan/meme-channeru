import { ObjectID } from 'mongodb'
import express from 'express'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'
import * as model from '../models/index'
import { ajv, postSchema, boardSchema, threadSchema,verifyObject } from '../verify'
import bodyParser from 'body-parser'
const PAGE_LIMIT = cfg.server.page_limit
import { app } from './router'
import {threadHub,boardHub} from '../wsmodule'

//Post
app.get('/board/:boardName/:threadId/:postId', (req, res) => {
  const postId=req.params['postId']
  model.PostModel.findById(postId, (err, post) => {
    if (post) {
      res.json(post)
    } else {
      res.json(errorMsg.toObject(400))
    }
  })
})
app.post('/board/:boardName/:threadId', (req, res) => {
  //Create a post belongs to the thread
  //getPosts(res)
  const threadId = req.params['threadId']
  const boardName=req.params['boardName']
  const postRaw = req.body
  const post=verifyObject(postRaw,postSchema)
  model.ThreadModel.findById(threadId, async(err, thread) => {
    if (thread&&post) {
      const postObj = new model.PostModel(post)
      const savedPost = await postObj.save()
      thread.postList.push(savedPost._id)
      thread.count = thread.postList.length
      thread.lastModified = savedPost._id
      thread.content=savedPost.content
      await thread.save()
      res.json(savedPost)
      threadHub.broadcastGroup(threadId, JSON.stringify(savedPost))
      //_doc is exist
      //@ts-ignore
      delete thread._doc.postList
      boardHub.broadcastGroup(boardName,JSON.stringify(thread))
    } else {
      res.json(errorMsg.toObject(400))
    }
  })
})