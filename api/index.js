import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDB } from "../backend/src/lib/db.js";
import authRoutes from "../backend/src/routes/auth.route.js";
import messageRoutes from "../backend/src/routes/message.route.js";

dotenv.config();

const app = express();

// Connect to database once
let dbConnected = false;
async function ensureDbConnection() {
    if (!dbConnected) {
        await connectDB();
        dbConnected = true;
    }
}

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.CLIENT_URL || true,
        credentials: true,
    })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "API is running" });
});

// Vercel serverless function handler
export default async function handler(req, res) {
    await ensureDbConnection();
    return app(req, res);
}
