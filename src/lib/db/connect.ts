import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

// Established once for the process; subsequent calls reuse the live connection.
let connectionPromise: Promise<typeof mongoose> | null = null;

async function connectWithRetry(retryCount = 0): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.");
  }

  try {
    const connection = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB");
    return connection;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // exponential backoff
      console.error(`❌ MongoDB connection failed, retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectWithRetry(retryCount + 1);
    }
    throw error;
  }
}

/** Ensure a single MongoDB connection, returning the existing one if present. */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // Already connected.
  if (mongoose.connection.readyState === 1) return mongoose;

  // Connection in progress — reuse the in-flight promise.
  if (connectionPromise) return connectionPromise;

  // Start a new connection; reset on final failure so the next call can retry.
  connectionPromise = connectWithRetry().catch((error) => {
    connectionPromise = null;
    throw error;
  });
  return connectionPromise;
}
