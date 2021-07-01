const express = require("express");
const router = express.Router();
const {
  verifyTokenAccess,
} = require("./../helpers/verifyToken");
const { adminController } = require("../controllers");

const {
  ConfirmTransactionAdmin,
  RejectTransactionAdmin,
  Transaction,
  DetailTransaction,
  GetDataAdmin,
  getProductAdmin,
  getAllCategory,
  getAllLocation,
  getAllProductAdmin,
  updateProduct,
  addProduct,
  deleteProduct,
  loginAdmin,
} = adminController;

router.get("/product", getProductAdmin);
router.get("/product/all", getAllProductAdmin);
router.get("/category", getAllCategory);
router.get("/location", getAllLocation);
router.put("/product/all/:id", updateProduct);
router.post("/product/all", addProduct);
router.delete("/product/:id", deleteProduct);
router.post("/login", loginAdmin);
router.get("/transaction", verifyTokenAccess, Transaction);
router.get("/detail-transaction", verifyTokenAccess, DetailTransaction);
router.get("/data-admin", verifyTokenAccess, GetDataAdmin);
router.put("/confirm-transaction", verifyTokenAccess, ConfirmTransactionAdmin);
router.put("/reject-transaction", verifyTokenAccess, RejectTransactionAdmin);

module.exports = router;
