import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  const mongodbUri = process.env.MONGO_URI?.trim();
  if (!mongodbUri) {
    throw new Error("MONGO_URI environment variable is not defined");
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
