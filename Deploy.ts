import Web3 from 'web3';
import { Contract } from "web3-eth-contract";
import * as readline from 'readline'
import { stdin as input, stdout as output } from 'process'
JSON=require('JSON')
import { promises } from 'fs'
import { readStringFromConsole, readNodeAddressFromConsole, Account } from "./Shared"

///////////////////////////////// WEB3 ///////////////////////////////////////////

class DeployedContract {
    contract: Contract
    ownerAddress: string

    constructor(contract: Contract, ownerAddress: string) {
        this.contract=contract
        this.ownerAddress=ownerAddress
    }
}

async function createContract(web3Instance: Web3): Promise<Contract> {
    const abi=await promises.readFile('bin/contracts/VCounty.abi')
    const abiJson=JSON.parse(abi.toString())
    return new web3Instance.eth.Contract(abiJson)
}

/* Deploys contract
 * Returns: On chain address of contract
 */
async function deployContract(
    web3Instance: Web3,
    deployParameters: DeployParameters
): Promise<DeployedContract> {
    const bytecode=await promises.readFile('bin/contracts/VCounty.bin')
    return createContract(web3Instance).then((contract) => {
        const deployReq=contract.deploy({ data: String(bytecode), arguments: [deployParameters.data] })
        return deployReq
            .send({
                from: deployParameters.acc.address,
                gas: 4000000,
                gasPrice: '1000000000'
            })
            .on('receipt', () => console.log('Contract deployed'))
            .then((contract: Contract) => new DeployedContract(contract, deployParameters.acc.address))
    })
}

//////////////////////////////// INPUT ///////////////////////////////////////////////

class DeployParameters {
    acc: Account
    data: string[]

    constructor(acc: Account, data: string[]) {
        this.acc=acc
        this.data=data
    }
}

function readDataFromConsole(readlineInterface: readline.Interface): Promise<Array<string>> {
    return new Promise<Array<string>>((resolve, reject) => {
        var arr: Array<string>=[]
        readlineInterface.on('line', (input) => {
            if (input!='') {
                arr.push(input)
            } else {
                resolve(arr)
            }
        })
    })
}

function readDeployParametersFromConsole(readlineInterface: readline.Interface): Promise<DeployParameters> {

    return readStringFromConsole("Wallet address", 42, readlineInterface).then((address) => {
        return readStringFromConsole("Wallet key", 62, readlineInterface).then((key) => {
            return new Account(address, key)
        })
    }).then((acc) => {
        console.log('---input data---')
        return readDataFromConsole(readlineInterface).then((data) => {
            return new DeployParameters(acc, data);
        })
    })
}

//////////////////////////////////// main ///////////////////////////////////

async function main() {
    const readlineInterface=readline.createInterface({ input, output })

    readDeployParametersFromConsole(readlineInterface).then((deployParameters) => {
        return readNodeAddressFromConsole(readlineInterface).then((web3NodeAddress) => {
            return { deployParameters, web3NodeAddress }
        })
    }).then(({ deployParameters, web3NodeAddress }) => {
        const web3Instance=new Web3(new Web3.providers.HttpProvider(web3NodeAddress))
        web3Instance.eth.accounts.wallet.add(deployParameters.acc.key);
        return deployContract(web3Instance, deployParameters)
    }).then((deployedContract) => {
        console.log(deployedContract)
    }).catch((error) => {
        console.log(error)
    }).finally(() => {
        readlineInterface.close()
    })
}

main()