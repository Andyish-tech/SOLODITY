async function main() {
  const Voting = await ethers.getContractFactory("Voting");

  // University student council candidates
  const candidates = [
    "Alice Johnson - Computer Science",
    "Bob Smith - Business Administration", 
    "Carol Davis - Engineering",
    "David Wilson - Arts & Sciences"
  ];

  const voting = await Voting.deploy(candidates);

  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("Voting contract deployed to:", contractAddress);
  
  // Save contract address and ABI to a JSON file for frontend
  const fs = require("fs");
  const contractInfo = {
    address: contractAddress,
    abi: require("../artifacts/contracts/Voting.sol/Voting.json").abi
  };
  
  fs.writeFileSync(
    "../frontend/contract-info.json", 
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("Contract info saved to frontend/contract-info.json");
}

main().catch(console.error);