import { Router } from "express";
import {
  deleteuser,
  getuser,
  getusers,
} from "../controllers/customers";
import { adminOnly } from "../middlewares/authHandler";

const router = Router();

router.get("/", adminOnly, getusers);

router
  .get("/:id", adminOnly, getuser)
  .delete("/:id", adminOnly, deleteuser);

export default router;
