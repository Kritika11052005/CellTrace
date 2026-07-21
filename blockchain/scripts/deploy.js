const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying BatteryProvenance with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC");

    const BatteryProvenance = await hre.ethers.getContractFactory("BatteryProvenance");
    const contract = await BatteryProvenance.deploy();

    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("BatteryProvenance deployed to:", address);
    console.log("Owner (write access) set to:", deployer.address);
    console.log("\nSave this address — your FastAPI backend needs it to talk to the contract.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});