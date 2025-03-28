import mongoose from "mongoose";


// This file defines the Chat and Message schemas for MongoDB using Mongoose.
//Message schema can bee useed to define thee orintenation of each message so sender on the right and reciever on left


const MessageSchema = new mongoose.Schema({
    sender: { type: String, required: true }, // Sender of the message
    receiver: { type: String, required: true},
    content: { type: String, required: true }, // Message content
    timestamp: { type: Date, default: Date.now }, // Timestamp of when the message was sent
  });

const ChatSchema = new mongoose.Schema({
    participants: [{ type: String }], // Users in chat
    messages: [MessageSchema], // Store messages in order with sender and timestamp
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }, // Last message in chat
    updatedAt: { type: Date, default: Date.now },
  });

  export const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
  export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);