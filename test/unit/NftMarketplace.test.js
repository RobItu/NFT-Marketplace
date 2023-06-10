const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config.js")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NftMarketplace test", function () {
        const chainId = network.config.chainId
        let Nft, deployer
        
        beforeEach(async function () {
            await deployments.fixture(["all"])
            deployer = (await getNamedAccounts()).deployer
            Nft = await ethers.getContract("NftMarketplace", deployer)
        })

        describe("listItem", function () {
            it("Reverts with error when price is 0", async () => {
                const burnerAddress = "0xdDc3535f10beeB6485AFa65693fDA30048Eb7207"
                await expect(Nft.listItem(burnerAddress, 0, 0)).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero()")
            })
            // it("Reverts with error when NFT is not approved", async () => {
            //     const burnerAddress = "0xdDc3535f10beeB6485AFa65693fDA30048Eb7207"
            //     await expect(Nft.listItem(burnerAddress, 1, 1)).to.be.revertedWith("NftMarketplace__NotApprovedForMarketplace()")
            // })
        })
    })