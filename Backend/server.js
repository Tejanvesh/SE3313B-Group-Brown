import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import session from "express-session";
import cors from "cors";
import { connectToDatabase } from "./mongodb.js";
import User from "./Models/User.js";
import Chat from "./Models/Chat.js";  // Import Chat schema

dotenv.config();

const app = express();

// Set up CORS middleware before any routes (handles preflight OPTIONS requests)
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.options("*", cors());

// Parse JSON bodies after CORS is enabled
app.use(express.json());

// Configure session middleware
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: false,
  })
);

const port = process.env.PORT || 5001;

// Connect to MongoDB and start the server
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

// Registration: Create a new user
app.post("/addUser", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      friends: [],
      requests: [],
    });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to add user", message: error.message });
  }
});

// Friend request endpoints
app.post("/sendFriendRequest", async (req, res) => {
  const { fromUsername, toUsername } = req.body;
  try {
    if (fromUsername === toUsername) {
      return res.status(400).json({ error: "Cannot send a friend request to yourself" });
    }
    const fromUser = await User.findOne({ username: fromUsername });
    const toUser = await User.findOne({ username: toUsername });
    if (!fromUser || !toUser) {
      return res.status(404).json({ error: "One or both users not found" });
    }
    if (toUser.friends.includes(fromUsername)) {
      return res.status(400).json({ error: "Users are already friends" });
    }
    if (toUser.requests.includes(fromUsername)) {
      return res.status(400).json({ error: "Friend request already sent" });
    }
    toUser.requests.push(fromUsername);
    await toUser.save();
    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send friend request", message: error.message });
  }
});

app.post("/acceptFriendRequest", async (req, res) => {
  const { username, fromUsername } = req.body;
  try {
    const user = await User.findOne({ username });
    const fromUser = await User.findOne({ username: fromUsername });
    if (!user || !fromUser) {
      return res.status(404).json({ error: "One or both users not found" });
    }
    if (!user.requests.includes(fromUsername)) {
      return res.status(400).json({ error: "No pending friend request from the specified user" });
    }
    if (!user.friends.includes(fromUsername)) {
      user.friends.push(fromUsername);
    }
    if (!fromUser.friends.includes(username)) {
      fromUser.friends.push(username);
    }
    user.requests = user.requests.filter(request => request !== fromUsername);
    await user.save();
    await fromUser.save();
    res.status(200).json({ message: "Friend request accepted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to accept friend request", message: error.message });
  }
});

app.post("/rejectFriendRequest", async (req, res) => {
  const { username, fromUsername } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user.requests.includes(fromUsername)) {
      return res.status(400).json({ error: "No pending friend request from this user" });
    }
    user.requests = user.requests.filter(request => request !== fromUsername);
    await user.save();
    res.status(200).json({ message: "Friend request rejected successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject friend request", message: error.message });
  }
});

// Search for users (exclude the current user if provided)
app.get("/searchUsers", async (req, res) => {
  const { query, currentUsername } = req.query;
  try {
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    const users = await User.find({
      $and: [
        { username: { $regex: query, $options: "i" } },
        { username: { $ne: currentUsername } }
      ]
    });
    res.status(200).json(users.map(user => user.username));
  } catch (error) {
    res.status(500).json({ error: "Failed to search for users", message: error.message });
  }
});

app.get("/getFriends/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ friends: user.friends });
  } catch (error) {
    res.status(500).json({ error: "Failed to get friends", message: error.message });
  }
});

app.get("/getFriendRequests/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ requests: user.requests });
  } catch (error) {
    res.status(500).json({ error: "Failed to get friend requests", message: error.message });
  }
});

// Messaging endpoints

// Send a message and store it in the chat history
app.post("/sendMessage", async (req, res) => {
  const { sender, receiver, content } = req.body;
  try {
    let chat = await Chat.findOne({ participants: { $all: [sender, receiver] } });
    if (!chat) {
      chat = new Chat({ participants: [sender, receiver], messages: [] });
    }
    const newMessage = { sender, receiver, content, timestamp: new Date() };
    chat.messages.push(newMessage);
    chat.updatedAt = new Date();
    await chat.save();
    res.status(200).json({ message: "Message sent", chat });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message", message: error.message });
  }
});

// Retrieve chat history between two users
app.get("/getChat", async (req, res) => {
  const { sender, receiver } = req.query;
  try {
    const chat = await Chat.findOne({ participants: { $all: [sender, receiver] } });
    if (!chat) {
      return res.status(200).json([]);
    }
    res.status(200).json(chat.messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve chat", message: error.message });
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Passwords do not match");
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Set session info (if needed)
    req.session.username = user._id;
    res.status(200).json({
      message: "Login successful",
      user: {
        username: user.username,
        email: user.email,
        friends: user.friends,
        requests: user.requests,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/test123", (req, res) => {
  res.send("Hello World");
});

export default app;
