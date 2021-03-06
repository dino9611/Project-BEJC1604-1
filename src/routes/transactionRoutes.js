const express = require("express");
const router = express.Router();

const { verifyTokenAccess } = require("../helpers/verifyToken");
const { transactionController } = require("../controllers");

const {
  addToCart,
  deleteCart,
  stockByProduct,
  editQty,
  getBank,
  checkOut,
  getOrders,
  uploadPayment,
  getDetailOrders,
  getHistory,
  getDetailHistory,
  acceptedOrder,
} = transactionController;

router.post("/cart", verifyTokenAccess, addToCart);
router.delete(
  "/deletecart/:ordersdetail_id/:users_id",
  verifyTokenAccess,
  deleteCart
);
router.get("/stockbyproduct/:prod_id", stockByProduct);
router.patch("/editqty", editQty);
router.get("/bank", getBank);
router.post("/checkout", checkOut);
router.get("/history/:users_id", getOrders);
router.post("/uploadpayment/:orders_id", verifyTokenAccess, uploadPayment);
router.get("/ordersdetail/:orders_id", getDetailOrders);
router.get("/history", verifyTokenAccess, getHistory);
router.get("/detailHistory/:id", getDetailHistory);
router.patch("/editqty", editQty);
router.put("/accepted-order", verifyTokenAccess, acceptedOrder);


module.exports = router;
