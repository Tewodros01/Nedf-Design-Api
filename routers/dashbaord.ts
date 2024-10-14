import { Router } from "express";
 
import { adminOnly } from "../middlewares/authHandler";
import { dashboard } from "../controllers/dashbaord";
const router = Router();

router.route("/").get(adminOnly, dashboard);

// TESTing only

export default router;
