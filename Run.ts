import Web3 from 'web3';
import { Contract } from "web3-eth-contract";
import * as readline from 'readline'
import { stdin as input, stdout as output } from 'process'
JSON=require('JSON')
import { readStringFromConsole, readNodeAddressFromConsole, Account } from "./Shared"
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

function main() {
    const rinkebyDeployedAddress='0xa47C95403C93937B32286a52AEBF803C3E659DA7';
    const readlineInterface=readline.createInterface({ input, output })
    readStringFromConsole("Wallet address", 42, readlineInterface).then((address) => {
        return readStringFromConsole("Wallet key", 62, readlineInterface).then((key) => {
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
            console.log("found contract")
            return contract.methods.badgesOf(acc.address).call({ from: acc.address })
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