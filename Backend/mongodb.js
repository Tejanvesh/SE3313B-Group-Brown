//----------MONGO DB CONFIGURATION FILE----------


// This file is responsible for managing the MongoDB connection using Mongoose
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from 'path';


dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });  // Adjusted path

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in the .env.local file");
}

// MongoDB connection handler for application
// ensures the app connects to MongoDB efficiently

// if a connection to mongodb exists, reuses it. otherwise creates a new connection and stores it in cached.promise
// this prevents unnecessary database reconnections 
let cached = global.mongoose || { conn: null, promise: null };

export async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    console.log("Already connected");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "GroupBrownCluster",
      useNewUrlParser: true,  // Use new URL string parser
      useUnifiedTopology: true,  // Use unified topology
      ssl: true,  // Enable SSL for MongoDB Atlas connection
    });
    console.log("Connected to: ", mongoose.connection.name);

  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}
