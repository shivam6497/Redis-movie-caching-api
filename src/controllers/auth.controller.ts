import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import redisClient from "../config/redis.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { addEmailJob, JobPriority } from "../queues/email.queue.js";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRE_IN = "24h";
const BLACKLIST_TTL = 60 * 60 * 24;

function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRE_IN });
}

// register endpoint
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        message: "Name, email and password are required",
      });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        message: "User already exists",
      });
      return;
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user._id.toString(), user.email);

    try {
      await addEmailJob(
        { userId: user._id.toString(), email: user.email, name: user.name },
        JobPriority.NORMAL,
      );
    } catch (emailError) {
      console.error("Failed to queue welcome email:", emailError);
    }

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
}

// login endpoint
export async function Login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        message: "email and password are required",
      });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({
        message: "Invalid credentials",
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({
        message: "Invalid credentials",
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.email);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
}

// logout endpoint
export async function Logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(400).json({
        message: "No token provided",
      });
      return;
    }

    await redisClient.setex(`blackList:${token}`, BLACKLIST_TTL, "true");

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user?.userId).select("-password").lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
}
