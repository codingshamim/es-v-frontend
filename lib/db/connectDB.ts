import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  // Support both MONGO_URI and MONGODB_URI so it works
  // with typical local and hosting provider conventions.
  const mongodbUri =
    (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();
  if (!mongodbUri) {
    throw new Error(
      "MONGO_URI / MONGODB_URI environment variable is not defined",
    );
  }

  try {
    await mongoose.connect(mongodbUri);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}
