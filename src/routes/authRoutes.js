const express = require('express');
const router = express.Router();

const { authController } = require('../controller');
const { getAllUsers, getUser, addDataUser } = authController;

router.get('/all', getAllUsers);
router.get('/:id', getUser);

router.post('/addData/:id', addDataUser);

module.exports = router;