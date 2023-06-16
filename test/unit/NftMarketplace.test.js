const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config.js")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NftMarketplace test", function () {
        const chainId = network.config.chainId
        let Nft, deployer,player
        const PRICE = ethers.utils.parseEther("0.1")
        const TOKEN_ID = 0
        
        beforeEach(async function () {
            await deployments.fixture(["all"])
            deployer = (await getNamedAccounts()).deployer
            const accounts = await ethers.getSigners()
            player = accounts[1]
            Nft = await ethers.getContract("NftMarketplace", deployer)
            basicNft = await ethers.getContract("BasicNft")
            await basicNft.mintNft()
            await basicNft.approve(Nft.address, TOKEN_ID)
        })

        describe("listItem", function () {

            it("Lists and sells item", async () => {
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const playerConnected = Nft.connect(player)
                await playerConnected.buyItem(basicNft.address, TOKEN_ID, {value:PRICE})
                const newOwner = await basicNft.ownerOf(TOKEN_ID)
                const deployerProceeds = await Nft.getProceeds(deployer)
                assert(newOwner.toString() == player.address)
                assert(deployerProceeds.toString() == PRICE.toString())
            })
        })
    })