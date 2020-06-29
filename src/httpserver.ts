import mongodb, { ObjectID } from 'mongodb'
import express from 'express'
//use import json to keep type check
import cfg from './config.json'
import { errorMsg } from './utils'
import * as model from './model'

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
function getBoards(req: express.Request, res: express.Response) {
  req.params
  try {
    model.BoardModel.countDocuments({}, (err, countResult) => {
      model.BoardModel.find().lean().exec((err, obj) => {
        res.json(obj)
      })
    })
  } catch{
    res.json(errorMsg.toString(404))
  }
}
function postBoard(req:express.Request,res:express.Response) {
  try {

  } catch{
    res.json(errorMsg.toString(400))
  }
}
const PAGE_LIMIT=30
function getThreads(req: express.Request, res: express.Response) {
  const start = Number(req.query["st"])
  const end=Number(req.query["e"])
  const boardName=req.params["boardName"]
  //hasn't pass the board name
  model.ThreadModel.countDocuments({boardName:boardName}, (err, countResult) => {
    if (Number.isInteger(start) &&Number.isInteger(end)&& (end-start<PAGE_LIMIT) ) {
      try {
        model.ThreadModel.find({}, null, { skip: start, limit: end - start, sort: { updateTime: -1 } }).lean().exec((err, obj) => {
          const response = new ResponseJson(countResult,start,start+obj.length,obj)
          res.json(response)
        })
      } catch{
        res.json(errorMsg.toString(404))
      }
    } else {
      try {
        model.ThreadModel.find().lean().exec((err, obj) => {
          res.json(obj)
        })
      } catch{
        res.json(errorMsg.toString(404))
      }
    }
  })
}
function postThread(req:express.Request,res:express.Response) {
  try {

  } catch{
    res.json(errorMsg.toString(400))
  }
}

function getPosts(req:express.Request,res:express.Response) {
  try {
    model.PostModel.find().lean().exec((err, obj) => {
      res.json(obj)
    })
  } catch{
    res.json(errorMsg.toString(404))
  }
}
function postPost(req:express.Request,res:express.Response) {
  try {

  } catch{
    res.json(errorMsg.toString(400))
  }
}

//Express Web Server
export const app = express()
app.get('/', (req,res) => {
  res.json({message:"Hello World"})
})
app.get('/board', (req, res) => {
  //Get board name
  //getBoards(res)
})
app.post('/board', (req, res) => {
  //Create a board
  postBoard(req,res)
})
app.get('/board/:boardName', (req, res) => {
  //Get all the thread in board

})
app.get('/board/:boardName/:threadId', (req, res) => {
  //Get all the post in thread
  try {
    
  } catch{
    res.json(errorMsg.toString(404))
  }
})
app.post('/board/:boardName', (req, res) => {
  //Create a thread belongs to the board
})
//Modify Post
app.get('/board/:boardName/:threadId/:postId', (req, res) => {
  //Get a post
})
app.post('/board/:boardName/:threadId', (req, res) => {
  //Create a post belongs to the thread
  //getPosts(res)
})

//Only for testing
app.get('/thread', (req, res) => {
  const start = Number(req.query["st"])
  const end = Number(req.query["e"])
  model.PostModel.countDocuments({}, (err, countResult) => {
    if (Number.isInteger(start) && Number.isInteger(end) && (end - start < PAGE_LIMIT)) {
      try {
        //A better way to filter
        model.PostModel.find({}, null, { skip: start, limit: end - start, sort: { _id: -1 } }).select("-threadId").lean().exec((err, obj) => {
          const response = new ResponseJson(countResult,start,start+obj.length,obj)
          res.json(response)
        })
      } catch{
        res.json(errorMsg.toString(404))
      }
    } else {
      try {
        //A better way to filter
        model.PostModel.find({}, null, { skip: 0, limit: PAGE_LIMIT, sort: { _id: -1 } }).select("-threadId").lean().exec((err, obj) => {
          const response = new ResponseJson(countResult,0,obj.length,obj)
          res.json(response)
        })
      } catch{
        res.json(errorMsg.toString(404))
      }
    }
  })
})