import { ObjectID } from 'mongodb'
import express from 'express'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'
import * as model from '../models/index'
import { ajv, postSchema, boardSchema, threadSchema,verifyObject } from '../verify'
import bodyParser from 'body-parser'
const PAGE_LIMIT = cfg.server.page_limit
import { app } from './main'

//Modify Post
app.get('/board/:boardName/:threadId/:postId', (req, res) => {
  //Get a post
})
app.post('/board/:boardName/:threadId', (req, res) => {
  //Create a post belongs to the thread
  //getPosts(res)
})