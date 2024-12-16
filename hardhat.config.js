// Importing the Hardhat toolbox for comprehensive Ethereum development tools.
require("@nomicfoundation/hardhat-toolbox");
// Loading environment variables from a .env file to securely manage sensitive information.
require("dotenv").config();

// Configuration object for the Hardhat project, specifying compiler version,
// network settings, and Etherscan API details for contract verification.
module.exports = {
  // Specifies the Solidity compiler version to be used.
  solidity: "0.8.24",
  // Network configuration, allowing deployment on different Ethereum networks.
  networks: {
    // Configuration for the Sepolia test network.
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL, // Environment variable containing the RPC URL for Sepolia.
      accounts: [process.env.PRIVATE_KEY] // Environment variable containing the deployer's private key.
    },
  },
  // Etherscan configuration for contract verification.
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // Environment variable containing the Etherscan API key.
  },
};
