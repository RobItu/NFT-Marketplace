const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify.js")


module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()

    const args = []
    const Nft = await deploy("NftMarketplace", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: 1
    })
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        verify(Nft.address, args)
    }

}
module.exports.tags = ["all", "marketplace"]
