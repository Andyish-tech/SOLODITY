import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

async function main(){
  const {viem} = await hre.network.connect();
  const contract = await viem.deployContract("HelloWorld");

  console.log("Contract deployed to:", contract.address);

  const initial = await contract.read.get();
  console.log("Initial message:", initial);

  const artifactPath = path.join(
    __dirname,
  );

  
}

main().catch(console.error);
