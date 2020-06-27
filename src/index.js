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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const mongodb_1 = require("mongodb");
const typegoose_1 = require("typegoose");
const cfg = require("./config.json");
class PostAnother {
}
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectID)
], PostAnother.prototype, "id", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectID)
], PostAnother.prototype, "threadId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], PostAnother.prototype, "nickname", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], PostAnother.prototype, "content", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], PostAnother.prototype, "token", void 0);
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
    typegoose_1.prop({ ref: PostAnother }),
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
class Tag {
}
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], Tag.prototype, "name", void 0);
class BoardSession {
}
const boardWs = new ws_1.default.Server({
    port: cfg.server.port,
    path: "/board",
});
boardWs.on('connection', (socket) => {
});
//# sourceMappingURL=index.js.map