const { MongoClient } = require("mongodb");
require("dotenv").config();
let db;
let client;

// async function connectToDatabase() {
//   if (!db) {
//     const client = new MongoClient(process.env.MONGO_URL, {
//       tls: true,
//       tlsCertificateKeyFile: process.env.CERTIFICATE,
//       authMechanism: process.env.AUTH_TYPE,
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     try {
//       await client.connect();
//       db = client.db("ICBNinjaGame");
//       console.log("Connected to MongoDB");
//     } catch (error) {
//       console.error("Failed to connect to MongoDB", error);
//       throw error;
//     }
//   }
// }

async function closeDatabaseConnection() {
  if (client) {
    try {
      await client.close();
      console.log("MongoDB connection closed.");
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }
}

//Local connection
async function connectToDatabase() {
  console.log("Connnect method:");
  if (!db) {
    client = new MongoClient(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    try {
      await client.connect();
      db = client.db("ICBNetworkTransactionBot");
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
      throw error;
    }
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}

async function insertWallet(address, privateKey) {
  const db = getDb();
  const collection = db.collection("wallets_and_pk");

  const walletData = {
    address,
    privateKey,
    createdAt: new Date(), // current timestamp
  };

  try {
    const result = await collection.insertOne(walletData);
    console.log("Wallet inserted successfully:", result.insertedId);
    return result.insertedId;
  } catch (error) {
    console.error("Error inserting wallet:", error);
    throw error;
  }
}

async function getFirst500Wallets() {
  const db = getDb();
  const collection = db.collection("wallets_and_pk");

  try {
    const wallets = await collection
      .find({}, { projection: { address: 1, privateKey: 1, _id: 0 } })
      .limit(500) 
      .toArray();

    return wallets;
  } catch (error) {
    console.error("Error fetching wallets:", error);
    throw error;
  }
}
module.exports = {
  connectToDatabase,
  closeDatabaseConnection,
  insertWallet,
  getFirst500Wallets,
};
