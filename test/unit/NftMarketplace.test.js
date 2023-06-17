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
            it("Reverts with error if no price listed", async ()=>{
                await expect(Nft.listItem(basicNft.address, TOKEN_ID, 0)).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero", Nft)
            })
            it("Reverts with error if NFT not approved for marketplace", async () => {
                await basicNft.approve("0x0000000000000000000000000000000000000000", TOKEN_ID)
                await expect(Nft.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith("NftMarketplace__NotApprovedForMarketplace", Nft)
            })
            it("Reverts with error if NFT is already listed", async ()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                await expect(Nft.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith("NftMarketplace__AlreadyListed", Nft)
            })
            it("Reverts with error if unauthorized users tries to list NFT", async ()=>{
                maliciousActor = Nft.connect(player)
                await expect(maliciousActor.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith("NftMarketplace__NotOwner", Nft)
            })
            it("Populates s_listing mapping with new listing", async ()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const response = await Nft.getListing(basicNft.address, TOKEN_ID)
                assert(response.price.toString() == PRICE)
                assert(response.seller.toString() == deployer)
            })
            it("Emits event after listing item", async ()=>{
                await expect(Nft.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(Nft, "ItemListed")
            })
        })
        describe("buyItem", function () {
            it("Reverts with error if NFT not listed", async ()=>{
                const buyer = Nft.connect(player)
                await expect(buyer.buyItem(basicNft.address, TOKEN_ID, {value: 0})).to.be.revertedWith("NftMarketplace__NotListed", Nft)
            })
            it("Reverts with error if price is too low", async ()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const buyer = Nft.connect(player)
                await expect(buyer.buyItem(basicNft.address, TOKEN_ID, {value: 0})).to.be.revertedWith("NftMarketplace__PriceNotMet", Nft)
            })
            it("Seller records proceeds", async ()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const proceedsBeforeSale = await Nft.getProceeds(deployer)
                assert(proceedsBeforeSale.toString() == 0)
                const buyer = Nft.connect(player)
                await buyer.buyItem(basicNft.address, TOKEN_ID, {value: PRICE})
                const proceedsAfterSale = await Nft.getProceeds(deployer)
                assert.equal(proceedsAfterSale.toString(), PRICE)
            })
            it("Listing gets deleted after purchase", async ()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const listing = await Nft.getListing(basicNft.address, TOKEN_ID)
                assert(listing.price.toString() == PRICE)
                assert(listing.seller.toString() == deployer)
                const buyer = Nft.connect(player)
                await buyer.buyItem(basicNft.address, TOKEN_ID, {value: PRICE})
                const newListing = await Nft.getListing(basicNft.address, TOKEN_ID)
                assert(newListing.price.toString() == 0)
                assert(newListing.seller.toString() == "0x0000000000000000000000000000000000000000")
            })
            it("NFT ownership transfers to buyer after purchase", async ()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const buyer = Nft.connect(player)
                await buyer.buyItem(basicNft.address, TOKEN_ID, {value: PRICE})
                const owner = await basicNft.ownerOf(TOKEN_ID)
                assert.equal(owner.toString(), player.address)
            })
            it("event emits after NFT purchase", async()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const buyer = Nft.connect(player)
                await expect(buyer.buyItem(basicNft.address, TOKEN_ID, {value: PRICE})).to.emit(Nft, "ItemBought")
            })
        })
        describe("cancelListing", function (){
            beforeEach(async function () {
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
            })
            it("Reverts with error if unauthorized user tries cancelling listing", async ()=>{
                const buyer = Nft.connect(player)
                await expect(buyer.cancelListing(basicNft.address, TOKEN_ID)).to.be.revertedWith("NftMarketplace__NotOwner", Nft)
            })
            it("Reverts with error if NFT is not listed", async ()=>{
                await Nft.cancelListing(basicNft.address, TOKEN_ID)
                await expect(Nft.cancelListing(basicNft.address, TOKEN_ID)).to.be.revertedWith("NftMarketplace__NotListed", Nft)
            })
            it("Deletes listing", async ()=>{
                const preCancelListing = await Nft.getListing(basicNft.address, TOKEN_ID)
                assert(preCancelListing.price.toString() == PRICE)
                assert(preCancelListing.seller.toString() == deployer)
                await Nft.cancelListing(basicNft.address, TOKEN_ID)
                const postCancelListing = await Nft.getListing(basicNft.address, TOKEN_ID)
                assert(postCancelListing.price.toString() == 0)
                assert(postCancelListing.seller.toString() == "0x0000000000000000000000000000000000000000")
            })
            it("Emits event after listing deletion", async ()=>{
                expect(await Nft.cancelListing(basicNft.address, TOKEN_ID)).to.emit(Nft, "ItemCancelled")
            })
        })
        describe("UpdateListing", function (){
            const newPrice = ethers.utils.parseEther("0.02")
            it("Reverts with error if NFT not listed", async ()=>{
                await expect(Nft.updateListing(basicNft.address, TOKEN_ID, newPrice)).to.be.revertedWith("NftMarketplace__NotListed", Nft)
            })
            it("Reverts with error if not owner calls function", async ()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const notOwner = Nft.connect(player)
                await expect(notOwner.updateListing(basicNft.address, TOKEN_ID, newPrice)).to.be.revertedWith("NftMarketplace__NotOwner", Nft)
 
            })
            it("Updates listing to new price", async ()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const preUpdatePrice = await Nft.getListing(basicNft.address, TOKEN_ID)
                assert.equal(preUpdatePrice.price.toString(), PRICE)
                await Nft.updateListing(basicNft.address, TOKEN_ID, newPrice)
                const postUpdatePrice = await Nft.getListing(basicNft.address, TOKEN_ID)
                assert.equal(postUpdatePrice.price.toString(), newPrice)

            })
            it("Emits event after updating listing", async ()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                await expect(Nft.updateListing(basicNft.address, TOKEN_ID, newPrice)).to.emit(Nft, "ItemListed")
            })
        })
        describe("withdrawProceeds", function (){
            it("Reverts with error if there are no proceeds", async ()=>{
                await expect(Nft.withdrawProceeds()).to.be.revertedWith("NftMarketplace__NoProceeds", Nft)
            })
            it("Withdraw proceeds", async ()=>{
                const accounts = await ethers.getSigners()
                deployer = accounts[0]
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const startingBalance = await deployer.getBalance()
                const buyer = Nft.connect(player)
                await buyer.buyItem(basicNft.address, TOKEN_ID, {value: PRICE})
                const proceeds = await Nft.getProceeds(deployer.address)

                const tx = await Nft.withdrawProceeds()
                const txReceipt = await tx.wait(1)
                const {gasUsed, effectiveGasPrice} = txReceipt
                const gas = gasUsed.mul(effectiveGasPrice)
                const endingBalance = await deployer.getBalance()

                assert.equal(startingBalance.add(proceeds).toString(), endingBalance.add(gas).toString())
            })
            it("Resets user's proceedings after withdrawing", async ()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const preSellProceeds = await Nft.getProceeds(deployer)
                assert.equal(preSellProceeds.toString(), 0)
                const buyer = Nft.connect(player)
                await buyer.buyItem(basicNft.address, TOKEN_ID, {value: PRICE})
                const postSellProceeds = await Nft.getProceeds(deployer)
                assert.equal(postSellProceeds.toString(), PRICE)
            })
        })
        describe("getListing", function (){
            it("Returns correct listing", async()=>{
                const preListingList = await Nft.getListing(basicNft.address, TOKEN_ID)
                assert.equal(preListingList.price.toString(), 0)
                assert.equal(preListingList.seller.toString(), "0x0000000000000000000000000000000000000000")
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const postListing = await Nft.getListing(basicNft.address, TOKEN_ID)
                assert.equal(postListing.price.toString(), PRICE)
                assert.equal(postListing.seller.toString(), deployer)
                

            })
        })
        describe("getProceeds", function (){
            it("Returns correct proceeds", async ()=>{
                await Nft.listItem(basicNft.address, TOKEN_ID, PRICE)
                const preSellProceeds = await Nft.getProceeds(deployer)
                assert.equal(preSellProceeds.toString(), 0)
                const buyer = Nft.connect(player)
                await buyer.buyItem(basicNft.address, TOKEN_ID, {value: PRICE})
                const postSellProceeds = await Nft.getProceeds(deployer)
                assert.equal(postSellProceeds.toString(), PRICE) 
            })
        })
    })