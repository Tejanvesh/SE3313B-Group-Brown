import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import net from "net";

// Configure Express
const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", // Your React app URL
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);

// Create an HTTP server
const server = http.createServer(app);

// Attach Socket.io to the HTTP server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow connection from your React app
    methods: ["GET", "POST"]
  }
});

// Configure TCP connection details for your C++ server
const TCP_SERVER_HOST = "127.0.0.1";
const TCP_SERVER_PORT = 8081; // Update if your C++ server runs on a different port

// When a Socket.io client connects
io.on("connection", (socket) => {
  console.log("Socket.io client connected:", socket.id);

  // Create a TCP client socket to connect to the C++ server
  const tcpClient = new net.Socket();
  tcpClient.connect(TCP_SERVER_PORT, TCP_SERVER_HOST, () => {
    console.log(
      `Connected to C++ server at ${TCP_SERVER_HOST}:${TCP_SERVER_PORT} for socket ${socket.id}`
    );
  });

  // Listen for "login" events from the React client
  socket.on("login", (username) => {
    const loginCommand = `LOGIN ${username}\n`;
    console.log(`Sending login command for ${socket.id}: ${loginCommand.trim()}`);
    tcpClient.write(loginCommand);
  });

  // Listen for "send_message" events from the client
  socket.on("send_message", ({ recipient, message }) => {
    const msgCommand = `MSG ${recipient} ${message}\n`;
    console.log(`Forwarding message from ${socket.id}: ${msgCommand.trim()}`);
    tcpClient.write(msgCommand);
  });

  // When data is received from the C++ server, forward it to the client
  tcpClient.on("data", (data) => {
    const response = data.toString();
    console.log(`Received from C++ server for ${socket.id}: ${response.trim()}`);
    socket.emit("receive_message", response);
  });

  // Handle TCP connection errors
  tcpClient.on("error", (error) => {
    console.error(`TCP error for ${socket.id}:`, error);
    socket.emit("error", "Error communicating with the messaging server.");
  });

  // Cleanup when the Socket.io client disconnects
  socket.on("disconnect", () => {
    console.log("Socket.io client disconnected:", socket.id);
    tcpClient.destroy(); // Close the TCP connection
  });
});

// Optionally add a test route
app.get("/", (req, res) => {
  res.send("Gateway is running.");
});

// Start the gateway server on a chosen port (e.g., 3001)
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Gateway server is listening on port ${PORT}`);
});
