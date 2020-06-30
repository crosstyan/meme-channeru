import Ajv from 'ajv'
//use import json to keep type check
import cfg from './config.json'
import WebSocket from 'ws'
//AJV Config
//use typescript-json-schema (https://github.com/YousefED/typescript-json-schema)
//to compile the interface to JSON Schema
//IDK why typescript doesn't let me to use import
//Anyway type checking is not needed in schema
import SCHEMA_DEF = require('./schemaDef.json') 
//import SCHEMA=require('./schemaDef.json')
export const postSchema = SCHEMA_DEF.definitions.PostInterface
export const boardSchema = SCHEMA_DEF.definitions.BoardInterface
export const threadSchema = SCHEMA_DEF.definitions.ThreadInterface
export const userSchema=SCHEMA_DEF.definitions.UserInterface
export const ajv = new Ajv({ allErrors: true })

export function verifyObject(postBody:object,verifySchema:object){
  try {
    const isValid = ajv.validate(verifySchema,postBody)
    if (isValid) {
      return postBody
    } else {
      return null
    }
  } catch{
    return null
  }
}

export function verifyString(wsData:WebSocket.Data,verifySchema:object):object|null{
  const wsDataStr = wsData.toString()
  try {
    const wsDataJson = JSON.parse(wsDataStr)
    const isValid = ajv.validate(verifySchema,wsDataJson)
    if (isValid) {
      return wsDataJson
    } else {
      return null
    }
  } catch{
    return null
  }
}