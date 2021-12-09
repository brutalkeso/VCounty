import Web3 from 'web3';
import { Contract } from "web3-eth-contract";
import * as readline from 'readline'
import { stdin as input, stdout as output } from 'process'
JSON=require('JSON')
import { readHexFromConsole, readNodeAddressFromConsole, Account } from "./Shared"
import { promises } from 'fs'

//const web3Instance=new Web3(new Web3.providers.HttpProvider("http://localhost:7545"))
//const web3Instance=new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/ADD_YOUR_TOKEN"))

//////////////////////////////// WEB3 ///////////////////////////////////////////////

function makeContract(web3Instance: Web3, contractAddress: string): Promise<Contract> {
    return promises.readFile('bin/contracts/VCounty.abi').then((abi) => {
        const abiJson=JSON.parse(abi.toString())
        const contract: Contract=new web3Instance.eth.Contract(
            abiJson,
            contractAddress,
            { gas: 1000000, gasPrice: '1000000000' }
        )
        return contract
    })
}

//////////////////////////////// MAIN ///////////////////////////////////////////////

class FunctionCall {
    function: Function
    address: string

    constructor(fIn: Function, aIn: string) {
        this.function=fIn
        this.address=aIn
    }
}

function readFunctionFromConsole(readlineInterface: readline.Interface): Promise<Function> {
    console.log("Choose function to run")
    for (const [key, value] of Object.entries(Function)) {
        if (isNaN(Number(key))) { continue }
        console.log(key+' '+value)
    }
    console.log('')
    return new Promise<Function>((resolve, reject) => {
        readlineInterface.question("Index: ", (inputValue) => {
            const index=parseInt(inputValue)
            if (isNaN(index)) {
                reject('input was not an index')
            } else if (!Object.values(Function).includes(index)) {
                reject('not a valid index')
            } else {
                resolve(index)
            }
        })
    })
}

function readFunctionCallFromConsole(readlineInterface: readline.Interface): Promise<FunctionCall> {
    return readFunctionFromConsole(readlineInterface).then((func) => {
        return readHexFromConsole('For address', 2, readlineInterface).then((addr) => {
            return new FunctionCall(func, addr)
        })
    })
}

//////////////////////////////// MAIN ///////////////////////////////////////////////

enum Function {
    FetchBadges,
    Mint
}

function main() {
    const rinkebyDeployedAddress='0x92c659C770B816De78722519Bd1D254d28Ca4128';
    const readlineInterface=readline.createInterface({ input, output })
    readHexFromConsole("Wallet address", 42, readlineInterface).then((address) => {
        return readHexFromConsole("Wallet key", 62, readlineInterface).then((key) => {
            return new Account(address, key)
        })
    }).then((acc) => {
        return readNodeAddressFromConsole(readlineInterface).then((web3NodeAddress: string) => {
            return { acc, web3NodeAddress }
        })
    }).then(({ acc, web3NodeAddress }) => {
        const web3Instance=new Web3(new Web3.providers.HttpProvider(web3NodeAddress))
        web3Instance.eth.accounts.wallet.add(acc.key)
        return makeContract(web3Instance, rinkebyDeployedAddress).then((contract) => {
            return { acc, contract }
        })
    }).then(({ acc, contract }) => {
        return readFunctionCallFromConsole(readlineInterface).then((fCall) => {
            switch (fCall.function) {
                case Function.FetchBadges:
                    return contract.methods.badgesOf(fCall.address).call({ from: acc.address })
                case Function.Mint:
                    throw Error('Not yet implemented')
                default:
                    throw Error('Non supported function specified')
            }
        })
    }).then((result) => {
        console.log("finished")
        console.log(result)
    }).catch((error) => {
        console.log(error)
    }).finally(() => {
        readlineInterface.close()
    })
}

main()
