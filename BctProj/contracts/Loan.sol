pragma solidity >=0.5.0;

import "./Ownable.sol";
import "./LoanUtil.sol";

/**
 * @title Loan based contract
 * @notice This is an abstract contract should be derived be purpose loan contract.
 * It provides the basic storage for borrower, lender, and loan information.
 */
contract Loan is Ownable {
    
    // Custom type decalration
    enum Status { Requesting, Funding, Funded, FundWithdrawn, Repaid, Defaulted, Refunded, Cancelled, Closed }

    struct Lender {
        address payable account;
        uint lendingAmount;
        uint repaidAmount;
        uint refundedAmount;
        uint interestRate;
    }

    // state variables
    bytes32 _id;
    address _borrower;
    uint _loanAmount;
    uint _ownedAmount;
    uint _lenderCount;
    uint _creationTime;
    uint _fullyFundedTime;
    uint _dueDate;
    uint _repaidTime;
    uint _now;
    uint _interestRate;
    Status internal _status;

    // use for circuit breaker
    bool internal _stopped;

    mapping(address => Lender) internal _lenders;
    mapping(uint => address) internal _lenderAddr;

    /// events for loan lifecycle
    event Requesting(bytes32 indexed loanId, address indexed borrower, address owner);
    event Funding(bytes32 indexed loanId, address indexed lender, uint amount);
    event Funded(bytes32 indexed loanId, uint amount);
    event FundWithdrawn(bytes32 indexed loanId, uint amount);
    event Repaid(bytes32 indexed loanId, uint amount);
    event Defaulted(bytes32 indexed loanId, address indexed borrower, uint defaultedAmt, uint loanAmt);
    event Refunded(bytes32 indexed loanId, address indexed lender, uint amount);
    event Cancelled(bytes32 indexed loanId);
    event Stopped(bytes32 indexed loanId);
    event Resumed(bytes32 indexed loanId);
    event Closed(bytes32 indexed loanId);

    /// internal constructor to make abstract contract.
    constructor() internal { }

    /// modifiers to check loan in the required status.
    modifier isFunding { 
        require(_status == Status.Funding, "Required Status: Funding"); 
        _; 
    }
    
    modifier isFunded { 
        require(_status == Status.Funded, "Required Status: Funded"); 
        _; 
    }
    
    modifier isWithdrawn { 
        require(_status == Status.FundWithdrawn, "Required Status: Withdraw"); 
        _; 
    }
    
    modifier isRepaid { 
        require(_status == Status.Repaid, "Required Status: Repaid"); 
        _; 
    }

    modifier isDefaulted { 
        require(_status == Status.Defaulted, "Required Status: Defaulted"); 
        _; 
    }
    
    modifier isRefunded { 
        require(_status == Status.Refunded, "Required Status: Refunded"); 
        _; 
    }
    
    modifier isCancelled { 
        require(_status == Status.Cancelled, "Required Status: Cancelled"); 
        _; 
    }
    
    modifier isNotStopped { 
        require(_stopped != true, "The state of the contract is stopped by the owner, no operations allow at this time."); 
        _; 
    }
    
    /// Public abtract core loan functions.

    /**
     * @notice Setup the loan amount and borrower
     * @param borrower borrower's address
     * @param amount requested loan amount
     */
    function request(address borrower, uint amount) public;

    /**
     * @notice Lender deposit fund for the loan.
     */
    function depositFund(uint IRate) public payable;

    /**
     * @notice refund the deposited fund to the lender
     */
    function refund() public payable;
    
    /**
     * @notice Withdrawing the fund deposited by the lender to borrower account.
     */
    function withdrawToBorrower() public payable;

    /**
     * @notice borrower repay the loan amount to the contract address
     */
    function repay() public payable;

    /**
     * @notice Widthdraw fund from contract balance back to lender according to the loan amount
     */
    function withdrawToLenders() public payable;
    
    /**
     * @notice default the loan
     */
    function toDefault() public;
    
    /**
     * @notice to cancel the loan
     */
    function cancel() public;

    /**
     * @notice Put the contract in suspend state in the even or ermegency
     * @dev only owner can execute this function.
     */
    function stop() public onlyOwner {
        _stopped = true;
        emit Stopped(_id);
    }

    /**
     * @notice Take the contract out of suspend state.
     * @dev only only can execute this function
     */
    function resume() public onlyOwner {
        _stopped = false;
        emit Resumed(_id);
    }

    // Public property getters

    /**
     * @dev getter function for loan id
     * @return loan ID in string
     */
    function id() public view returns(bytes32) {
        return _id;
    }

    /**
     * @dev helper function to get lender by its address
     * @param addr lender address
     * @return lender's address, lending amount, and repaid amount in tuples.
     */
    function lenderBy(address addr) 
        public 
        view 
        returns(
            address p_lender, 
            uint p_lendingAmount, 
            uint p_repaidAmount, 
            uint p_refundedAmount,
            uint p_interestRate) 
    {
        if (addr == address(0)) {
            return (address(0), 0, 0, 0, 0);
        } else {
            Lender memory l = _lenders[addr];
            return (l.account, l.lendingAmount, l.repaidAmount, l.refundedAmount, l.interestRate);
        }
    }

    /**
     * @dev helper function to get lender address by index
     * @param idx position index
     * @return lender address
     */
    function lenderAddressAt(uint idx) public view returns(address) {
        return _lenderAddr[idx];
    }

    /**
     * @dev helper function to get lender from the mapping
     * @param idx the index position in lender address mapping
     * @return a lender info in tuples
     */
    function lenderAt(uint idx) 
        public 
        view 
        returns( 
            address p_lender, 
            uint p_lendingAmount, 
            uint p_repaidAmount, 
            uint p_refundedAmount,
            uint p_interestRate) 
    {
        return lenderBy(lenderAddressAt(idx));
    }

    /**
     * @dev getter for contract's balance
     * @return current balance of the contract
     */
    function balance() public view returns(uint) {
        return address(this).balance;
    }

    /**
     * @dev getter for status
     * @return current status according to the loan lifecycle
     */
    function status() public view returns(Status) {
        return _status;
    }

    /**
     * @dev getter for loan amount
     * @return the loan amount requested by the borrower
     */
    function loanAmount() public view returns(uint) {
        return _loanAmount;
    }

    /**
     * @dev getter for owned amount
     * @return the amount withdraw by the borrower
     */
    function ownedAmount() public view returns(uint) {
        return _ownedAmount;
    }

    /**
     * @dev getter for borrower
     * @return borrower address.
     */
    function borrower() public view returns(address) {
        return _borrower;
    }

    /**
     * @dev getter for lender counter
     * @return number of lenders for this contract
     */
    function lenderCount() public view returns(uint) {
        return _lenderCount;
    }

function dueDate() public view returns(uint) {
        return _dueDate;
    }
    function noww() public view returns(uint) {
        return now;
    }

   


    /**
     * @dev a web helper function get loan properties in one function 
     * instead of calling multiple getter function where the code is now readable.
     * @return tuple with loan property values.
     */
    function info() 
        public 
        view 
        returns(
            bytes32 p_id, 
            Status p_status, 
            uint p_balance, 
            uint p_loanAmount, 
            uint p_ownedAmount, 
            address p_borrower, 
            address p_owner, 
            uint p_lenderCount,
            uint p_dueDate,
            uint p_now)
    {
        p_id = id();
        p_status = status();
        p_balance = balance();
        p_loanAmount = loanAmount();
        p_ownedAmount = ownedAmount();
        p_borrower = borrower();
        p_owner = owner();
        p_lenderCount = lenderCount();
        p_dueDate = dueDate();
        p_now = noww();
    }
}