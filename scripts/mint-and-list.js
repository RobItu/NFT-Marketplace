const {ethers} = require("hardhat")
async function mintAndList(){
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    console.log("Minting...")
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    
    const approveTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approveTx.wait(1)
    console.log("Listing Nft..")
    const PRICE = ethers.utils.parseEther("0.01")
    const listNft = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    await listNft.wait(1)
    console.log("Listed!")
}

mintAndList().then(()=>process.exit(0))
.catch((error)=>{
    console.error(error)
    process.exit(1)
})