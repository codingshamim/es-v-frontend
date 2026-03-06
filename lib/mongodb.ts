import { MongoClient, MongoClientOptions } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _esfitt_mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "MONGODB_URI is not set. Please add it to your environment (.env.local).",
  );
}

const options: MongoClientOptions = {};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._esfitt_mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._esfitt_mongoClientPromise = client.connect();
  }
  clientPromise = global._esfitt_mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

