const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")


module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()

    const args = [0]
    const Nft = await deploy("BasicNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: 1
    })


}
module.exports.tags = ["all", "test"]
