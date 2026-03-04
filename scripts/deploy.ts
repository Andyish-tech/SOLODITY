import hre from "hardhat";

async function main(){
  const {viem} = await hre.network.connect();
  const contract = await viem.deployContract("helloWorld");
  
  console.log("contract deployed to:", contract.address);

//storing the value as an array

  const hash = await contract.write.set(['Armand'])
  const publicClient = await viem.getPublicClient();
  await publicClient.waitForTransactionReceipt({hash})

//reading or displaying

  const message = await contract.read.get();
  console.log("initial Message",message);

}

main().catch(console.error);
