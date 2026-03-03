import hre from "hardhat";

async function main() {
  const { viem } = await hre.network.connect();
  const contract = await viem.deployContract("SimpleStorage");
  console.log("Contract deployed to:", contract.address);
}

main().catch(console.error);
