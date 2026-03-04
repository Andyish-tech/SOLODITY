import hre from "hardhat";

async function main() {
    const {viem} = await hre.network.connect();

    // deplo the contract
    const contract = await viem.deployContract("helloWorld");
    console.log("contract deployed to:", contract.address);

    //set a new message

    const hash = await contract.write.set(["Hello from hardhat!"]);
    const publicClient = await viem.getPublicClient();
    await publicClient.waitForTransactionReceipt({hash});
    console.log("Message updated");

    //Reading the new message

    const newMessage = await contract.read.get();
console.log("New message:", newMessage);
    
}

main().catch(console.error);