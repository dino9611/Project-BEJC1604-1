const express = require("express");
const router = express.Router();

const { verifyTokenAccess } = require("../helpers/verifyToken");
const { ProductsInOutController } = require("../controllers");

const { getProductsInOut } = ProductsInOutController;

router.get("/goingInOut", verifyTokenAccess, getProductsInOut);

module.exports = router;
