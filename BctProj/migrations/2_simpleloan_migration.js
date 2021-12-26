const SimpleLoan = artifacts.require("./SimpleLoan");
const LoanUtil = artifacts.require("./LoanUtil");
// const StringLib = artifacts.require("./StringLib");
// const StringUtils = artifacts.require("./StringUtils");


module.exports = function(deployer) {
    
    // deployer.deploy(StringLib);
    // deployer.link(StringLib, StringUtils);
    // deployer.deploy(StringUtils);
    // deployer.link(StringUtils, SimpleLoan);
    deployer.deploy(LoanUtil);
    deployer.link(LoanUtil, SimpleLoan);
    deployer.deploy(SimpleLoan);
};
