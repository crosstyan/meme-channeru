"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const typegoose_1 = require("@typegoose/typegoose");
const querystring = __importStar(require("querystring"));
const ajv_1 = __importDefault(require("ajv"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const url_1 = __importDefault(require("url"));
//use typescript-json-schema (https://github.com/YousefED/typescript-json-schema)
//to compile the interface to JSON Schema
const postSchema = require('./PostSchema.json');
class PostClass {
}
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], PostClass.prototype, "id", void 0);
__decorate([
    typegoose_1.prop({ required: true }),
    __metadata("design:type", String)
], PostClass.prototype, "nickname", void 0);
__decorate([
    typegoose_1.prop({ required: true }),
    __metadata("design:type", String)
], PostClass.prototype, "content", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], PostClass.prototype, "token", void 0);
__decorate([
    typegoose_1.prop({ required: true }),
    __metadata("design:type", String)
], PostClass.prototype, "threadId", void 0);
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
// app.listen(EXPRESS_PORT, () => {
//   console.log(`Express is listening ${EXPRESS_PORT}`)
// })
//Error Parse
const errorMsg = new ErrorMsg;
errorMsg.errorMap = {
    400: "Bad request",
    404: "Not found",
};
//MongoDB
// const mongoURL = "mongodb://localhost:27017/wschat"
// mongoose.connect(mongoURL, { useNewUrlParser: true })
// const db=mongoose.connection
// db.on('error', console.error.bind(console, 'error when connecting to mongodb'))
// db.once('open', () => { //Do something when db connection on. 
//   const PostModel=getModelForClass(Post)
// })
//Server
const PORT = 8081;
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
//Actually you can
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
    var _a, _b;
    const reParam = (_a = req.url) === null || _a === void 0 ? void 0 : _a.match(/(?<=\?).+/);
    const urlParam = querystring.decode(reParam[0]);
    const sessionNameInURL = (_b = urlParam.name) === null || _b === void 0 ? void 0 : _b.toString();
    if ('name' in urlParam) {
        threadHub.addSession(sessionNameInURL, webSocketConn);
    }
    else {
        webSocketConn.close(1003, "Params aren't correct. ");
    }
    webSocketConn.on('message', (message) => {
        const messageParsed = parsePost(message);
        if (messageParsed != null) {
            const messageStr = JSON.stringify(messageParsed);
            threadHub.broadcastGroup(sessionNameInURL, messageStr);
        }
        else {
            webSocketConn.send(errorMsg.toString(400));
        }
    });
    webSocketConn.on('close', () => {
        threadHub.deleteSession(sessionNameInURL, webSocketConn);
    });
}
//# sourceMappingURL=test.js.map