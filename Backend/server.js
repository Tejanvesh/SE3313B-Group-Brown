import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./mongodb.js";
import User from "./Models/User.js";
import cors from "cors";
import session from "express-session";

dotenv.config();

const app = express();

app.use(express.json());

app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(session({
  secret: "yourSecretKey",
  resave: false,
  saveUninitialized: false
}));

const port = process.env.PORT || 5000;

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

// Route to create a new user
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

// Route to send friend request to a user
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

// Route to accept a friend request
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

// Route to reject a friend request
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

    // Remove the friend request
    user.requests = user.requests.filter(request => request !== fromUsername);
    await user.save();

    res.status(200).json({ message: "Friend request rejected successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject friend request", message: error.message });
  }
});

// Route to get all friends of a user
app.get("/getFriendRequests/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ requests: user.requests });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch friend requests", message: error.message });
  }
});

// Route to search for users by username while excluding the current user
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

    // Set session information (ensure you have express-session middleware configured)
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

// Route to remove a friend from a user's friend list
app.post("/removeFriend", async (req, res) => {
  const { username, friendUsername } = req.body;

  try {
    const user = await User.findOne({ username });
    const friendUser = await User.findOne({ username: friendUsername });

    if (!user || !friendUser) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    if (!user.friends.includes(friendUsername)) {
      return res.status(400).json({ error: "Users are not friends" });
    }

    // Remove friendUsername from user's friends list
    user.friends = user.friends.filter(friend => friend !== friendUsername);
    // Remove username from friendUser's friends list
    friendUser.friends = friendUser.friends.filter(friend => friend !== username);

    await user.save();
    await friendUser.save();

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove friend", message: error.message });
  }
});

// Route to get the friends of a user
app.get("/getFriends/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ friends: user.friends });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch friends", message: error.message });
  }
});
