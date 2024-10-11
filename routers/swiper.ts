import { Router } from "express";
import { createSwipper, deleteSwipper, getSwipper, getSwippers, updateSwipper } from "../controllers/swiper";
import { adminOnly } from "../middlewares/authHandler";
import { upload } from "../utils/uploadFile";

const router = Router();

router.route("/").get(getSwippers).post(adminOnly,upload.single('image'), createSwipper);

router
  .route("/:id")
  .get(getSwipper)
  .put(adminOnly, updateSwipper)
  .delete(adminOnly, deleteSwipper);

export default router;
