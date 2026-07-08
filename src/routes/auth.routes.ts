import { Router } from "express";
import { register, Login, Logout, getMe } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", Login);
router.post("/logout", authMiddleware, Logout); 
router.get("/me", authMiddleware, getMe);         

export default router;