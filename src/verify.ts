import Ajv from 'ajv'
//use import json to keep type check
import cfg from './config.json'
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