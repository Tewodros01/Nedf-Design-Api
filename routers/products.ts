import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductCount,
  getProducts,
  searchProducts,
  updateProduct,
} from "../controllers/products";
import { adminOnly } from "../middlewares/authHandler";
import {upload} from "../utils/uploadFile";
const router = Router();

router
  .get("/", getProducts)
  .get("/count", getProductCount)
  .get("/search", searchProducts)
// Use `upload.fields()` to handle multiple files with different names
.post("/", adminOnly, upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }]), createProduct);

router
  .get("/:id", getProduct)
  .put("/:id", adminOnly, updateProduct)
  .delete("/:id", adminOnly, deleteProduct);

export default router;
