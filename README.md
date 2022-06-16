# P2P-Lending-System

A decentralized blockchain platform for peer to peer lending.

P2P System provides a crowd sourced loan platform where the users can create a loan request and  the lender gets to choose the exact amount and the rate at which he wants to lend depending on his own risk assessment without any intermediary.

#### Features :
* Existing Loan Request
* Create new Loan Request
* Fund the Loan
* Refund
* Withdrawn by Borrower
* Account Defaulted or Repay
* Withdraw Re-paid fund back to Lenders
* Cancel Loan Request

#### Tech Stack :
* React with Web3
* Truffle
* Ganache
* Metamask
* Solidity

#### Setup:
Required NPM packages</br>
```npm install --save truffle-hdwallet-provider```</br>
```npm install --save dotenv```</br>
 
update the truffle-config.js:</br>
```const HDWalletProvider = require('truffle-hdwallet-provider');```</br>
```require('dotenv').config();```</br>
 
In .env add following config</br>
```MNEMONIC=[the mnemonic generated from metamask]```</br>
```INFURA_API_KEY=[INFURA KEY]```</br>

In client directory</br>
```npm start```</br>
*Open http://localhost:3000 in the browser*
