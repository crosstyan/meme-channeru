import { ObjectID } from 'mongodb'
import express from 'express'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'
import * as model from '../models/index'
import { ajv, postSchema, boardSchema, threadSchema,verifyObject } from '../verify'
import bodyParser from 'body-parser'
import { app,postToDB ,PageInfo,PAGE_LIMIT} from './router'

function getBoards(req: express.Request, res: express.Response) {
  try {
    model.BoardModel.countDocuments({}, (err, countResult) => {
      model.BoardModel.find().select('-threadList').lean().exec((err, obj) => {
        res.json(obj)
      })
    })
  } catch{
    res.json(errorMsg.toString(404))
  }
}

app.get('/', (req,res) => {
  getBoards(req,res)
})
app.get('/board', (req, res) => {
  //Get board name
  getBoards(req,res)
})
app.get('/board/:boardName', (req, res) => {
  const boardName = req.params['boardName']
  if (boardName != undefined) {
    model.BoardModel.findOne({ name: boardName }, (err, board) => {
      if (board) {
        res.json(board)
      } else {
        res.json(errorMsg.toObject(404))
      }
    })
  } else {
    res.json(errorMsg.toObject(400))
  }
})
app.post('/board', (req, res) => {
  //Create a board
  postToDB(req,res,model.BoardModel,boardSchema)
})

//Just use the mystery postToDB()
async function postBoard(req:express.Request,res:express.Response) {
  try {
    const postBody:object = req.body
    //console.log(typeof(postBody))
    //@ts-ignore
    const parsed:model.Board=verifyObject(postBody,boardSchema)
    if (parsed != null) {
      let savedMsg = await (async (parseBoard: model.Board|null) => {
        try {
          let msgModel = new model.BoardModel(parseBoard)
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


