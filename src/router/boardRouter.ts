import { ObjectID } from 'mongodb'
import express from 'express'
//use import json to keep type check
import cfg from '../config.json'
import { errorMsg } from '../utils'
import * as model from '../models/index'
import { ajv, postSchema, boardSchema, threadSchema,verifyObject } from '../verify'
import bodyParser from 'body-parser'
import { app,postToDB ,PageInfo,PAGE_LIMIT} from './router'
import { PageParams } from './router'

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
  const start = Number(req.query["st"])
  const end=Number(req.query["e"])
  const boardName = req.params["boardName"]
  const page = new PageParams
  let total: number = 0
  if (Number.isInteger(start) && Number.isInteger(end) && (end - start < PAGE_LIMIT)) { 
    page.start = start
    page.end=end
  }
  if (boardName != undefined) {
    model.BoardModel.findOne({ name: boardName }).populate({
      path: 'threadList',
      options:{skip: page.start, limit: page.length(), sort: { _id: -1 },select:{'__v':0,'postList':0}}
    }).exec((err, populated) => {
      if (populated) {
        const info = new PageInfo(page.start, page.start + populated.threadList!.length-1)
        populated.pageInfo=info
        res.json(populated)
      } else {
        res.json(errorMsg.toObject(400))
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


