const express = require('express');
const router = express.Router();

const { authController } = require('../controller');
const { getAllUsers, getUser, addPersonalData, addAddress } = authController;

router.get('/all', getAllUsers);
router.get('/:id', getUser);

router.post('/addData/:id', addPersonalData);
router.post('/addAddress/:id', addAddress);

module.exports = router;