pragma solidity >=0.5.0;

/**
 * @title LoanUtil
 * @dev Just create out of learning and experimenting how library can be linked and used in contract.
 */
library LoanUtil {

    /**
     * @notice Simple random ID generator to for loan ID.
     * @dev Not unique proof as it is for project demonstration only.
     * @param addr1 borrower address
     * @param addr2 owner address
     * @return generated integer value
     */
    function generateId(address addr1, address addr2) internal view returns(bytes32) {
        uint256 generatedId = uint256(addr1) - uint256(addr2) + now;
        return bytes32(generatedId);
    }
}