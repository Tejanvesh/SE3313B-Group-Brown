import { connectToDatabase } from "./mongodb.js";
import express from "express";
import bcrypt from "bcryptjs";  // Use bcrypt to hash passwords
import dotenv from "dotenv";
import mongoose from "mongoose";
import Chat from "./Models/Chat.js";
import User from "./Models/User.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());


dotenv.config();

(async () => {
    try {
        await connectToDatabase();
        console.log("Connected to MongoDB successfully");

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error("Could not connect to MongoDB:", error);
    }
})();

// Route to create a new user
app.post("/addUser", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // Hash the password before saving to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        // Respond with the created user
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: "Failed to add user", message: error.message });
    }
});