const TimeSecuredLoan = artifacts.require("./TimeSecuredLoan");
const MockTimeSecuredLoan = artifacts.require("./mocks/MockTimeSecuredLoan");

module.exports = function(deployer) {
    deployer.deploy(TimeSecuredLoan);
    deployer.deploy(MockTimeSecuredLoan);
};
