# Meme Channeru
ミームチャンネル
## What is this project
the project aims to provide a websocket based API forum service, Just like 4ch or 2ch.  
It just an API framework, front-end hasn't completed.  
## How to use it? 
You should install `typescript` first to compile the project to javascript.  
I assume that you have installed Node.js, and configured **MongoDB** in port `27017`.  
You can alter some option in `config.json`, The default listening port is 8081.  
```bash
npm install -g typescript
npm install
tsc
node ./js/main.js 
```
## Test router example
### RESTful API
I'm using [Firecamp](https://firecamp.io/) to test these api.  
GET `/board` to get all the board. (without thread)  
GET `/board/:boardName?st=start&e=end` to get the board and threads in the range.  
POST `/board` to post a new board  
GET `/board/:boardName/:threadId?st=start&e=end` to get the thread and threads in the range.  
POST `/board/:boardName` to post a new thread in the board  
GET `/board/:boardName/:threadId/:postId` to get a post  
POST `/board/:boardName/:threadId` to post a post in the thread  

Test examples are in the `test_example.json`
### Websocket API
`ws://127.0.0.1:8081/board?name=board_name`  
Can only listen the changes.  
Every post made will be notified. (When Thread.lastUpdate is modified)  
`ws://127.0.0.1:8081/thread?id=ObjectID`  
Just like a chat!  
## Task List
- [x] RESTful POST & GET
- [ ] RESTful PUT & DELETE
- [x] Websocket
- [ ] Front-end user interface