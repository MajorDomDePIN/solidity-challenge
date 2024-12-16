// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract ETHPool {
    // Structure to hold user deposit and reward information
    struct User {
        uint deposits;  // Total ETH deposited by the user
        uint rewards;   // Total rewards earned by the user
    }
    // Mapping from user address to their deposit and reward info
    mapping(address => User) public users; 
    address public team;   // Address of the team, only they can deposit rewards
    address[] public allUsers;   // Array of all user addresses to iterate for reward distribution
    uint public totalDeposits;   // Total ETH deposited in the pool
    uint public totalRewards;   // Total rewards distributed to the pool

    
    // Events for logging activities on the blockchain
    event Deposit(address indexed user, uint amount);   // Logs when a user makes a deposit
    event RewardDeposit(uint timestamp, uint amount);   // Logs when the team deposits rewards
    event Withdraw(address indexed user, uint amount);   // Logs when a user makes a withdrawal
    
    // Constructor sets the deploying address as the team's address
    constructor() {
        team = msg.sender;
    }
    // Modifier to restrict certain functions to be callable only by the team
    modifier onlyTeam() {
        require(msg.sender == team, "Only team can call this function");
        _;
}
    // user-deposit
    function deposit() external payable {
        require(msg.value > 0, "Please enter an amount greater than 0");
        // Add user to allUsers array if this is their first deposit
        if (users[msg.sender].deposits == 0){
            allUsers.push(msg.sender);
        }    
        // Update user's deposit amount and the total pool deposits
        users[msg.sender].deposits += msg.value;
        totalDeposits += msg.value;
        // Emit a Deposit event
        emit Deposit (msg.sender, msg.value);
        
    }

    // user-withdraw of given amount
    function withdraw(uint _amount) external {
        require(_amount > 0, "Please enter an amount greater than 0");
        uint userDeposit = users[msg.sender].deposits;
        uint userReward = users[msg.sender].rewards;
        require(_amount <= (userDeposit+userReward), "Withdraw amount exceeds balance");
        if (_amount <= userDeposit){
            users[msg.sender].deposits -= _amount;
            payable(msg.sender).transfer(_amount);
            totalDeposits -= _amount;
        } else{
            uint diff = _amount - userDeposit;
            users[msg.sender].deposits = 0;
            users[msg.sender].rewards -= diff;
            payable(msg.sender).transfer(_amount);
            totalDeposits -= userDeposit;
            totalRewards -= diff;
        }
        // Emit a Withdraw event
        emit Withdraw(msg.sender, _amount);
    }

    //rewardDeposit of the Team; will be split on the percentage of current lp-holders
    function rewardDeposit()  external payable onlyTeam {
        require(msg.value > 0, "Please enter an amount greater than 0");
        require(totalDeposits > 0, "No deposits");
        // Distribute the deposited rewards among all users based on their share
        for(uint i=0;i<allUsers.length;i++){
            address user = allUsers[i];
            uint userDeposit = users[user].deposits;
            uint userReward = users[user].rewards;
            uint UserTotal = userDeposit + userReward;
            uint reward = msg.value * UserTotal / (totalDeposits+totalRewards);
            users[user].rewards += reward;

        }
        totalRewards += msg.value;
        // Emit a RewardDeposit event
        emit RewardDeposit(block.timestamp, msg.value);
    }

    // Return the actual deposit of a given User
    function getUserDeposit(address _user) external view returns (uint){
        return users[_user].deposits;
    }

    // Return the actual reward of a given User
    function getUserReward(address _user) external view returns (uint){
        return users[_user].rewards;
    }

}