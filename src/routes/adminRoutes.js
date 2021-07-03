const express = require("express");
const router = express.Router();
const {
  verifyTokenAccess,
} = require("./../helpers/verifyToken");
const { adminController } = require("../controllers");

const {
  TransactionAdmin,
  getProductAdmin,
  getAllCategory,
  getAllLocation,
  getAllProductAdmin,
  addProduct,
  updateProduct,
  deleteProduct,
  loginAdmin,
  getRevenue,
  potentialRevenue
} = adminController;

router.get("/product", getProductAdmin);
router.get("/product/all", getAllProductAdmin);
router.get("/category", getAllCategory);
router.get("/location", getAllLocation);
router.post("/product/all", addProduct);
router.put("/product/all/:id", updateProduct);
router.delete("/product/:id", deleteProduct);
router.post("/login", loginAdmin);
router.get("/list-transaction", verifyTokenAccess, TransactionAdmin);
router.get('/revenue', getRevenue);
router.get('/potential', potentialRevenue);

module.exports = router;
