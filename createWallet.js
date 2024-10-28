const bip39 = require("bip39");
const hdkey = require("hdkey");
const ethUtil = require("ethereumjs-util");
const Web3 = require("web3");
const path = require("path");
const cron = require("node-cron");
require("dotenv").config();
const { connectToDatabase, insertWallet } = require("./mongodbInteraction");

connectToDatabase()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

const ownerWalletAddress = [
  "0x9e474Cf4Ea9269592Fec8A3c8c42ED90f74F9F6b",
  "0x1D3E72A7Df4D9d60a37Bb308D5f8Efae3Cb3Acd3",
  "0x616FEb050969868cA415ba3e9D015aD4D7657E4d",
];

const web3 = new Web3("https://rpc1-mainnet.icbnetwork.info");


const mnemonic = bip39.generateMnemonic();
const seed = bip39.mnemonicToSeedSync(mnemonic);
const root = hdkey.fromMasterSeed(seed);
const pathBase = "m/44'/60'/0'/0/";

async function generateWallets(numberOfWallets) {
  const wallets = [];

  for (let i = 0; i < numberOfWallets; i++) {
    const path = pathBase + i;
    const node = root.derive(path);

    if (!node.privateKey) {
      console.error(`Failed to derive privateKey for path: ${path}`);
      continue;
    }

    const privateKeyBuffer = Buffer.from(node.privateKey, "hex");
    const privateKeyHex = privateKeyBuffer.toString("hex");
    const address = `0x${ethUtil
      .privateToAddress(privateKeyBuffer)
      .toString("hex")}`;
    
      console.log(address, " ", privateKeyHex);
    wallets.push({ address, privateKey: privateKeyHex });
    insertWallet(address, privateKeyHex);
  }
}

cron.schedule("11 33 15 * * *", async () => {
  console.log("generalWalletNumber from main ");
  let currentWallets = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
  console.log("First run from main cu: ", currentWallets);
  await generateWallets(currentWallets);
  await closeDatabaseConnection();
});
