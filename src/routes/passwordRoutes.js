const express = require('express');
const router = express.Router();
const { passwordController } = require('../controllers');

const { resetPassword, forgotPassword } = passwordController;
const { verifyEmailForgotToken } = require('../helpers/verifyToken');

router.post('/forgot', forgotPassword);
router.put('/resetpassword', verifyEmailForgotToken, resetPassword);

module.exports = router;