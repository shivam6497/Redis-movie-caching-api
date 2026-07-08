import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis.js";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email:string;
    };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const headers = req.headers.authorization;
    if(!headers || !headers.startsWith("Bearer ")) {
        res.status(401).json({
            message: "No token provided, authorization denied"
        });
        return;
    }

    const token = headers.split(" ")[1] as string;

    const isBlackListed = await redisClient.get(`blackList:${token}`);
    if(isBlackListed) {
        res.status(401).json({
            message: "Token is blacklisted, authorization denied"
        });
        return;
    }

    const secret = process.env.JWT_SECRET as string;

    const decoded = jwt.verify(token, secret) as unknown as { userId: string; email: string };
    req.user = decoded;
    next();
}