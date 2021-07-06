const express = require('express');
const router = express.Router();
const { passwordController } = require('../controllers');

const { changePassword } = passwordController;

router.patch('/change/:id', changePassword);

module.exports = router;