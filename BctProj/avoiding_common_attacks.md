# Avoiding Common Attacks

## Static Analysis
Solidity static analysis framework to find vulnerabilities, enhance their code comphrehension, and quickly prototype custom analyses.

### Slither
Use slither static analysis framework with detectors for many common Solidity issues. It has taint and value tracking capabilities and is written in Python.

#### Features
* Detects vulnerable Solidity code with low false positives
* Identifies where the error condition occurs in the source code
* Easy integration into continuous integration and Truffle builds
* Built-in 'printers' quickly report crucial contract information
* Detector API to write custom analyses in Python
Ability to analyze contracts written with Solidity >= 0.4
Intermediate representation (SlithIR) enables simple, high-precision analyses

It scan and found some of the following issues:
```solidity
SimpleLoan.refund has external calls inside a loop:
        - lender.account.transfer(refundAmt) (SimpleLoan.sol#104)
Reference: https://github.com/trailofbits/slither/wiki/Vulnerabilities-Description/_edit#calls-inside-a-loop
```
## Code Review

### Contract Safety and Security Checklist 

https://www.kingoftheether.com/contract-safety-checklist.html

