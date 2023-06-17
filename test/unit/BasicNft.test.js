const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config.js")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNft test", function () {
          const chainId = network.config.chainId
          let BasicNft, deployer
          beforeEach(async function () {
              await deployments.fixture(["all"])
              deployer = (await getNamedAccounts()).deployer
              BasicNft = await ethers.getContract("BasicNft", deployer)
          })

          describe("Constructor", function () {
              it("Initializes token counter correctly", async () => {
                  const correctTokenCounter = networkConfig[chainId]["initialTokenCounter"]
                  const tokenCounter = await BasicNft.getTokenCounter()
                  assert.equal(tokenCounter.toString(), correctTokenCounter)
              })

              it("Initializes token URI correct", async () => {
                  const tokenURI = networkConfig[chainId]["TOKEN_URI"]
                  const contractTokenURI = await BasicNft.tokenURI(0)
                  assert.equal(tokenURI, contractTokenURI)
              })
          })

          describe("Minting", function () {
              it("Asserts that tokenID is owned by caller", async () => {
                  const tokenCounter = await BasicNft.getTokenCounter()
                  const tx = await BasicNft.mintNft()
                  const owner = await BasicNft.ownerOf(tokenCounter)
                  assert.equal(owner, deployer)
              })

              it("Asserts that token counter increases", async () => {
                  const tokenCounter = await BasicNft.getTokenCounter()
                  const tx = await BasicNft.mintNft()
                  const newTokenCounter = await BasicNft.getTokenCounter()
                  assert.equal(tokenCounter.toNumber() + 1, newTokenCounter.toString())
              })
          })
      })