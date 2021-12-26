# Consensys Academy 2018-2019 Developer Program - Final Project

## Simple Loan (IOU) Application
A simple IOU (I Owe You) application that allow a user to get a loan from its friends or family member by using Ethereum smart contract. 

### User Stories
* A user sign into the web app. The web app reads the address and identifies that user by its address. The user is looking for a loan from his/her friends and family by creating a loan request with its address and the amount needed.

* The web app adminstrator (in this case act as the broker) review the request and create and deploy the smart contract to the network.

* A user (act as lender) sign into the web app, select the loan request that he/she wants to fund and submit the amount of fund he/she willing to lend.

* The borrower will withdraw the loan amout from the contract to his/her wallet once the amount of lending match the requested loan amount.

* The broker can refund the ether back to the lender if the borrower hasn't withdraw the money yet.

* The borrower repay the loan by transfering ether from his/her wallet to the contract.

* The broker can withdraw the fund back to the lenders according to the amount they put it.

* The borrower can default the loan if he/she can no longer pay back.

* The borrower or broker can cancel the loan request if there isn't any lender yet.

### Contracts
* **_Owable_** - The Ownable contract has an owner address, and provides basic authorization control functions, this simplifies the implementation of "user permissions"
* **_Loan_** - Abstract class inherit from owable to provide core loan functions and storage
* **_Simple Loan_** - Inherit from Loan Implementing simpel loan function
* **_Loan Util_** - With only one function to generate a loan ID. This util class is used for demonstrate how to link a smart contract library to a contract
* ~~**_StringLib_**~~ - No longer use. Will be Remove. I leave it in there so I can use it as sample how to link the library together in the truffl migration file.

### Truffle Testing
To run truffle testing, you need to install [truffle-assertions](https://www.npmjs.com/package/truffle-assertions)

```
npm install --save-dev truffle-assertions
npm install dotenv
```

[Ganache](https://truffleframework.com/ganache) is expected to run with the unit test cases
```
development: {
    host: "127.0.0.1", // Localhost (default: none)
    port: 7545,        // Standard Ethereum port (default: none)
    network_id: "*",   // Any network (default: none)
},
```

Run the test with the following command
```
truffle test
```
Sample output from the test cases
```
  Contract: SimpleLoan-Setup
    ✓ should create the new contract. (179ms)
    ✓ should create the contract with borrowing info for funding (177ms)

  Contract: SimpleLoan-Fund-Refund
    ✓ should be funded by 3 lenders with the amount of 2, 3, and 5 either (465ms)
    ✓ should refund all the fund to the lender (218ms)
    ✓ should fail because the status is refunded (51ms)

  Contract: SimpleLoan-Fund-Witdrawn
    ✓ should witdrawn all the fund to the borrower (466ms)
    ✓ should fail because the status is withdrawn (42ms)

  Contract: SimpleLoan-Borrower-Repay
    ✓ should re-pay all the fund to the contract (630ms)
    ✓ should return all fund to lenders (339ms)

  Contract: SimpleLoan-Default-Cancel
    ✓ should defaulted by the borrower (339ms)
    ✓ should defaulted by the owner (163ms)
    ✓ should be cancelled by borrower (320ms)
    ✓ should be cancelled by owner (235ms)
    ✓ should not be cancelled when borrower withdrawn the money (170ms)

  Contract: TimeSecuredLoan-Setup
    ✓ should create the new contract. (161ms)
    ✓ should create the contract with borrowing info for funding (239ms)

  Contract: TimeSecuredLoan-Fund-Refund
    ✓ should be funded by 3 lenders with the amount of 1, 2, and 3 either (487ms)
    ✓ should refund all the fund to the lender (173ms)
    ✓ should fail because the status is refunded (38ms)

  Contract: TimeSecuredLoan-Borrower-Withdrawn
    ✓ should fail witdrawn fund to the borrower before 1 day of fully funded (369ms)
    ✓ should witdrawn fund to the borrower after 1 day of fully funded (156ms)

  Contract: TimeSecuredLoan-Lender-Widthdraw
    ✓ should fail return fund to lenders before 2 days after repay. (534ms)
    ✓ should return fund to lenders after 2 days after repay. (150ms)

  Contract: TimeSecuredLoan-Default
    ✓ should fail default by the borrower before the contract created for 5 days (459ms)
    ✓ should defaulted by the borrower after withdrawing the fund and after contract created 5 days  (139ms)


  25 passing (9s)
```

## Front-end Web Application
The front-end web application is in the **client** folder. The web application is developed with ReactJS with Web3. Please see the ***READM.md*** in the client folder for how to run the application.

## ROPSTEN Network Deployment
Instead of using a local GETH deploy to ROPSTEN, the truffle is configured to use INFURA.

```
ropsten: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`),
      network_id: 3,       // Ropsten's id
      gas: 5500000,        // Ropsten has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
```

Required NPM packages
```
npm install --save truffle-hdwallet-provider
npm install --save dotenv
```
Please update the truffle-config.js to include the require libraries
```
const HDWalletProvider = require('truffle-hdwallet-provider');
require('dotenv').config();
```
The configuration values for process.env.XXX are stored in .env file that is not checked-in to GIT to protect the mnemonic and project key (given by INFURA).
Sameple .env file shown below
```
MNEMONIC=[the mnemoic generated from your metamask or wallet account]
INFURA_API_KEY=[INFURA PROJECT KEY]
```
