import * as readline from 'readline'
import Web3 from 'web3';

class Account {
    address: string
    key: string

    constructor(address: string, key: string) {
        this.address=address
        this.key=key
    }
}

function readHexFromConsole(name: string, minLength: number, readlineInterface: readline.Interface): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        readlineInterface.question(name+': ', (inputValue) => {
            if (inputValue.length<minLength||inputValue.length<2) {
                reject('input too short')
            } else if (inputValue.substring(0, 2)!='0x') {
                reject('hex should start with 0x')
            } else {
                resolve(inputValue)
            }
        })
    })
}

function getGasPrice(web3Node: string) {
    const web3Instance=new Web3(new Web3.providers.HttpProvider(web3Node))
    web3Instance.eth.getGasPrice().then((p) => {
        console.log(p)
    }).catch((e) => {
        console.log(e)
    })
}

function readLineFromConsole(name: string, readlineInterface: readline.Interface): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        readlineInterface.question(name+': ', (inputValue) => {
            if (inputValue.length>0) {
                resolve(inputValue)
            } else {
                reject('no input')
            }
        })
    })
}

export { readHexFromConsole, readLineFromConsole, getGasPrice, Account }
