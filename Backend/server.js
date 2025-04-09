import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./mongodb.js";
import User from "./Models/User.js";
import Chat from "./Models/Chat.js";
import Message from "./Models/Message.js";
import cors from "cors";
import session from "express-session";

dotenv.config();

const app = express();

app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"]
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
  const { fromUsername, toUsername } = req.body;

  try {
    const fromUser = await User.findOne({ username: fromUsername });
    const toUser = await User.findOne({ username: toUsername });

    if (!fromUser || !toUser) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Remove from the requests list
    fromUser.requests = fromUser.requests.filter(request => request !== toUsername);
    toUser.requests = toUser.requests.filter(request => request !== fromUsername);

    // Add to the friends list
    if (!fromUser.friends.includes(toUsername)) {
      fromUser.friends.push(toUsername);
    }

    if (!toUser.friends.includes(fromUsername)) {
      toUser.friends.push(fromUsername);
    }

    // Save the changes
    await fromUser.save();
    await toUser.save();

    // Return success response
    res.status(200).json({ message: "Friend request accepted", data: { fromUser, toUser } });
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

//Route to login a user
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Passwords do not match");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
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

//Route to initiate a chat between two users
app.post('/startChat', async (req, res) => {
  const { sender, receiver } = req.body;

  try {
    let chat = await Chat.findOne({
      participants: { $all: [sender, receiver] }
    });

    if (!chat) {
      chat = new Chat({
        participants: [sender, receiver],
        messages: [],
        lastMessage: null
      });
      await chat.save();
    }
    res.status(200).json({
      message: "Chat initiated successfully",
      data: {
        _id: chat._id,
        participants: chat.participants,
        messages: chat.messages,
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt,
      }
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ message: "Error creating chat", error: error.message });
  }
});

//Roue to get messages of a user listed in the chat
app.get('/getChats', async (req, res) => {
  const { username } = req.query;

  try {
    const chats = await Chat.find({
      participants: username,
    }).populate('messages')
    .sort({ updatedAt: -1 });

    if (!chats || chats.length === 0) {
      return res.status(404).json({ message: "No chats found for this user" });
    }

    res.status(200).json(chats);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ message: "Error fetching chats", error: err.message });
  }
});

//Route to get messages between two users
app.get("/getMessages", async (req, res) => {
  const { sender, receiver } = req.query;

  if (!sender || !receiver) {
    return res.status(400).json({ error: "Sender and receiver are required." });
  }

  try {
    // Step 1: Find the chat by participants (sender and receiver)
    const chat = await Chat.findOne({
      participants: { $all: [sender, receiver] },
    }).populate("messages"); // Populate the message IDs with actual message documents

    if (!chat) {
      return res.status(404).json({ error: "Chat not found." });
    }

    // Step 2: Return the populated messages in the chat
    return res.status(200).json({ messages: chat.messages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

//Route to send a message to a user
app.post("/send-message", async (req, res) => {
  const { sender, receiver, content } = req.body;

  // Validate message fields
  if (!sender || !receiver || !content) {
    return res.status(400).json({ error: "Sender, receiver, and content are required." });
  }

  try {
    // Step 1: Find the chat by participants (sender and receiver)
    const chat = await Chat.findOne({
      participants: { $all: [sender, receiver] } // Find chat where both sender and receiver are participants
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found." });
    }

    // Step 2: Create a new message document using the Message schema
    const newMessage = new Message({
      sender,
      receiver,
      content,
      timestamp: Date.now(),
    });

    // Step 3: Save the new message
    await newMessage.save();

    // Step 4: Add the new message's ObjectId to the messages array in the chat
    chat.messages.push(newMessage._id);

    console.log(`Message ID: ${newMessage._id} added to chat's messages array`);

    // Step 5: Update the lastMessage field to the new message
    chat.lastMessage = newMessage._id;

    // Step 6: Update the chat's updatedAt field
    chat.updatedAt = Date.now();

    // Step 7: Save the updated chat document
    await chat.save();

    console.log("Chat updated and saved successfully");

    // Return success response with the updated chat and new message
    return res.status(200).json({
      message: "Message added successfully",
      data: chat,
      newMessage: newMessage, // Include the new message in the response
    });
  } catch (error) {
    console.error("Error in adding message:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});