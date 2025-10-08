const path = require("path");

module.exports = {
  // Directories
  contracts_directory: path.join(__dirname, "contracts"),
  contracts_build_directory: path.join(__dirname, "build/contracts"),

  // Compiler config
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },

  // Network config
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545, // Ganache default
      network_id: "5777",
    },
  },

  // Disable Truffle DB
  db: {
    enabled: false,
  },
};


