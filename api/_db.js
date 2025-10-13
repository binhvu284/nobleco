const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function getDb() {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'nobleco';
  if (!uri) throw new Error('Missing MONGODB_URI env var');
  if (!client) client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  if (!client.topology) await client.connect();
  db = client.db(dbName);
  return db;
}

module.exports = { getDb };
