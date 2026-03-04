// University Voting DApp Frontend
class VotingDApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default Hardhat address
        this.abi = [
            {
                "inputs": [
                    {
                        "internalType": "string[]",
                        "name": "candidateNames",
                        "type": "string[]"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "candidateId",
                        "type": "uint256"
                    }
                ],
                "name": "vote",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "candidateId",
                        "type": "uint256"
                    }
                ],
                "name": "getVotes",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getCandidateCount",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "candidates",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "voteCount",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "name": "hasVoted",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "admin",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ];
        
        this.init();
    }

    async init() {
        // Load contract info if available
        try {
            const response = await fetch('./contract-info.json');
            if (response.ok) {
                const contractInfo = await response.json();
                this.contractAddress = contractInfo.address;
                this.abi = contractInfo.abi;
                console.log('Contract info loaded:', contractInfo);
            }
        } catch (error) {
            console.log('Using default contract configuration');
        }

        // Check if already connected
        if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await this.connectWallet();
            }
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const connectBtn = document.getElementById('connectBtn');
        connectBtn.addEventListener('click', () => this.connectWallet());
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                this.showMessage('Please install MetaMask to use this voting DApp!', 'error');
                return;
            }

            const connectBtn = document.getElementById('connectBtn');
            connectBtn.innerHTML = '<span class="loading"></span> Connecting...';
            connectBtn.disabled = true;

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Create provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            
            // Create contract instance
            this.contract = new ethers.Contract(this.contractAddress, this.abi, this.signer);
            
            // Get user address
            const userAddress = await this.signer.getAddress();
            
            // Update UI
            document.getElementById('walletInfo').style.display = 'block';
            document.getElementById('walletInfo').innerHTML = `Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
            connectBtn.style.display = 'none';
            
            // Load voting interface
            await this.loadVotingInterface();
            
            this.showMessage('Wallet connected successfully! You can now vote.', 'success');
            
        } catch (error) {
            console.error('Connection error:', error);
            this.showMessage('Failed to connect wallet: ' + error.message, 'error');
            
            const connectBtn = document.getElementById('connectBtn');
            connectBtn.innerHTML = 'Connect Wallet to Vote';
            connectBtn.disabled = false;
        }
    }

    async loadVotingInterface() {
        try {
            const votingSection = document.getElementById('votingSection');
            votingSection.style.display = 'grid';
            votingSection.innerHTML = '<div class="loading" style="margin: 50px auto;"></div>';
            
            // Get candidate count
            const candidateCount = await this.contract.getCandidateCount();
            
            // Check if user has already voted
            const userAddress = await this.signer.getAddress();
            const hasVoted = await this.contract.hasVoted(userAddress);
            
            // Load candidates
            let candidatesHTML = '';
            for (let i = 0; i < candidateCount.toNumber(); i++) {
                const candidate = await this.contract.candidates(i);
                candidatesHTML += this.createCandidateCard(i, candidate.name, candidate.voteCount, hasVoted);
            }
            
            votingSection.innerHTML = candidatesHTML;
            
            // Add vote event listeners
            if (!hasVoted) {
                for (let i = 0; i < candidateCount.toNumber(); i++) {
                    const voteBtn = document.getElementById(`vote-${i}`);
                    if (voteBtn) {
                        voteBtn.addEventListener('click', () => this.vote(i));
                    }
                }
            } else {
                this.showMessage('You have already voted in this election.', 'info');
            }
            
            // Start live vote updates
            this.startLiveUpdates();
            
        } catch (error) {
            console.error('Error loading voting interface:', error);
            this.showMessage('Error loading voting interface: ' + error.message, 'error');
        }
    }

    createCandidateCard(candidateId, name, voteCount, hasVoted) {
        return `
            <div class="candidate-card">
                <div class="candidate-name">${name}</div>
                <div class="vote-count" id="votes-${candidateId}">${voteCount.toString()}</div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 15px;">votes</div>
                <button 
                    id="vote-${candidateId}" 
                    class="vote-btn" 
                    ${hasVoted ? 'disabled' : ''}
                    onclick="votingDApp.vote(${candidateId})"
                >
                    ${hasVoted ? 'Already Voted' : 'Vote for Candidate'}
                </button>
            </div>
        `;
    }

    async vote(candidateId) {
        try {
            const voteBtn = document.getElementById(`vote-${candidateId}`);
            voteBtn.innerHTML = '<span class="loading"></span> Voting...';
            voteBtn.disabled = true;
            
            // Send vote transaction
            const tx = await this.contract.vote(candidateId);
            
            this.showMessage('Transaction sent! Waiting for confirmation...', 'info');
            
            // Wait for transaction confirmation
            await tx.wait();
            
            this.showMessage('Vote cast successfully! 🎉', 'success');
            
            // Update UI to show voted status
            await this.loadVotingInterface();
            
        } catch (error) {
            console.error('Voting error:', error);
            this.showMessage('Voting failed: ' + error.message, 'error');
            
            // Reset button
            const voteBtn = document.getElementById(`vote-${candidateId}`);
            voteBtn.innerHTML = 'Vote for Candidate';
            voteBtn.disabled = false;
        }
    }

    startLiveUpdates() {
        // Update vote counts every 5 seconds
        setInterval(async () => {
            try {
                if (this.contract) {
                    const candidateCount = await this.contract.getCandidateCount();
                    
                    for (let i = 0; i < candidateCount.toNumber(); i++) {
                        const votes = await this.contract.getVotes(i);
                        const voteElement = document.getElementById(`votes-${i}`);
                        if (voteElement) {
                            voteElement.textContent = votes.toString();
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating vote counts:', error);
            }
        }, 5000);
    }

    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('statusMessage');
        messageEl.textContent = message;
        messageEl.className = `status-message ${type}`;
        messageEl.style.display = 'block';
        
        // Auto-hide after 5 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize the DApp when page loads
let votingDApp;
document.addEventListener('DOMContentLoaded', () => {
    votingDApp = new VotingDApp();
});
