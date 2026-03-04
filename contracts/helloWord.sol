// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract helloWorld{
    string private message;


function get() external view returns (string memory){
    return message;
}

function set(string memory _message) external{
    message = _message;
}
}