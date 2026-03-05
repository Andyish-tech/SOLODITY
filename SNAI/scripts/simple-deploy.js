const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Read contract ABI and bytecode
const contractPath = path.join(__dirname, "../artifacts/contracts/Voting.sol/Voting.json");
let contractArtifact;

try {
    contractArtifact = require(contractPath);
} catch (error) {
    console.error("Contract artifact not found. Please compile the contract first.");
    console.log("Run: npx hardhat compile");
    process.exit(1);
}

async function deploy() {
    try {
        // Connect to local Hardhat network
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
        
        // Use the first account from Hardhat (default deployer)
        const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        const wallet = new ethers.Wallet(privateKey, provider);
        
        console.log("Deploying contract with account:", wallet.address);
        
        // Get contract factory
        const Voting = new ethers.ContractFactory(
            contractArtifact.abi,
            contractArtifact.bytecode,
            wallet
        );
        
        // University student council candidates
        const candidates = [
            "Alice Johnson - Computer Science",
            "Bob Smith - Business Administration", 
            "Carol Davis - Engineering",
            "David Wilson - Arts & Sciences"
        ];
        
        console.log("Deploying Voting contract...");
        
        // Deploy contract
        const voting = await Voting.deploy(candidates);
        await voting.deployed();
        
        const contractAddress = voting.address;
        console.log("✅ Voting contract deployed to:", contractAddress);
        
        // Create frontend directory if it doesn't exist
        const frontendDir = path.join(__dirname, "../frontend");
        if (!fs.existsSync(frontendDir)) {
            fs.mkdirSync(frontendDir);
        }
        
        // Save contract info for frontend
        const contractInfo = {
            address: contractAddress,
            abi: contractArtifact.abi
        };
        
        fs.writeFileSync(
            path.join(frontendDir, "contract-info.json"),
            JSON.stringify(contractInfo, null, 2)
        );
        
        console.log("✅ Contract info saved to frontend/contract-info.json");
        console.log("\n🎉 Deployment complete!");
        console.log("Contract Address:", contractAddress);
        console.log("You can now start the frontend and connect to the local network.");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        process.exit(1);
    }
}

deploy();
