const express = require('express');
const router = express.Router();

const { verifyTokenAccess } = require('../helpers/verifyToken');
const { transactionController } = require('../controllers');

const { addToCart, deleteCart, stockByProduct, editQty, chooseAddressCart, getBank, checkOut } = transactionController;

router.post('/cart', verifyTokenAccess, addToCart);
router.delete('/deletecart/:ordersdetail_id/:users_id', verifyTokenAccess, deleteCart);
router.get('/stockbyproduct/:prod_id', stockByProduct);
router.patch('/editqty', editQty);
router.put('/chooseaddress/:address_id/:users_id', chooseAddressCart);
router.get('/bank', getBank);
router.post('/checkout', checkOut);


module.exports = router;