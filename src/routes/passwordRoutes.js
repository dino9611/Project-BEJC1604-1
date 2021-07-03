const express = require('express');
const router = express.Router();
const { passwordController } = require('../controllers');

const { changePassword, forgotPassword } = passwordController;

router.patch('/change', changePassword);
router.patch('/forgot', forgotPassword);

module.exports = router;