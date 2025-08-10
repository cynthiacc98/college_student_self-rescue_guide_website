import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL as string | undefined;

if (!uri) {
  throw new Error("DATABASE_URL is not set. Please configure it in .env");
}

let clientPromise: Promise<MongoClient>;

const globalWithMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV !== "production") {
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
