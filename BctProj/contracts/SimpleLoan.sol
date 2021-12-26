pragma solidity >=0.5.0;

import "./Loan.sol";
import {LoanUtil} from "./LoanUtil.sol";

/**
 * @title Simple loan contract
 * @notice Simple loan contract inherit from the Loan contract that allows a borrower request loan that can be funded by 
 * several lenders. Lender will deposit ether to the contract account, once it matches the loan
 * amount requested by the borrower, the borrower can withdraw the fund to its account. Once ready, 
 * the borrower can repay the loan by deposit the money to the contract account. The lender can withdraw the 
 * fund back from the contract to their wallets account.
 * @dev The simple loan contract is to demonstrate basic deposit and withdrawal of ether between contracts and 
 * wallets
 */
contract SimpleLoan is Loan {
    
    /**
     * @dev Default constructor to setup the initial simple loan contract
     */
    constructor() public {
        _status = Status.Requesting;
        _id = LoanUtil.generateId(_borrower, owner());
        //_creationTime = now;
    }

    // Modifier functions
    modifier onlyBorrowerOrOwner { 
        require(msg.sender == _borrower || msg.sender == owner(), "Authorized for borrower or owner only."); 
        _; 
    }
    
    modifier onlyBorrower { 
        require(msg.sender == _borrower, "Authorized for borrower only."); 
        _; 
    }

    modifier canRefund { 
        require(_status == Status.Funding || _status == Status.Funded, "Required Status: Funding or Funded"); 
        _; 
    }

    
    // Public functions

    /**
     * @notice Setup the loan request with the borrower address and the loan amount
     * @dev only the owner (or the loan broker in this case) can setup the borrowing info.
     */
    function request(address borrower, uint amount) public  {
        require(borrower != address(0), "Address is empty");
       // require(borrower != owner(), "Owner can't be borrower at the same time.");
        require(amount > 0, "0 is not a valid borrowing amount.");
        
        _borrower = borrower;
        _loanAmount = amount;
        _status = Status.Funding;
        emit Requesting(_id, _borrower, owner());
    }
    
    /**
     * @notice Deposit fund to the contract balance
     * @dev Anyone other than the owner and borrower in this case.
     */
    function depositFund(uint IRate) public payable isFunding isNotStopped {
        require(msg.value <= _loanAmount, "Lending amount is more the amount requested.");
        require(msg.value <= _loanAmount - _ownedAmount, "Lending amount is more than remaining fund needed.");
        require(_lenders[msg.sender].account == address(0), "Existing lender.");
        require(msg.sender != owner(), "Owner can't be a lender in the same contract.");
        require(msg.sender != _borrower, "Borrower can't be a lender in the same contract.");

        _lenders[msg.sender] = Lender({account: msg.sender, lendingAmount: msg.value, repaidAmount: 0, refundedAmount: 0, interestRate: IRate});
        _lenderAddr[_lenderCount] = msg.sender;
        _lenderCount++;
        _ownedAmount += msg.value;
        emit Funding(_id, msg.sender, msg.value);

        /// set the status to funded when the fund reach the requested amount.
        if (balance() == _loanAmount) {
            _status = Status.Funded;
            _fullyFundedTime = now;
        for(uint i = 0; i < _lenderCount; i++) {
            Lender memory lender = _lenders[_lenderAddr[i]];
            if (lender.account != address(0))
            {
                _ownedAmount +=lender.interestRate;
            }
        }
            emit Funded(_id, _loanAmount);

        }
    }

    /**
     * @notice Return the deposit fund to lender
     * @dev It can only refund when the borrower hasn't withdrawn the fund. Only owner (contract brodker) can
     * execute the refund.
     */
   /*  function refundAfterDefaulted() public payable  isNotStopped onlyOwner {
       // require(_ownedAmount == balance(), "Balance is not enough to refund all lenders.");

         for(uint i = 0; i < _lenderCount; i++) {
            Lender memory lender = _lenders[_lenderAddr[i]];
            if (lender.account != address(0))
            {
                uint refundAmt = lender.lendingAmount;
                lender.refundedAmount = refundAmt;
                _lenders[_lenderAddr[i]] = lender;

                address refundAddr = lender.account;
                _ownedAmount -= refundAmt;

                lender.account.transfer(refundAmt);
                emit Refunded(_id, refundAddr, refundAmt);
            }
        }
        _status = Status.Refunded;
     }
*/
    function refund() public payable  isNotStopped onlyOwner {
       // require(_ownedAmount == balance(), "Balance is not enough to refund all lenders.");

        for(uint i = 0; i < _lenderCount; i++) {
            Lender memory lender = _lenders[_lenderAddr[i]];
            if (lender.account != address(0))
            {
                uint refundAmt = lender.lendingAmount;
                lender.refundedAmount = refundAmt;
                _lenders[_lenderAddr[i]] = lender;

                address refundAddr = lender.account;
                _ownedAmount -= refundAmt;

                lender.account.transfer(refundAmt);
                emit Refunded(_id, refundAddr, refundAmt);
            }
        }
        _status = Status.Refunded;
    }
    
    /**
     * @notice Withdrawing the fund deposited by the lender to borrower account.
     */
    function withdrawToBorrower() public payable isFunded isNotStopped onlyBorrower {
        require(balance() > 0, "The balance is 0 currently.");
        _status = Status.FundWithdrawn;
        msg.sender.transfer(balance());
        _creationTime = now;
        _dueDate = _creationTime + 1 days;
        emit FundWithdrawn(_id, _ownedAmount);
    }

    /**
     * @notice borrower repay the loan amount to the contract address
     */
    function repay() public payable isWithdrawn isNotStopped onlyBorrower {
        require(msg.value == _ownedAmount, "Repaid amount not the same as amount owned.");
        _ownedAmount -= msg.value;
        _status = Status.Repaid;
        _repaidTime = now;
        emit Repaid(_id, msg.value);
    }

    /**
     * @notice Widthdraw fund from contract balance back to lender according to the loan amount
     */
    function withdrawToLenders() public payable isRepaid isNotStopped onlyOwner {
        //require(_loanAmount == balance(), "Balance is not enough to refund all lenders.");
        for(uint i = 0; i < _lenderCount; i++) {
            Lender memory lender = _lenders[_lenderAddr[i]];
            if (lender.account != address(0))
            {

                lender.repaidAmount = lender.lendingAmount+lender.interestRate;
                _lenders[_lenderAddr[i]] = lender;
                lender.account.transfer(lender.repaidAmount);
            }
        }
        _status = Status.Closed;
        emit Closed(_id);
    }
    
    /**
     * @notice default the loan
     */
     
    function toDefault() public isNotStopped onlyBorrowerOrOwner {
        
        _status = Status.Defaulted;
    
        emit Defaulted(_id, _borrower, _ownedAmount, _loanAmount);
         
    }
    
    /**
     * @notice to cancel the loan
     */
    function cancel() public isNotStopped onlyBorrowerOrOwner {

        require(_status == Status.Refunded || _ownedAmount == 0, "Can't cancelled contract when fund is provided. Use refund function.");
        _status = Status.Cancelled;
        emit Cancelled(_id);
    }

}