This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).


## Before You Start
If you run into jquery, popper.js, and resolve-url-loader, you need to install the dependencies with npm.
```
npm install bootstrap
npm install jquery
npm install popper.js
npm install resolve-url-loader
```

### LocalStoage
Instead off using database to store some contract state, the web app use local storage. LocalStorage used by the web app is allowed by default, if you have some special setting preventing it, please temporary allow during evaluation.
![](public/img/md_localstorage.png?raw=true)

### Ganache
Please makesure Ganache is started with the default settings as shown below. Truffle config is configured to connect to Ganache for contract migration.

![Ganache](public/img/md_ganache.png?raw=true)

### Metamask 
Makesure you have Metamask Chrome extension installed and configure to connect to the local Ganache Network as shown below.

![MetaMask](public/img/md_metamask_config.png?raw=true)

To evaluate the application properly, it needs several accounts to act as owner (broker/admin), borrower, and lenders. Import the Ganache test accounts to the Metamask by using its private key.

![Metamask Accounts](public/img/md_metamask_accounts.png?raw=true)

You can switch account while the web app is running, it will refresh the page and use the current selected Metamask account.

## Available Scripts

In the client directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

## Application Walk-Thru

### ```All Loans (Default Index Page)```
A newly launch web app will not have any existing loans to it will display the following marketing page to ask user get a loan as shown below. For evaluator, please read the warning message and you can close it after that.

![All Loans](public/img/md_app_default.png?raw=true)

### ```New Loan Request```
In the right side of the top navigation bar, it displays current account used by Metamask. Fill out the form as shown in below. Make sure the borrower address is one of your Ganache test account and not the same as current account.

![New Loan](public/img/md_app_newloan.png?raw=true)

Click the 'Create Request' and it will submit 2 transactions. The first transction is deploying a new contract with the current metamask account as owner, and the second transaction is to set the borrower and loan amount. Ideally, there should be some KYC or review process between creating contract and reviewing it but in this demo, the 2 processes are combined into one. That's the reason you see 2 Metamask popup to confirm the transations.

***CONTRACT DEPLOYMENT*** is clearly shown in the first popup.

![New Loan](public/img/md_app_newloan_1.png?raw=true)

***CONTRACT INTERACTION*** is clearly shown in the second popup.

![New Loan](public/img/md_app_newloan_2.png?raw=true)

### ```All Loans```

The all loans page will display all the loans created / requested currently as shown below. Click the 'View Details' button will show the selected loan details.

![New Loan](public/img/md_app_allloans.png?raw=true)

### ```Loan Details```

> The applicatin is having a state refresh issue that I am still working on. After each submission or transaction, refresh the page again to see the updated loan information.

#### Fund It

***Make sure you switch to a different account in Metamask that is not the owner (broker/admin) or borrower.*** As a lender, you enter the amount you want to fund this loan. In this demonstration, it funded half of it as shown below. Click the 'Fund It !!!' button to submit the transaction. The network will transfer the given lending amount from the lender account to the contract address.

![Funding](public/img/md_app_loandetails_1.png?raw=true)

#### Refund It

***Make sure you switch back as owner (broker/admin) account in Metamask in order to perform the refund function. Otherwise, the function modifier will prevent user other than owner.*** As the owner, you can refund the contributed lending amount back to the lenders as long as the status of the loan is either in funding or funded but the balance is not withdrawn by the borrower yet.

Once refunded, you will see the status updated to *Refunded* and the amount of refunded to the lender as shown below.

![Refund](public/img/md_app_loandetails_2.png?raw=true)

### Withdrawn By Borrower 

Once that's enough lenders fund the loan, the status of the loan will become 'Funded' and the fund is ready for borrower to withdraw to his/her accounts.

![Borrower Withdraw](public/img/md_app_loandetails_3.png?raw=true)

***Make sure you switch to the borrower account in Metamask in order to perform the fund withdrawn function. Otherwise, the function modifier will prevent user other than the borrower.***

### Repay or Default By Borrower

Once the fund is withdrawn to the borrower account, the loan contract status become 'FundWithdrawn'. In this state, the borrower either can repay or default the loan as shown below.

![Repay or Default loan](public/img/md_app_loandetails_4.png?raw=true)

If the borrower defaulted the loan, the status of the loan will become 'Defaulted' as shown below.

![Defaulted loan](public/img/md_app_loandetails_6.png?raw=true)

### Withdraw Re-paid Fund Back to Lenders

***Make sure you switch back as owner (broker/admin) account in Metamask in order to perform the withdrawn fund back to lender function. Otherwise, the function modifier will prevent user other than owner.***

Once the borrwer re-pay the loan, the balance of the loan contract is ready to be transfer back to owners according to the loan amount they funded. Clicking 'Repay Lender In Full' will complete the loan lifecycle with the status as 'Closed' shown below. The amount paid back to lender is shown in lender information.

![Repay or Default loan](public/img/md_app_loandetails_5.png?raw=true)

