'use strict';

const { User } = require('../../models/User');
const { updateToken } = require('../../core/updateToken');
const jwt = require('jsonwebtoken');
const { errorHandling } = require('../../middlewares/errorHandling');
const { generateOTP } = require('../../core/otpGenerator');
const { sendMail } = require('../../core/emailService');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function getAllUsers(req, res, next) {
  try {
    let users;
    users = await User.find();
    if (!users) errorHandling(`404|No users found.|`);
    return res.status(200).json({ users });
  } catch (e) {
    next(new Error(e.stack));
  }
}

async function getSingleUser(req, res, next) {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) errorHandling(`400|User does not exist.|`);
    res.status(200).json({
      statusCode: 200,
      data: user,
    });
  } catch (e) {
    next(new Error(e.stack));
  }
}

async function registerUser(req, res, next) {
  try {
    const data = req.body;
    const accountType = 'customer'; // Default

    if (!data.firstName) errorHandling(`400|Firstname field missing.|`);
    if (!data.lastName) errorHandling(`400|Lastname field missing.|`);
    if (!data.location) errorHandling(`400|Location field missing.|`);
    if (!data.email) errorHandling(`400|Email field missing.|`);
    if (!data.password) errorHandling(`400|Password field missing.|`);

    const existingUser = await User.findOne({
      email: data.email,
    });
    if (existingUser) errorHandling(`401|User with email already exists.|`);

    let otp = generateOTP();
    let otpExpiration = moment().add(15, 'minutes');

    let payload = {
      emailOtp: otp,
    };

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(data.password, salt);

    let newUser = {
      accountType,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      location: data.location,
      password: hashedPassword,
      emailOtp: otp,
      emailOtpExpiration: otpExpiration,
    };

    const createdUser = new User(newUser);

    await createdUser.save();

    const token = jwt.sign(
      {
        _id: createdUser._id,
      },
      process.env.TOKEN,
      {
        expiresIn: '7d',
      },
    );

    await updateToken(createdUser._id, token);

    const customerUser = await User.findOne({
      email: data.email,
    }).select(`-password -sellerDetails`);

    await sendMail('OTP Email Verification', data.email, 'otp', payload)
      .then(() => {
        res.status(200).json({
          statusCode: 200,
          message: 'Success, check your mail for your verification code!',
          data: customerUser,
          token: token,
        });
      })
      .catch((e) => {
        next(new Error(e.stack));
      });
  } catch (e) {
    next(new Error(e.stack));
  }
}

async function loginUser(req, res, next) {
  try {
    console.log(req.body);
    const data = req.body;

    if (!data.email) errorHandling(`400|Email field Missing/Empty.|`);
    if (!data.password) errorHandling(`400|Password field Missing/Empty.|`);

    const existingUser = await User.findOne({ email: data.email });
    if (!existingUser) errorHandling(`400|User Doesn't Exist.|`);
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) errorHandling(`400|Incorrect Password!.|`);
    const token = jwt.sign(
      { email: existingUser.email, _id: existingUser._id },
      process.env.TOKEN,
      {
        expiresIn: '7d',
      },
    );
    await updateToken(existingUser._id, token);
    res.status(200).json({
      message: 'Login Successful',
      token: token,
      response: existingUser,
    });
  } catch (e) {
    next(new Error(e.stack));
  }
}

async function verifyUser(req, res, next) {
  const emailOtp = req.query.emailOtp;

  try {
    if (!emailOtp) {
      errorHandling(`400|No otp detected.|`);
    }

    let user = await User.findOne({ emailOtp });

    if (user === null) {
      errorHandling(`400|OTP is Invalid.|`);
    }

    if (user && moment().isAfter(user?.otpExpiration)) {
      errorHandling(`400|OTP has Expired.|`);
    }

    user = await User.findOneAndUpdate(
      {
        emailOtp,
      },
      {
        emailOtp: '',
        emailOtpExpiration: '',
        isEmailVerified: true,
      },
      {
        new: true,
      },
    );

    await sendMail('Welcome to Regio!', user.email, 'onboarding', {});

    res.status(200).json({
      statusCode: 200,
      message: 'Email Verification Successful',
      data: user,
    });
  } catch (e) {
    next(new Error(e.stack));
  }
}

async function resendOTP(req, res, next) {
  try {
    const userID = req.query.userID;
    let user = await User.findById(userID);
    if (user === null) {
      errorHandling(`400|User not found.|`);
    }
    let emailOtp = generateOTP();
    let emailOtpExpiration = moment().add(15, 'minutes');
    user = await User.findByIdAndUpdate(
      userID,
      { emailOtp, emailOtpExpiration },
      { new: true },
    );

    await sendMail('New OTP Code', user.email, 'otp', { emailOtp });

    res.status(200).json({
      statusCode: 200,
      message: 'OTP Sent',
      data: user,
    });
  } catch (e) {
    next(new Error(e.stack));
  }
}

async function deleteAllUsers(req, res, next) {
  const { tag } = req.params;
  try {
    if (!tag || tag !== process.env.TOKEN) {
      errorHandling(`401|You are not HIM.|`);
    } else {
      await User.deleteMany();
      res.status(200).json({
        statusCode: 200,
        message: 'Successfully burnt down the world for you.',
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
}

async function initForgotPassword(request, response, next) {
  try {
    let data = request.body;

    if (!data.email) errorHandling(`400|Email field missing!.|`);

    let user = await User.findOne({ email: data.email });

    if (!user) errorHandling(`400|User does not exist.|`);

    // TODO: Add email to receive link for resetting password

    response.status(200).json({ user });
  } catch (e) {
    next(new Error(e.stack));
  }
}

async function finalizeForgotPassword(request, response, next) {
  try {
    let data = request.body;
    let id = request.params.id;

    let user = await User.findById(id);
    if (!user) errorHandling(`400|User does not exist.|`);

    if (!data.newpassword) errorHandling(`400|New password field missing.|`);

    const newhashedPassword = await bcrypt.hash(data.newpassword, salt);

    user = await User.findByIdAndUpdate(
      id,
      { password: newhashedPassword },
      { new: true },
    );

    // TODO: Add email to notify user

    response.status(200).json({ message: 'Password Resetted!!', user });
  } catch (e) {
    next(new Error(e.stack));
  }
}

module.exports = {
  getAllUsers,
  getSingleUser,
  registerUser,
  loginUser,
  verifyUser,
  resendOTP,
  deleteAllUsers,
  initForgotPassword,
  finalizeForgotPassword,
};

