//use import json to keep type check
import cfg from './config.json'
import {JSDOM} from 'jsdom'
import createDOMPurify from 'dompurify'
import * as xss from 'xss'

class ErrorMsg {
  errorMap: Record<number, string> = {
    400: "Bad request",
    404: "Not found",
    1003: "Params error",
    500:"Internal server error",
  }
  toString(code: number): string {
    if (this.errorMap[code] != undefined) {
        const msg={
          code: code,
          description:this.errorMap[code]
        }
        return JSON.stringify(msg)
    } else {
      const msg={
        code: 622,
        description:"Unknown error"
      }
      return JSON.stringify(msg)
      }
  }
  toObject(code: number){
    if (this.errorMap[code] != undefined) {
      const msg={
        code: code,
        description:this.errorMap[code]
      }
      return msg
  } else {
    const msg={
      code: 622,
      description:"Unknown error"
    }
    return msg
    }
}
  }
//Error Parse
export const errorMsg = new ErrorMsg

//const window = new JSDOM('').window
//@ts-ignore
//export const DOMPurify = createDOMPurify(window)

export const xssFilter = new xss.FilterXSS()