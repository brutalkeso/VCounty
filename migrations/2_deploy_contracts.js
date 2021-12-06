const VCounty = artifacts.require("VCounty");

module.exports = function (deployer, network, accounts) {
    deployer.deploy(VCounty, [], { from: accounts[0] });
};