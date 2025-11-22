import mongoose from "mongoose";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "test",
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB error:", err);
  }
}

export default connectDB;
