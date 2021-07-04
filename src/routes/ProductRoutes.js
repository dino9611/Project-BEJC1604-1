const express = require("express");
const router = express.Router();
const { ProductController } = require("../controllers");

const { getAllProducts, getProductPaginate, getProductDetail } = ProductController;

router.get("/all", getAllProducts);
router.get("/paging", getProductPaginate);
router.get("/productDetail/:id", getProductDetail);

module.exports = router;
