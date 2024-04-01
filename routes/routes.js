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
  initForgotPassword,
  finalizeForgotPassword,
  deleteAllUsers,
} = require('../controllers/user');

const {sellerRegister} = require('../controllers/seller')

// Authentications
router.get('/auth/getAllUsers', getAllUsers);
router.get('/auth/getSingleUser/:id', getSingleUser);
router.post('/auth/registerUser', registerUser);
router.post('/auth/loginUser', loginUser);
router.post('/auth/verifyUser', verifyUser);
router.post('/auth/resendOtp', resendOTP);
router.post('/initializeForgotPassword/', initForgotPassword)
router.post('/finalizeForgotPassword/:id', finalizeForgotPassword)
router.delete('/auth/deleteAllUsers/:tag', deleteAllUsers);

// User Profile and Settings

// Orders

// Seller
router.post('/seller/register/:id', sellerRegister)


// Carts

// Posts

//

module.exports = router;

