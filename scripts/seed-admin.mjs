import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'nobleco';
  const [, , argUser, argPass] = process.argv;
  const username = argUser || process.env.SEED_USERNAME || 'admin';
  const password = argPass || process.env.SEED_PASSWORD || '';

  if (!uri) throw new Error('Missing MONGODB_URI');
  if (!dbName) throw new Error('Missing DB_NAME');
  if (!username || !password) throw new Error('Missing username/password (args or SEED_USERNAME/SEED_PASSWORD)');

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');

  const existing = await users.findOne({ username });
  if (existing) {
    console.log(`[seed-admin] User '${username}' already exists. Skipping.`);
    await client.close();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const doc = { username, passwordHash, role: 'admin', createdAt: new Date() };
  const { insertedId } = await users.insertOne(doc);
  await client.close();
  console.log(`[seed-admin] Created user '${username}' with _id=${insertedId.toString()}`);
}

main().catch((e) => {
  console.error('[seed-admin] ERROR:', e?.message || e);
  process.exit(1);
});
