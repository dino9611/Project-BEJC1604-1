const express = require("express");
const router = express.Router();

const { verifyTokenAccess } = require("../helpers/verifyToken");
const { transactionController } = require("../controllers");

const {
  addToCart,
  deleteCart,
  stockByProduct,
  editQty,
  getHistory,
  getDetailHistory,
} = transactionController;

router.post("/cart", verifyTokenAccess, addToCart);
router.delete(
  "/deletecart/:ordersdetail_id/:users_id",
  verifyTokenAccess,
  deleteCart
);
router.get("/stockbyproduct/:prod_id", stockByProduct);
router.get("/history", verifyTokenAccess, getHistory);
router.get("/detailHistory/:id", getDetailHistory);
router.patch("/editqty", editQty);

module.exports = router;
