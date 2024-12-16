const { ethers} = require("hardhat");
const { expect } = require("chai");

describe("ETHPool", function () {
  let ethPool;
  let team;
  let user1;
  let user2;

    // Setup before each test: deploying the contract and getting signers
  beforeEach(async function () {
    [team, user1, user2] = await ethers.getSigners();
    ethPool = await ethers.deployContract("ETHPool");
    await ethPool.waitForDeployment();
  });

    // User Deposit Functionality: Test to ensure users can deposit ETH into the pool
  it("should allow users to deposit", async function () {
    const amount = ethers.parseEther("1");
    await ethPool.connect(user1).deposit({ value: amount });
    // Verifying that the user's deposit is recorded correctly
    expect(await ethPool.users(user1.address)).to.deep.equal([amount,0]);
    // Checking that the total deposits and rewards in the pool are updated accordingly
    expect(await ethPool.totalDeposits()).to.equal(amount);
    expect(await ethPool.totalRewards()).to.equal(0);
  });

    // Exclusive Reward Deposit by the Team: Test to ensure only the team can add rewards to the pool
  it("should allow only the team to add rewards", async function () {
    const rewardsAmount = ethers.parseEther("1");
    // Attempting to deposit rewards as a regular user should fail
    await expect(ethPool.connect(user1).rewardDeposit({ value: rewardsAmount})).to.be.revertedWith(
      "Only team can call this function");
  });

    // Reward Deposit Preconditions: Test to ensure rewards cannot be added when there are no deposits
  it("should not to add rewards when no deposits", async function() {
    const rewardsAmount = ethers.parseEther("1");
    // Attempting to deposit rewards without any user deposits should fail
    await expect(ethPool.rewardDeposit({value: rewardsAmount})).to.be.revertedWith("No deposits");
  });

    // User Withdrawal Functionality: Test to ensure users can withdraw their deposits and rewards
  it("should allow users to withdraw", async function () {
    const depositAmount = ethers.parseEther("1");
    const rewardsAmount = ethers.parseEther("2");
    const withdrawAmount = ethers.parseEther("2");
    await ethPool.connect(user2).deposit({ value: depositAmount });
    await ethPool.rewardDeposit({ value: rewardsAmount});
    await ethPool.connect(user2).withdraw(withdrawAmount);
    // Verifying the user's balance and the pool's total deposits and rewards after withdrawal
    expect(await ethPool.users(user2.address)).to.deep.equal([0,ethers.parseEther("1")]);
    expect(await ethPool.totalDeposits()).to.equal(0);
    expect(await ethPool.totalRewards()).to.equal(ethers.parseEther("1"));
  });

    // Proportional Reward Distribution: Test to ensure rewards are distributed based on the proportion of each user's deposit
  it("should distribute rewards based on shares", async function () {
    const depositUser1 = ethers.parseEther("1");
    const depositUser2 = ethers.parseEther("2");
    const rewardsAmount = ethers.parseEther("4");
    await ethPool.connect(user1).deposit({ value: depositUser1 });
    await ethPool.connect(user2).deposit({ value: depositUser2 });
    await ethPool.rewardDeposit({ value: rewardsAmount });
    // Calculating expected rewards for each user based on their share of the total deposits
    const user1Rewards = rewardsAmount*depositUser1/(depositUser1+depositUser2);
    const user2Rewards = rewardsAmount*depositUser2/(depositUser1+depositUser2);
    // Verifying each user's total balance (deposits + rewards) and the pool's totals
    expect(await ethPool.users(user1.address)).to.deep.equal([depositUser1,user1Rewards]);
    expect(await ethPool.users(user2.address)).to.deep.equal([depositUser2,user2Rewards]);
    expect(await ethPool.totalRewards()).to.equal(rewardsAmount);
    expect(await ethPool.totalDeposits()).to.equal(depositUser1+depositUser2);
  });

    // Withdrawal Limits: Test to ensure users cannot withdraw more than their total balance
  it("should not allow users to withdraw exceeds balance", async function () {
    const depositUser1 = ethers.parseEther("1");
    const withdrawAmount = ethers.parseEther("2");
    // Attempting to withdraw more than the user's balance should fail
    await ethPool.connect(user1).deposit({ value: depositUser1 });
    await expect(ethPool.connect(user1).withdraw(withdrawAmount)).to.be.revertedWith("Withdraw amount exceeds balance");
  });

    // Accurate Deposit Reporting: Test to verify the contract accurately reports a user's deposit amount
  it("should return correct user deposit amount", async function () {
    const depositAmount = ethers.parseEther("1");
    await ethPool.connect(user1).deposit({ value: depositAmount });
    // Checking that the user's deposit amount is reported correctly
    expect(await ethPool.getUserDeposit(user1)).to.equal(depositAmount);
  });

    // Accurate Reward Reporting: Test to verify the contract accurately reports a user's reward amount
  it("should return correct user reward amount", async function () {
    const depositAmount = ethers.parseEther("1");
    const rewardsAmount = ethers.parseEther("0.1");
    await ethPool.connect(user1).deposit({ value: depositAmount });
    await ethPool.rewardDeposit({ value: rewardsAmount});
    // Checking that the user's reward amount is reported correctly
    expect(await ethPool.getUserReward(user1)).to.equal(rewardsAmount);
  });
    // Dynamic Reward Distribution with New Deposits: Test to verify the contract calculates the rewards corretcly after multiple deposits & rewards 
  it("should distribute rewards based on shares, adjusting for new deposits and rewards", async function () {
    // User1 deposits 1 ETH into the pool
    const depositUser1 = ethers.parseEther("1");
    await ethPool.connect(user1).deposit({ value: depositUser1 });
  
    // User2 deposits 2 ETH into the pool
    const depositUser2 = ethers.parseEther("2");
    await ethPool.connect(user2).deposit({ value: depositUser2 });
  
    // The team deposits 3 ETH as rewards into the pool
    const firstRewardAmount = ethers.parseEther("3");
    await ethPool.rewardDeposit({ value: firstRewardAmount });
  
    // At this point, the pool should have 6 ETH in total
    // User1's share increases to 2 ETH, User2's share increases to 4 ETH
    // User1 now holds 1/3 of the pool, and User2 holds 2/3
  
    // User2 makes an additional deposit of 2 ETH
    const additionalDepositUser2 = ethers.parseEther("2");
    await ethPool.connect(user2).deposit({ value: additionalDepositUser2 });
  
    // The pool now contains 8 ETH in total, of which User2 holds 3/4
    // The team deposits another 4 ETH as rewards
    const secondRewardAmount = ethers.parseEther("4");
    await ethPool.rewardDeposit({ value: secondRewardAmount });
  
    // The rewards are distributed, 1 ETH goes to User1's share, and 3 ETH to User2's share
    // Thus, User1 should have a total of 3 ETH, and User2 should have 9 ETH in the pool
    // The pool now holds a total of 12 ETH
  
    // Asserting the expected outcomes
    const expectedUser1Share = ethers.parseEther("3"); // User1's expected share after rewards
    const expectedUser2Share = ethers.parseEther("9"); // User2's expected share after rewards
    const totalPool = expectedUser1Share.add(expectedUser2Share); // Total pool should now be 12 ETH
  
    // Fetching the actual shares from the contract
    const actualUser1Share = await ethPool.getUserDeposit(user1.address).add(await ethPool.getUserReward(user1.address));
    const actualUser2Share = await ethPool.getUserDeposit(user2.address).add(await ethPool.getUserReward(user2.address));
  
    // Verifying each user's share against the expected outcomes
    expect(actualUser1Share).to.equal(expectedUser1Share);
    expect(actualUser2Share).to.equal(expectedUser2Share);
    expect(await ethPool.totalDeposits().add(await ethPool.totalRewards())).to.equal(totalPool);
  });
  
});