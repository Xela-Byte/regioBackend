'use strict';
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../core/verifyToken');
const {
  getAllUsers,
  registerUser,
  loginUser,
  verifyUser,
  getSingleUser,
  resendOTP,
  deleteAllUsers,
} = require('../controllers/user/userController');

// Authentications
router.get('/auth/getAllUsers', getAllUsers);
router.get('/auth/getSingleUser', getSingleUser);
router.post('/auth/registerUser', registerUser);
router.post('/auth/loginUser', loginUser);
router.post('/auth/verifyUser', verifyUser);
router.post('/auth/resendOtp', resendOTP);
router.delete('/auth/deleteAllUsers/:tag', deleteAllUsers);

module.exports = router;

