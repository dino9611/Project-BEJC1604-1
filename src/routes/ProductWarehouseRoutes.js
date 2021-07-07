const express = require("express");
const router = express.Router();

const { verifyTokenAccess } = require("../helpers/verifyToken");
const { ProductWarehouseController } = require("../controllers");

const { getProductsInOut, getProductsWarehouse, updateStock } =
  ProductWarehouseController;

router.get("/goingInOut", verifyTokenAccess, getProductsInOut);
router.get("/productsWarehouse", verifyTokenAccess, getProductsWarehouse);
router.post("/updateStockWarehouse", verifyTokenAccess, updateStock);

module.exports = router;
