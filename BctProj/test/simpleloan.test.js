/**
 * Libraries and Dependencies
 */
const LoanUtil = artifacts.require('LoanUtil');
const SimpleLoan = artifacts.require('SimpleLoan');
const truffleAssert = require('truffle-assertions');

/**
 * Global variables used in all test cases.
 */
const LoanStatus = { 
    Requesting: 0, 
    Funding: 1, 
    Funded: 2, 
    FundWithdrawn: 3, 
    Repaid: 4, 
    Defaulted: 5, 
    Refunded: 6, 
    Cancelled: 7, 
    Closed: 8 
};

// Empty address. Same as Address(0).
const ADDRESS_EMPTY = "0x0000000000000000000000000000000000000000";

const loanAmount = web3.utils.toWei(web3.utils.toBN(6), "ether");
const lendingAmt1 = web3.utils.toWei(web3.utils.toBN(3), "ether");
const lendingAmt2 = web3.utils.toWei(web3.utils.toBN(2), "ether");
const lendingAmt3 = web3.utils.toWei(web3.utils.toBN(1), "ether");


/**
 * Calculate the total gas cost of a transaction.
 * @param {transaction} tx 
 */
async function getTxGasCost(tx) {
    return web3.utils.toBN(tx.receipt.gasUsed).mul(web3.utils.toBN(await web3.eth.getGasPrice()));
}

/**
 * Simple loan setup test cases.
 */
contract('SimpleLoan-Setup', function(accounts)  {

    const owner = accounts[0];
    const borrower = accounts[1];
    let loan;

    it("should create the new contract.", async() => {
        
        loan =  await SimpleLoan.new();        
        assert.strictEqual(await loan.owner(), owner, "Owner address not matched.");
        assert.equal(await loan.status(), LoanStatus.Requesting, "new created loan not in requesting status.");
        assert.equal(await loan.borrower(), ADDRESS_EMPTY, "Borrower shoud be empty.");
        assert.equal((await loan.loanAmount()).toString(), "0", "Loan amount should be 0.");
    });

    it("should create the contract with borrowing info for funding", async() => {
        assert.equal(await loan.status(), LoanStatus.Requesting, "loan with borrowing info should be in requesting status.")
        tx = await loan.request(borrower, loanAmount);
        let loanId = await loan.id();
        await truffleAssert.eventEmitted(tx, 'Requesting', ev => {
            return ev.loanId === loanId && ev.borrower === borrower;
        });
        assert.equal(await loan.status(), LoanStatus.Funding, "loan with borrowing info should be in funding status.")
        assert.equal(borrower, await loan.borrower(), "borrower address not matched.");
        assert.equal(loanAmount.toString(), (await loan.loanAmount()).toString(), "Request loan amount not matched.");
    });
}); 

/**
 * Simple loan funding and refund test cases.
 */
contract('SimpleLoan-Fund-Refund', function(accounts) {
    const owner = accounts[0];
    const borrower = accounts[1];
    const lender1 = accounts[3];
    const lender2 = accounts[4];
    const lender3 = accounts[5];
    let loan;

    it("should be funded by 3 lenders with the amount of 2, 3, and 5 either", async() => {
        loan =  await SimpleLoan.new();
        await loan.request(borrower, loanAmount);

        await loan.depositFund({from: lender1, value: lendingAmt1});
        assert.equal(lendingAmt1.toString(), (await loan.ownedAmount()).toString(), "1st loan amount not match what just funded");

        await loan.depositFund({from: lender2, value: lendingAmt2});
        assert.equal(lendingAmt1.add(lendingAmt2).toString(), (await loan.ownedAmount()).toString(), "2nd loan amount not match what just funded");

        await loan.depositFund({from: lender3, value: lendingAmt3});
        assert.equal(lendingAmt1.add(lendingAmt2).add(lendingAmt3).toString(), String(await loan.ownedAmount()), "3nd loan amount not match what just funded");
        assert.equal((await loan.balance()).toString(), loanAmount.toString(), "Balance not matched");
        assert.equal(await loan.status(), LoanStatus.Funded, "Loan status should be funded");
    });

    it('should refund all the fund to the lender', async() => {

        expected_lender1_balance = web3.utils.toBN(await web3.eth.getBalance(lender1)).add(lendingAmt1);
        expected_lender2_balance = web3.utils.toBN(await web3.eth.getBalance(lender2)).add(lendingAmt2);
        expected_lender3_balance = web3.utils.toBN(await web3.eth.getBalance(lender3)).add(lendingAmt3);

        await loan.refund({from:owner});
        assert.equal((await loan.ownedAmount()).toString(), "0", "Expecting owned amount to be 0.");
        assert.equal((await loan.balance()).toString(), "0", "Expecting balance to be 0.");

        current_lender1_balance = web3.utils.toBN(await web3.eth.getBalance(lender1));
        assert.isTrue(current_lender1_balance.eq(expected_lender1_balance), 
            "curreunt value:" + current_lender1_balance.toString() + " expected value:" + expected_lender1_balance.toString());

        current_lender2_balance = web3.utils.toBN(await web3.eth.getBalance(lender2));
            assert.isTrue(current_lender2_balance.eq(expected_lender2_balance), 
            "curreunt value:" + current_lender2_balance.toString() + " expected value:" + expected_lender2_balance.toString());

        current_lender3_balance = web3.utils.toBN(await web3.eth.getBalance(lender3));
            assert.isTrue(current_lender3_balance.eq(expected_lender3_balance), 
            "curreunt value:" + current_lender3_balance.toString() + " expected value:" + expected_lender3_balance.toString());

        assert.equal(await loan.status(), LoanStatus.Refunded, "Loan status should be refunded");
    });

    it("should fail because the status is refunded", async() => {
        await truffleAssert.fails(loan.refund({from:owner}), truffleAssert.ErrorType.REVERT);
    });

});

/**
 * Simple loan funding and witdrawing test cases.
 */
contract('SimpleLoan-Fund-Witdrawn', function(accounts) {
    const owner = accounts[0];
    const borrower = accounts[1];
    const lender1 = accounts[3];
    const lender2 = accounts[4];
    const lender3 = accounts[5];
    let loan;

    it('should witdrawn all the fund to the borrower', async() => {

        loan = await SimpleLoan.new();
        await loan.request(borrower, loanAmount);
        await loan.depositFund({from: lender1, value: lendingAmt1});
        await loan.depositFund({from: lender2, value: lendingAmt2});
        await loan.depositFund({from: lender3, value: lendingAmt3});
        
        borrower_balance_before_withdrawn = web3.utils.toBN(await web3.eth.getBalance(borrower));
        
        tx = await loan.withdrawToBorrower({from:borrower});
        tx_cost = web3.utils.toBN(tx.receipt.gasUsed).mul(web3.utils.toBN(await web3.eth.getGasPrice()));

        let borrower_balance_after_withdrawn = web3.utils.toBN(await web3.eth.getBalance(borrower));
        
        // the balance after widthdrawn minus the loanAmount and add the transaction cost back to it should match 
        // the balance beforre widthdrawing fund.
        let balance_af = borrower_balance_after_withdrawn.sub(loanAmount).add(tx_cost);
        
        assert.strictEqual(borrower_balance_before_withdrawn.toString(), balance_af.toString(), 
            "borrower balance before withdrawn: " + web3.utils.fromWei(borrower_balance_after_withdrawn, "ether") + 
            ", borrower balancer after withdrawn: " + web3.utils.fromWei(balance_af, "ether"));

        assert.strictEqual((await loan.status()).toNumber(), LoanStatus.FundWithdrawn, "Expecting loan status in FundWithdrawn.");
    });

    it("should fail because the status is withdrawn", async() => {
        await truffleAssert.fails(loan.withdrawToBorrower({from:borrower}), truffleAssert.ErrorType.REVERT);
    });

});

/**
 * Simple loan borrower repay to contract and withdrawing fund back to lender accounts.
 */
contract('SimpleLoan-Borrower-Repay', function(accounts) {
    const owner = accounts[0];
    const borrower = accounts[1];
    const lender1 = accounts[3];
    const lender2 = accounts[4];
    const lender3 = accounts[5];
    let loan;

    it('should re-pay all the fund to the contract', async() => {

        loan = await SimpleLoan.new();
        await loan.request(borrower, loanAmount);
        await loan.depositFund({from: lender1, value: lendingAmt1});
        await loan.depositFund({from: lender2, value: lendingAmt2});
        await loan.depositFund({from: lender3, value: lendingAmt3});
        await loan.withdrawToBorrower({from:borrower});
        
        await truffleAssert.fails(loan.repay({from: owner}), truffleAssert.ErrorType.REVERT);
        
        let contract_balance_before_repay = await loan.balance();
        let balance_before_repay = web3.utils.toBN(await web3.eth.getBalance(borrower));
        let tx = await loan.repay({from: borrower, value: loanAmount});
        let balance_after_repay = web3.utils.toBN(await web3.eth.getBalance(borrower));
        let loanId = await loan.id();
        await truffleAssert.eventEmitted(tx, 'Repaid', ev => {
            return ev.loanId === loanId && ev.amount.toString() === loanAmount.toString();
        });
        let contract_balance_after_repay = await loan.balance();

        let txCost = await getTxGasCost(tx);
        assert.strictEqual(balance_after_repay.add(txCost).toString(), balance_before_repay.sub(loanAmount).toString());
        assert.strictEqual((await loan.status()).toNumber(), LoanStatus.Repaid, "Loan status should be in Repaid.");
        assert.strictEqual(contract_balance_after_repay.toString(), contract_balance_before_repay.add(loanAmount).toString(), "Contract balance not increase by the loan amoutn returned.");
    });

    it('should return all fund to lenders', async() => {
        let lenderCount = await loan.lenderCount();
        let lenders = [];
        for(i=0; i<lenderCount; i++) {
            let l = await loan.lenderAt(i);
            let lender = {'address': l[0], 'lendingAmount': l[1], 'repaidAmount': l[2]};
            lender.balance_before_widthdrawn = web3.utils.toBN(await web3.eth.getBalance(lender.address));
            lenders.push(lender)
        }
                
        await truffleAssert.fails(loan.withdrawToLenders({from:borrower}), truffleAssert.ErrorType.REVERT);
        
        let tx = await loan.withdrawToLenders();
        let loanId = await loan.id();
        await truffleAssert.eventEmitted(tx, 'Closed', ev => {
             return ev.loanId === loanId;
        });
        assert.strictEqual((await loan.status()).toNumber(), LoanStatus.Closed, "Status should be closed");
    
        for(i=0; i<lenders.length; i++) {
            let l = lenders[i];
            let lender = await loan.lenderBy(l.address);
            
            l.repaidAmount = lender[2];
            l.balance_after_widthdrawn = web3.utils.toWei(await web3.eth.getBalance(l.address), 'wei');
            assert.strictEqual(l.repaidAmount.toString(), l.lendingAmount.toString(), "Repaid amount not match lending amount.");
            assert.strictEqual(l.balance_before_widthdrawn.add(l.lendingAmount).toString(), l.balance_after_widthdrawn.toString(), "Lender balance should increase by the lending amount once widthdrawn repay fund.");
        } 
    });
});

/**
 * Simple loan default and cancel test cases.
 */
contract('SimpleLoan-Default-Cancel', function(accounts) {
    const owner = accounts[0];
    const borrower = accounts[1];
    const lender1 = accounts[3];
    const lender2 = accounts[4];
    const lender3 = accounts[5];
    let loan;

    beforeEach(async() => {
        loan = await SimpleLoan.new();
        await loan.request(borrower, loanAmount);
        await loan.depositFund({from: lender1, value: lendingAmt1});
        await loan.depositFund({from: lender2, value: lendingAmt2});
        await loan.depositFund({from: lender3, value: lendingAmt3});
    })

    it('should defaulted by the borrower', async() => {

        await truffleAssert.fails(loan.toDefault(), truffleAssert.ErrorType.REVERT, "Required Status: Withdraw");
        await loan.withdrawToBorrower({from:borrower});

        await truffleAssert.fails(loan.toDefault({from: lender1}), truffleAssert.ErrorType.REVERT, "Authorized for borrower or owner only");
        let tx = await loan.toDefault({from: borrower});        
        let rec = {'id': await loan.id(), 'borrower': borrower, 'ownedAmount': await loan.ownedAmount(), 'loanAmount': await loan.loanAmount()};
        await truffleAssert.eventEmitted(tx, 'Defaulted', ev => {
            return ev.loanId === rec.id && ev.borrower === rec.borrower
                && ev.defaultedAmt.toString() === rec.ownedAmount.toString() 
                && ev.loanAmt.toString() === rec.loanAmount.toString();
        });

        assert.strictEqual((await loan.status()).toNumber(), LoanStatus.Defaulted, "Status should be Defaulted");
    });

    it('should defaulted by the owner', async() => {
        await loan.withdrawToBorrower({from:borrower});
        await loan.toDefault({from: owner});
        assert.strictEqual((await loan.status()).toNumber(), LoanStatus.Defaulted, "Status should be Defaulted");
    });

    it('should be cancelled by borrower', async() => {
        let newloan = await SimpleLoan.new();
        await newloan.request(borrower, loanAmount);
        await truffleAssert.fails(newloan.cancel({from:lender1}), truffleAssert.ErrorType.REVERT, "Authorized for borrower or owner only");
        
        let tx = await newloan.cancel({from: borrower});
        let loanId = await newloan.id();
        await truffleAssert.eventEmitted(tx, 'Cancelled', ev => {
            return ev.loanId === loanId;
        });
        assert.strictEqual((await newloan.status()).toNumber(), LoanStatus.Cancelled, "Status should be Cancelled");
    });

    it('should be cancelled by owner', async() => {
        let newloan = await SimpleLoan.new();
        await newloan.request(borrower, loanAmount);
        await newloan.cancel({from: owner});
        assert.strictEqual((await newloan.status()).toNumber(), LoanStatus.Cancelled, "Status should be Cancelled");
    });

    it('should not be cancelled when borrower withdrawn the money', async() => {
        await loan.withdrawToBorrower({from:borrower});
        await truffleAssert.fails(loan.cancel({from:borrower}), truffleAssert.ErrorType.REVERT, "Can't cancelled contract when fund is provided. Use refund function");
    });

});