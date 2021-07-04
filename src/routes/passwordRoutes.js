const express = require('express');
const router = express.Router();
const { passwordController } = require('../controllers');

const { changePassword, forgotPassword } = passwordController;

router.patch('/change/:id', changePassword);
router.put('/forgot', forgotPassword);

module.exports = router;