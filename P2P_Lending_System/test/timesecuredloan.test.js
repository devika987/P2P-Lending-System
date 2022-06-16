/**
 * Libraries and Dependencies
 */
const TimeSecuredLoan = artifacts.require('TimeSecuredLoan');
const MockTimeSecuredLoan = artifacts.require('MockTimeSecuredLoan');
const truffleAssert = require('truffle-assertions');

/**
 * Global variables used in all test cases.
 * enum Status { Requesting, Funding, Funded, FundWithdrawn, Repaid, Defaulted, Refunded, Cancelled, Closed }
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
const SECOND_IN_A_DAY = 60 * 60 * 24; 
const loanAmount = web3.utils.toWei(web3.utils.toBN(6), "ether");
const lendingAmt1 = web3.utils.toWei(web3.utils.toBN(1), "ether");
const lendingAmt2 = web3.utils.toWei(web3.utils.toBN(2), "ether");
const lendingAmt3 = web3.utils.toWei(web3.utils.toBN(3), "ether");

/**
 * Calculate the total gas cost of a transaction.
 * @param {transaction} tx 
 */
async function getTxGasCost(tx) {
    return web3.utils.toBN(tx.receipt.gasUsed).mul(web3.utils.toBN(await web3.eth.getGasPrice()));
}

/**
 * Tiime secured loan setup test cases to make sure override methods
 * and modifiers are still valid when calling parent method with super keyword.
 */
contract('TimeSecuredLoan-Setup', function(accounts)  {
    const owner = accounts[0];
    const borrower = accounts[1];    
    let loan;

    it("should create the new contract.", async() => {
        loan =  await TimeSecuredLoan.new();        
        assert.strictEqual(await loan.owner(), owner, "Owner address not matched.");
        assert.equal(await loan.status(), LoanStatus.Requesting, "new created loan not in requesting status.");
        assert.equal(await loan.borrower(), ADDRESS_EMPTY, "Borrower shoud be empty.");
        assert.equal((await loan.loanAmount()).toString(), "0", "Loan amount should be 0.");
    });

    it("should create the contract with borrowing info for funding", async() => {
        // Make sure this fails because this rely on parent method to protect it can be called by owner only.
        await truffleAssert.fails(loan.request(borrower, loanAmount, {from:borrower}), truffleAssert.ErrorType.REVERT);
        
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
 * Time secured loan funding and refund test cases to make sure override methods
 * and modifiers are still valid when calling parent method with super keyword.
 */
contract('TimeSecuredLoan-Fund-Refund', function(accounts) {
    const owner = accounts[0];
    const borrower = accounts[1];
    const lender1 = accounts[3];
    const lender2 = accounts[4];
    const lender3 = accounts[5];
    let loan;

    it("should be funded by 3 lenders with the amount of 1, 2, and 3 either", async() => {
        loan =  await TimeSecuredLoan.new();

        // Assert the depositFund method is still protected by the parent method isFunding modifier.
        await truffleAssert.fails(loan.depositFund({from: lender1, value: lendingAmt1}), 
            truffleAssert.ErrorType.REVERT, "Required Status: Funding");

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
 * Simple loan funding and witdrawing test cases to make sure override methods
 * and modifiers are still valid when calling parent method with super keyword.
 */
contract('TimeSecuredLoan-Borrower-Withdrawn', function(accounts) {
    const owner = accounts[0];
    const borrower = accounts[1];
    const lender1 = accounts[3];
    const lender2 = accounts[4];
    const lender3 = accounts[5];
    let loan;

    it('should fail witdrawn fund to the borrower before 1 day of fully funded', async() => {
        loan = await MockTimeSecuredLoan.new();
        await loan.request(borrower, loanAmount);
        await loan.depositFund({from: lender1, value: lendingAmt1});
        await loan.depositFund({from: lender2, value: lendingAmt2});
        await loan.depositFund({from: lender3, value: lendingAmt3});

        await truffleAssert.fails(loan.withdrawToBorrower({from:borrower}), truffleAssert.ErrorType.REVERT,
            "Authorized only after 1 day of fully funded");
    });

    it('should witdrawn fund to the borrower after 1 day of fully funded', async() => {
        await loan.moveBackFullyFundedTime(1 * SECOND_IN_A_DAY);
        tx = await loan.withdrawToBorrower({from:borrower});
        assert.strictEqual((await loan.status()).toNumber(), LoanStatus.FundWithdrawn, "Expecting loan status in FundWithdrawn.");
    });
});

/**
 * Time secured loan borrower repay to contract and withdrawing fund back to lender accounts
 * Test override methods and modifiers are still valid when calling parent method with super keyword.
 */
contract('TimeSecuredLoan-Lender-Widthdraw', function(accounts) {
    const owner = accounts[0];
    const borrower = accounts[1];
    const lender1 = accounts[3];
    const lender2 = accounts[4];
    const lender3 = accounts[5];
    let loan;

    it('should fail return fund to lenders before 2 days after repay.', async() => {
        loan = await MockTimeSecuredLoan.new();
        await loan.request(borrower, loanAmount);
        await loan.depositFund({from: lender1, value: lendingAmt1});
        await loan.depositFund({from: lender2, value: lendingAmt2});
        await loan.depositFund({from: lender3, value: lendingAmt3});
        
        await loan.moveBackFullyFundedTime(1 * SECOND_IN_A_DAY);
        await loan.withdrawToBorrower({from:borrower});
        await loan.repay({from: borrower, value: loanAmount});

        await truffleAssert.fails(loan.withdrawToLenders({from:owner}), 
            truffleAssert.ErrorType.REVERT, "Authorized only after 2 day of repay");
    });

    it('should return fund to lenders after 2 days after repay.', async() => {
        await loan.moveBackRepaidTime(2 * SECOND_IN_A_DAY);
        await loan.withdrawToLenders();
        assert.strictEqual((await loan.status()).toNumber(), LoanStatus.Closed, "Status should be closed");
    });
});

/**
 * Time secured loan default test cases.
 */
contract('TimeSecuredLoan-Default', function(accounts) {
    const owner = accounts[0];
    const borrower = accounts[1];

    const lender1 = accounts[3];
    const lender2 = accounts[4];
    const lender3 = accounts[5];

    const lendingAmt1 = web3.utils.toWei(web3.utils.toBN(2), "ether");
    const lendingAmt2 = web3.utils.toWei(web3.utils.toBN(3), "ether");
    const lendingAmt3 = web3.utils.toWei(web3.utils.toBN(5), "ether");

    const loanAmount = web3.utils.toWei(web3.utils.toBN(10), "ether");

    let loan;

    it('should fail default by the borrower before the contract created for 5 days', async() => {

        loan = await MockTimeSecuredLoan.new();
        await loan.request(borrower, loanAmount);
        await loan.depositFund({from: lender1, value: lendingAmt1});
        await loan.depositFund({from: lender2, value: lendingAmt2});
        await loan.depositFund({from: lender3, value: lendingAmt3});

        await loan.moveBackFullyFundedTime(1 * SECOND_IN_A_DAY);
        await loan.withdrawToBorrower({from:borrower});

        await truffleAssert.fails(loan.toDefault({from: borrower}), 
            truffleAssert.ErrorType.REVERT, "Authorized only after contract created 5 days");
        
    });

    it('should defaulted by the borrower after withdrawing the fund and after contract created 5 days ', async() => {
        await loan.moveBackCreationTime(5 * SECOND_IN_A_DAY);
        let tx = await loan.toDefault({from: borrower});
        assert.strictEqual((await loan.status()).toNumber(), LoanStatus.Defaulted, "Status should be Defaulted");
    });
});