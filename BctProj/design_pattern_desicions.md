# Design Pattern Decisions

## Fail early and fail loud
All functions checks the condition required for execution as early as possible with function modifiers and in the function body and throws exception if the condition is not met.

```solidity
function request(address borrower, uint amount) public onlyOwner {
    require(borrower != address(0), "Address is empty");
    require(borrower != owner(), "Owner can't be borrower at the same time.");
    require(amount > 0, "0 is not a valid borrowing amount.");
    
    _borrower = borrower;
    _loanAmount = amount;
    _status = Status.Funding;
    emit Requesting(_id, _borrower, owner());
}
```

## Restricting Access
Function access is restricted to specific adddress such as owner or borrower of the contract. For example, the toDefault function is restricted to only borrower or owner of the contract.

```solidity
function toDefault() public isWithdrawn isNotStopped onlyBorrowerOrOwner {
    _status = Status.Defaulted;
    emit Defaulted(_id, _borrower, _ownedAmount, _loanAmount);
}
```

## Circuit Breaker
A function modifier is added to critical loan function so it can be stopped in the case a bug has been detected.

```solidity
function withdrawToLenders() public payable isRepaid isNotStopped onlyOwner {}
```

## State Machine
The loan contract lifecycle has certain states in which is behaves differently and different funcitons can and should be called.

```solidity
enum Status { Requesting, Funding, Funded, FundWithdrawn, Repaid, Defaulted, Refunded, Cancelled, Closed }
.
.
modifier isFunding { 
  require(_status == Status.Funding, "Required Status: Funding"); 
  _; 
}
.
.
function depositFund() public payable isFunding isNotStopped {...}
```

## Speed Bump
The time secure loan contract demonstrated speed bump in couple functions to slow down actions so if anything goes wrong, there is time to recover.

```solidity
contract TimeSecuredLoan is SimpleLoan {
    // Modifiers
    modifier onlyFullyFundedAfterOneDay { 
        require(onlyAfter(_fullyFundedTime + 1 days), "Authorized only after 1 day of fully funded"); 
        _; 
    
    }
    .
    .
    function withdrawToBorrower() public payable onlyFullyFundedAfterOneDay {
        super.withdrawToBorrower();
    }
    .
    .
}
```
