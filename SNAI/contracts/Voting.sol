// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {

    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public admin;
    mapping(address => bool) public hasVoted;

    Candidate[] public candidates;

    constructor(string[] memory candidateNames) {
        admin = msg.sender;

        for(uint i=0; i<candidateNames.length; i++){
            candidates.push(Candidate({
                name: candidateNames[i],
                voteCount: 0
            }));
        }
    }

    function vote(uint candidateId) public {
        require(!hasVoted[msg.sender], "Already voted");
        require(candidateId < candidates.length, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;
    }

    function getVotes(uint candidateId) public view returns(uint){
        return candidates[candidateId].voteCount;
    }

    function getCandidateCount() public view returns(uint){
        return candidates.length;
    }
}