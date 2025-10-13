import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'fairiche';
  if (!uri) throw new Error('Missing MONGODB_URI env var');

  if (!client) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  }
  if (!client.topology) {
    await client.connect();
  }
  db = client.db(dbName);
  return db;
}
