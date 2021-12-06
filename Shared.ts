import { promises } from 'fs'
import * as readline from 'readline'

class Account {
    address: string
    key: string

    constructor(address: string, key: string) {
        this.address=address
        this.key=key
    }
}

function readStringFromConsole(name: string, minLength: number, readlineInterface: readline.Interface): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        readlineInterface.question(name+': ', (inputValue) => {
            if (inputValue.length<minLength) {
                reject('input too short')
            } else if (inputValue.substring(0, 2)!='0x') {
                reject('address should start with 0x')
            } else {
                resolve(inputValue)
            }
        })
    })
}

function readNodeAddressFromConsole(readlineInterface: readline.Interface): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        readlineInterface.question("Web3 node address: ", (inputValue) => {
            if (inputValue.length>0) {
                resolve(inputValue)
            } else {
                reject('no input')
            }
        })
    })
}

export { readStringFromConsole, readNodeAddressFromConsole, Account }