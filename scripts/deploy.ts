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
    "..",
    "artifacts",
    "contracts",
    "HelloWorld.sol",
    "HelloWorld.json"
  );

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"))
  const abi = artifact.abi;

  //save to the frontend

  const outDir = path.join(__dirname, "..", "frontend", "src", "contracts")
  fs.mkdirSync(outDir, {recursive:true})
  
  fs.writeFileSync(
    path.join(outDir, "HelloWorld"),
    JSON.stringify(
      {
        address: contract.address,
        abi: abi
      },
      null,
      2
    )
  )

  console.log("Frontend file created")
}

main().catch(console.error);
