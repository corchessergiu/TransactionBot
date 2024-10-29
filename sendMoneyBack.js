const cron = require("node-cron");
require("dotenv").config();
const Web3 = require("web3");
const ethUtil = require("ethereumjs-util");

const {
  connectToDatabase,
  getFirst500Wallets,
  closeDatabaseConnection,
  deleteWalletByAddress,
} = require("./mongodbInteraction");

connectToDatabase()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

const ownerWalletAddress = [
  "0x9e474Cf4Ea9269592Fec8A3c8c42ED90f74F9F6b",
  "0x9e474Cf4Ea9269592Fec8A3c8c42ED90f74F9F6b",
  "0x9e474Cf4Ea9269592Fec8A3c8c42ED90f74F9F6b",
];

const web3 = new Web3("https://rpc1-mainnet.icbnetwork.info");

async function sendFunds() {
  const addresses = await getFirst500Wallets();

  for (let i = 0; i < addresses.length; i++) {
    console.log();
    const fromAddress = addresses[i].address;
    console.log("Transfer from address:", fromAddress);

    const balanceForBack = await web3.eth.getBalance(fromAddress);
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 21000;
    const gasCost = BigInt(gasPrice) * BigInt(gasLimit);
    const maxTransferableAmount = BigInt(balanceForBack) - gasCost;
    console.log(`Gas Price for second transaction: ${gasPrice} wei`);
    console.log("maxTransferableAmount ", maxTransferableAmount);
    if (maxTransferableAmount <= 0) {
      console.error("Not enough balance to cover the transaction costs");
      await deleteWalletByAddress(fromAddress);
    }

    const randomIndex = Math.floor(Math.random() * ownerWalletAddress.length);
    console.log("Send funds to :", ownerWalletAddress[randomIndex]);

    let tx2 = {
      from: fromAddress,
      to: ownerWalletAddress[randomIndex],
      value: maxTransferableAmount.toString(),
      gas: 21000,
    };

    try {
      const cost = BigInt(tx2.gas) * BigInt(gasPrice) + BigInt(tx2.value);
      console.log(
        `Total cost of transaction: ${web3.utils.fromWei(
          cost.toString(),
          "ether"
        )} ETH`
      );

      if (BigInt(balanceForBack) < cost) {
        console.error("Not enough balance to cover the transaction costs");
        return;
      }

      const privateKeyBuffer = Buffer.from(addresses[i].privateKey, "hex");
      const privateKeyHex = privateKeyBuffer.toString("hex");
      const address = `0x${ethUtil
        .privateToAddress(privateKeyBuffer)
        .toString("hex")}`;

      const signedTx = await web3.eth.accounts.signTransaction(
        tx2,
        privateKeyHex
      );
      const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );
      console.log(
        `Funds sent successfully from ${fromAddress} to ${ownerWalletAddress[randomIndex]}: Transaction hash: ${receipt.transactionHash}`
      );
      await deleteWalletByAddress(fromAddress.toLocaleLowerCase());
    } catch (error) {
      console.error(
        `Failed to send funds back to ${ownerWalletAddress[randomIndex]}: ${error}`
      );
    }
  }
}

cron.schedule("51 2 10 * * *", async () => {
  console.log("Send funds");
  await sendFunds();
  await closeDatabaseConnection();
});
