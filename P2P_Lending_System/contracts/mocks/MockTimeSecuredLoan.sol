pragma solidity ^0.5.0;

import "../TimeSecuredLoan.sol";

/**
 * @title Mock Time Secured Simple Loan
 * @dev Mockup contract to have method to update the fullyfunded and repaid time so the test cases can be 
 * run accordingly.
 */
contract MockTimeSecuredLoan is TimeSecuredLoan {
    
    /**
     * @dev substract the fully funded time from the give time.
     * @param time in seconds
     */
    function moveBackFullyFundedTime(uint time) external {
        _fullyFundedTime -= time;
    }

    /**
     * @dev substract the repaid time from the give time.
     * @param time in seconds
     */
    function moveBackRepaidTime(uint time) external {
        _repaidTime -= time;
    }

    /**
     * @dev substract the creation time from the give time.
     * @param time in seconds
     */
    function moveBackCreationTime(uint time) external {
        _creationTime -= time;
    }
}