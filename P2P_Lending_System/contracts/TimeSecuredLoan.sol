pragma solidity >=0.5.0;

import "./SimpleLoan.sol";

/**
 * @title Time Secured Simple Loan
 * @notice Time secured loan inherit simple loan but with time protected modifier on the withdrawToBorrower
 * and withdrawToLenders so the fund can't transfer out from the contract account until the waiting period reached.
 * @dev This contract is created out of demonstrate one of the security best practices of writing solidty contract 
 * and also a different test cases is written specifically for it.
 */
contract TimeSecuredLoan is SimpleLoan {

    // Modifiers
    modifier onlyFullyFundedAfterOneDay { 
        require(onlyAfter(_fullyFundedTime + 1 days), "Authorized only after 1 day of fully funded"); 
        _; 
    
    }
    
    modifier onlyRepayAfterTwoDay { 
        require(_status == Status.Repaid, "Status should be in Repaid");
        require(onlyAfter(_repaidTime + 2 days), "Authorized only after 2 day of repay"); 
        _; 
    }

    modifier onlyCreatedAfterFiveDay { 
        require(onlyAfter(_creationTime + 5 days), "Authorized only after contract created 5 days"); 
        _; 
    }

    /**
     * @notice Setup the loan request with the borrower address and the loan amount
     * @dev only the owner (or the loan broker in this case) can setup the borrowing info.
     */
    function request(address borrower, uint amount) public {
        super.request(borrower, amount);
    }

    /**
     * @notice Deposit fund to the contract balance
     * @dev Anyone other than the owner and borrower in this case.
     */
    function depositFund(uint IRate) public payable {
        super.depositFund(IRate);
    }

    /**
     * @notice Return the deposit fund to lender
     * @dev It can only refund when the borrower hasn't withdrawn the fund. Only owner (contract brodker) can
     * execute the refund.
     */
    function refund() public payable {
        super.refund();
    }
    
    /**
     * @notice Withdrawing the fund deposited by the lender to borrower account.
     * @dev The withdraw only allow after 1 day of the loan is fully funded.
     */
    function withdrawToBorrower() public payable onlyFullyFundedAfterOneDay {
        super.withdrawToBorrower();
    }

    /**
     * @notice borrower repay the loan amount to the contract address
     */
    function repay() public payable {
        super.repay();
    }

    /**
     * @notice Widthdraw fund from contract balance back to lender according to the loan amount
     * @dev The withdraw only allow after 2 day of the loan is fully repaid.
     */
    function withdrawToLenders() public payable onlyRepayAfterTwoDay {
        super.withdrawToLenders();
    }
    
    /**
     * @notice default the loan
     */
    function toDefault() public onlyCreatedAfterFiveDay {
        super.toDefault();
    }
    
    /**
     * @notice to cancel the loan
     */
    function cancel() public {
        super.cancel();
    }

    /// Internal functions

    /**
     * @notice validate current time is greater or equal to given time.
     * @param _time  time in unix epock
     * @return true if now is greater or equal to given time
     */
    function onlyAfter(uint _time) internal view returns(bool) { 
        return now >= _time; 
    }
}