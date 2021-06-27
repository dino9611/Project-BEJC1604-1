const express = require('express');
const router = express.Router();

const { verifyTokenAccess } = require('../helpers/verifyToken');
const { transactionController } = require('../controllers');

const { addToCart } = transactionController;

router.post('/cart', verifyTokenAccess, addToCart);

module.exports = router;