import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "../backend/src/routes/auth.route.js";
import messageRoutes from "../backend/src/routes/message.route.js";

dotenv.config();

const app = express();

// MongoDB connection with caching for serverless
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }

    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        cachedDb = connection;
        console.log("MongoDB connected");
        return connection;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.CLIENT_URL || true,
        credentials: true,
    })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "API is running",
        mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

// Vercel serverless handler
export default async function handler(req, res) {
    try {
        // Ensure database connection
        await connectToDatabase();

        // Handle the request with Express
        return app(req, res);
    } catch (error) {
        console.error("Handler error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
}
