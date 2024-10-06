import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getMe,
  loginuser,
  registeruser,
  resetPassword,
  updateuserSelf,
} from "../controllers/auth";
import { protect } from "../middlewares/authHandler";

const router = Router();

router
  .get("/me", protect, getMe)
  .post("/register", registeruser)
  .post("/login", loginuser)
  .put("/update-details", protect, updateuserSelf)
  .put("/change-password", protect, changePassword)
  .post("/forgot-password", forgotPassword)
  .put("/reset-password/:resetToken", resetPassword);

export default router;
