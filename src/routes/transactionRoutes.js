const express = require('express');
const router = express.Router();

const { verifyTokenAccess } = require('../helpers/verifyToken');
const { transactionController } = require('../controllers');

const { addToCart, deleteCart } = transactionController;

router.post('/cart', verifyTokenAccess, addToCart);
router.delete('/deletecart/:ordersdetail_id/:users_id', verifyTokenAccess, deleteCart);

module.exports = router;