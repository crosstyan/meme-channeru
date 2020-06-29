import Ajv from 'ajv'
//use import json to keep type check
import cfg from './config.json'

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
}
//Error Parse
export const errorMsg = new ErrorMsg
