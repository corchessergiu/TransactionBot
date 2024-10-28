const cron = require("node-cron");
require("dotenv").config();
const Web3 = require("web3");

const {
  connectToDatabase,
  getFirst500Wallets,
  closeDatabaseConnection,
} = require("./mongodbInteraction");

connectToDatabase()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

const privateKey = process.env.PRIVATE_KEY;
const web3 = new Web3("https://rpc1-mainnet.icbnetwork.info");
const senderAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(senderAccount);

async function sendFunds() {
  let balance = await web3.eth.getBalance(senderAccount.address);
  const addresses = await getFirst500Wallets();

  for (let i = 0; i < addresses.length; i++) {
    console.log()
    const toAddress = addresses[i].address;
    console.log("Transfer to address:", toAddress);

    let randomValue = Math.floor(Math.random() * (100 - 30 + 1)) + 30;
    const tx = {
      from: senderAccount.address,
      to: toAddress,
      value: web3.utils.toWei(randomValue.toString(), "ether"),
      gas: 21000,
    };

    try {
      const gasPrice = await web3.eth.getGasPrice();
      tx.gasPrice = gasPrice;
      console.log(`Gas Price: ${gasPrice} wei`);

      const cost = BigInt(tx.gas) * BigInt(gasPrice) + BigInt(tx.value);
      console.log(
        `Total cost of transaction to ${toAddress}: ${web3.utils.fromWei(
          cost.toString(),
          "ether"
        )} ETH`
      );

      if (BigInt(balance) < cost) {
        console.error(
          `Not enough balance to cover the transaction costs for ${toAddress}`
        );
        continue; // Skip this transaction and move to the next one
      }

      // Send the transaction
      const receipt = await web3.eth.sendTransaction(tx);
      console.log(
        `Funds sent successfully to ${toAddress}: Transaction hash: ${receipt.transactionHash}`
      );
      console.log()
      // Update balance after the transaction
      balance = await web3.eth.getBalance(senderAccount.address);
    } catch (error) {
      console.error(`Failed to send funds to ${toAddress}: ${error}`);
    }
  }
}


cron.schedule("11 56 15 * * *", async () => {
  console.log("Send funds");
  await sendFunds();
  await closeDatabaseConnection();
});
