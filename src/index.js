"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const mongodb_1 = require("mongodb");
const mongoose_1 = __importDefault(require("mongoose"));
const typegoose_1 = require("@typegoose/typegoose");
const ajv_1 = __importDefault(require("ajv"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const url_1 = __importDefault(require("url"));
//use import json to keep type check
const config_json_1 = __importDefault(require("./config.json"));
//use typescript-json-schema (https://github.com/YousefED/typescript-json-schema)
//to compile the interface to JSON Schema
//IDK why typescript doesn't let me to use import
//Anyway type checking is not needed in schema
const postSchema = require('./PostSchema.json');
class Post {
}
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectID)
], Post.prototype, "id", void 0);
__decorate([
    typegoose_1.prop({ required: true }),
    __metadata("design:type", String)
], Post.prototype, "nickname", void 0);
__decorate([
    typegoose_1.prop({ required: true }),
    __metadata("design:type", String)
], Post.prototype, "content", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], Post.prototype, "token", void 0);
__decorate([
    typegoose_1.prop({ required: true }),
    __metadata("design:type", String)
], Post.prototype, "threadId", void 0);
class Thread {
}
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectID)
], Thread.prototype, "id", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectID)
], Thread.prototype, "boardId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], Thread.prototype, "title", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], Thread.prototype, "creator", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], Thread.prototype, "creatorToken", void 0);
__decorate([
    typegoose_1.prop({ ref: Post }),
    __metadata("design:type", mongodb_1.ObjectID)
], Thread.prototype, "postList", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Array)
], Thread.prototype, "tag", void 0);
class Board {
}
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectID)
], Board.prototype, "id", void 0);
__decorate([
    typegoose_1.prop({ ref: Thread }),
    __metadata("design:type", Array)
], Board.prototype, "threadList", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Array)
], Board.prototype, "manager", void 0);
class User {
}
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectID)
], User.prototype, "id", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
class ErrorMsg {
    constructor() {
        this.errorMap = {};
    }
    toString(code) {
        if (this.errorMap[code] != undefined) {
            const msg = {
                code: code,
                description: this.errorMap[code]
            };
            return JSON.stringify(msg);
        }
        else {
            const msg = {
                code: 622,
                description: "Unknown error"
            };
            return JSON.stringify(msg);
        }
    }
}
class WsHub {
    constructor() {
        this.wsSessionGroupMap = {};
    }
    //wsSessionGroupMap:Map<string,WsSessionGroup> = new Map
    addSession(groupName, session) {
        if (this.wsSessionGroupMap[groupName] == undefined) {
            const sessionGroup = new ThreadSessionGroup;
            sessionGroup.name = groupName;
            sessionGroup.wsSessions.push(session);
            this.wsSessionGroupMap[groupName] = sessionGroup;
            //If you wanna use uuid map
            // const uid = uuid()
            // this.wsSessionGroupMap[groupName].wsSessions[uid]=session
            console.log(`New group "${groupName}" created`);
        }
        else {
            this.wsSessionGroupMap[groupName].wsSessions.push(session);
            console.log(`Old group "${groupName}" connected`);
        }
    }
    deleteSession(groupName, session) {
        const sessionList = this.wsSessionGroupMap[groupName].wsSessions;
        sessionList.splice(sessionList.indexOf(session), 1);
        console.log(`A member from group "${groupName}" disconnected`);
        if (sessionList.length == 0) {
            delete this.wsSessionGroupMap[groupName];
            console.log(`Delete empty group "${groupName}"`);
        }
    }
    broadcastGroup(groupName, message) {
        const targetGroup = this.wsSessionGroupMap[groupName];
        targetGroup === null || targetGroup === void 0 ? void 0 : targetGroup.wsSessions.forEach((session) => {
            if (session.readyState === ws_1.default.OPEN) {
                session.send(message);
            }
        });
        console.log(`"${message}" from "${groupName}"`);
    }
}
class ThreadSessionGroup {
    constructor() {
        this.wsSessions = [];
    }
}
function parsePost(wsData) {
    const wsDataStr = wsData.toString();
    const ajv = new ajv_1.default({ allErrors: true });
    try {
        const wsDataJson = JSON.parse(wsDataStr);
        const isValid = ajv.validate(postSchema, wsDataJson);
        if (isValid) {
            return wsDataJson;
        }
        else {
            return null;
        }
    }
    catch (_a) {
        return null;
    }
}
//Express Web Server
//const EXPRESS_PORT=8080
const app = express_1.default();
app.get('/', (req, res) => {
    res.send("hello world");
});
app.get('/board', (req, res) => {
    //Get board name
});
app.get('/board/:boardName', (req, res) => {
    //Get all the thread in board
    try {
        PostModel.find().lean().exec((err, threads) => {
            res.json(threads);
        });
    }
    catch (_a) {
        res.json(errorMsg.toString(404));
    }
});
app.get('/board/:boardName/:threadId', (req, res) => {
    //Get all the post in thread
    try {
    }
    catch (_a) {
        res.json(errorMsg.toString(404));
    }
});
//Error Parse
const errorMsg = new ErrorMsg;
errorMsg.errorMap = {
    400: "Bad request",
    404: "Not found",
    1003: "Params error",
    500: "Internal server error",
};
//MongoDB
const mongoURL = `mongodb://${config_json_1.default.database.hostname}:${config_json_1.default.database.port}/${config_json_1.default.database.name}`;
const PostModel = typegoose_1.getModelForClass(Post);
mongoose_1.default.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true }).catch(err => {
    console.log(err);
});
const db = mongoose_1.default.connection;
db.on('error', console.error.bind(console, 'error when connecting to mongodb'));
db.once('open', () => {
    console.log("MongoDB is working");
});
//Server
const PORT = config_json_1.default.server.port;
const httpServer = http_1.default.createServer();
httpServer.on('request', app); //app=express() is a callback function
httpServer.on('upgrade', (req, socket, head) => {
    const pathname = url_1.default.parse(req.url).pathname;
    if (pathname === '/board') {
        boardWs.handleUpgrade(req, socket, head, (webSocketConn) => {
            boardWs.emit('connection', webSocketConn, req);
        });
    }
    else if (pathname === '/thread') {
        threadWs.handleUpgrade(req, socket, head, (webSocketConn) => {
            threadWs.emit('connection', webSocketConn, req);
        });
    }
    else {
        socket.destroy();
    }
});
httpServer.listen(PORT, () => {
    console.log(`Listening ${PORT}`);
});
//Websocket Board Server
//Stupid you can't do that! A http server can only bind a websocket server. 
//Actually you can use node http server. 
const boardHub = new WsHub;
const boardWs = new ws_1.default.Server({
    noServer: true
});
boardWs.on('connection', (webSocketConn, req) => {
    webSocketConn.send("Hello World");
});
//Websocket Thread Server
const threadHub = new WsHub;
const threadWs = new ws_1.default.Server({
    noServer: true
});
threadWs.on('connection', (webSocketConn, req) => {
    threadApp(webSocketConn, req);
});
function threadApp(webSocketConn, req) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        //const urlParam = querystring.decode(urlParamMap!)
        try {
            const urlParamMap = url_1.default.parse(req.url, true);
            const sessionNameInURL = (_a = urlParamMap.query["name"]) === null || _a === void 0 ? void 0 : _a.toString();
            if (sessionNameInURL != undefined) {
                threadHub.addSession(sessionNameInURL, webSocketConn);
                webSocketConn.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
                    onPost(webSocketConn, message, sessionNameInURL);
                }));
                webSocketConn.on('close', () => {
                    threadHub.deleteSession(sessionNameInURL, webSocketConn);
                });
            }
            else {
                throw new Error('Params error');
            }
        }
        catch (_b) {
            webSocketConn.send(errorMsg.toString(1003));
            webSocketConn.close(1003, "Params error");
        }
    });
}
function onPost(webSocketConn, message, sessionGroupName) {
    return __awaiter(this, void 0, void 0, function* () {
        const messageParsed = parsePost(message);
        if (messageParsed != null) {
            const savedMsg = yield savePost(messageParsed);
            if (savedMsg != null) {
                const messageStr = JSON.stringify(savedMsg);
                threadHub.broadcastGroup(sessionGroupName, messageStr);
            }
            else {
                webSocketConn.send(errorMsg.toString(500));
            }
        }
        else {
            webSocketConn.send(errorMsg.toString(400));
        }
    });
}
function savePost(messageParsed) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let msgModel = new PostModel(messageParsed);
            const obj = yield msgModel.save();
            console.log("Post created");
            return obj;
        }
        catch (_a) {
            console.log("Post creating failed");
        }
    });
}
//# sourceMappingURL=index.js.map