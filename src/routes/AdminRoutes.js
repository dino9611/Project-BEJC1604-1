const express = require("express");
const router = express.Router();

const { AdminController } = require("../controllers");

const {
  getProductAdmin,
  getAllCategory,
  getAllLocation,
  getAllProductAdmin,
  addProduct,
  deleteProduct,
} = AdminController;

router.get("/product", getProductAdmin);
router.get("/product/all", getAllProductAdmin);
router.get("/category", getAllCategory);
router.get("/location", getAllLocation);
router.post("/product/all", addProduct);
router.delete("/product/:id", deleteProduct);

module.exports = router;
