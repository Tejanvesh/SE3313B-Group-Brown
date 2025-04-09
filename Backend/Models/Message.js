import mongoose from "mongoose";

// Define the Message schema
const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // Sender of the message
  receiver: { type: String, required: true }, // Receiver of the message
  content: { type: String, required: true }, // Message content
  timestamp: { type: Date, default: Date.now }, // Timestamp of when the message was sent
});

// Create and export the Message model
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;
