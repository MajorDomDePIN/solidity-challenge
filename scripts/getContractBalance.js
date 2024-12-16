require('dotenv').config({ path: '../.env' }); // Pfad relativ zum aktuellen Verzeichnis des Skripts
const axios = require('axios');
const ethers = require('ethers');


async function getContractBalance(contractAddress) {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const url = `https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${contractAddress}&tag=latest&apikey=${apiKey}`;

  try {
    const response = await axios.get(url);
    console.log(response)
    const balanceInWei = response.data.result;
    const balanceInEther = ethers.formatEther(balanceInWei);
    console.log(`Balance of Contract: ${balanceInEther} ETH`);
  } catch (error) {
    console.error(`failure while execution: ${error.message}`);
  }
}

// Ersetzen Sie die Adresse durch die Adresse Ihres Smart Contracts
const contractAddress = '0x2fD5D9fC9cCB07599Bf82db0AA8F25a25862f739';

getContractBalance(contractAddress);
