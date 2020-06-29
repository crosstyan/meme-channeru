import { ObjectID } from 'mongodb'
import express from 'express'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'
import * as model from '../models/index'
import { ajv, postSchema, boardSchema, threadSchema,verifyObject } from '../verify'
import bodyParser from 'body-parser'
import { app,postToDB } from './main'

app.get('/board/:boardName/:threadId', (req, res) => {
  //Get all the post in thread
})
app.post('/board/:boardName', (req, res) => {
  postToDB(req,res,model.ThreadModel,threadSchema)
})