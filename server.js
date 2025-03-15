import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const activeIPs = new Set(); // Store unique IPs

io.on("connection", (socket) => {
    let clientIP = socket.handshake.headers["x-forwarded-for"] || socket.handshake.address;
    
    if (Array.isArray(clientIP)) {
        clientIP = clientIP[0]; // Take the first IP if it's an array
    }

    if (!activeIPs.has(clientIP)) {
        activeIPs.add(clientIP);
    }

    io.emit("userCount", activeIPs.size);
    console.log(`User connected: ${clientIP} | Active unique users: ${activeIPs.size}`);

    socket.on("disconnect", () => {
        const remainingConnections = Array.from(io.sockets.sockets.values()).some(
            (s) => s.handshake.address === clientIP
        );

        if (!remainingConnections) {
            activeIPs.delete(clientIP);
        }

        io.emit("userCount", activeIPs.size);
        console.log(`User disconnected: ${clientIP} | Active unique users: ${activeIPs.size}`);
    });
});

server.listen(3001, () => {
    console.log("WebSocket server running on port 3001");
});
