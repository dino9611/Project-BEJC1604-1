const express = require("express");
const router = express.Router();
const { adminController } = require("../controllers");

const {
  getProductAdmin,
  getAllCategory,
  getAllLocation,
  getAllProductAdmin,
  addProduct,
  updateProduct,
  deleteProduct,
  loginAdmin,
} = adminController;

router.get("/product", getProductAdmin);
router.get("/product/all", getAllProductAdmin);
router.get("/category", getAllCategory);
router.get("/location", getAllLocation);
router.post("/product/all", addProduct);
router.put("/product/all/:id", updateProduct);
router.delete("/product/:id", deleteProduct);
router.post("/login", loginAdmin);

module.exports = router;
