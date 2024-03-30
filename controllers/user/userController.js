const { User } = require('../../models/User');
const { updateToken } = require('../../core/updateToken');
const jwt = require('jsonwebtoken');
const { errorHandling } = require('../../middlewares/errorHandling');
const { generateOTP } = require('../../core/otpGenerator');
const { sendMail } = require('../../core/emailService');
const moment = require('moment');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find();
  } catch (err) {
    console.log(err);
  }
  if (!users) {
    res.status(404).json({ message: 'No users found!' });
  }
  return res.status(200).json({ users });
};

exports.getSingleUser = async (req, res, next) => {
  const userID = req.query.userID;
  try {
    const userProfile = await User.findOne({ _id: userID });
    res.status(200).json({
      statusCode: 200,
      data: userProfile,
    });
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.registerUser = async (req, res, next) => {
  const { firstName, lastName, email, password, location, sellerDetails } =
    req.body;
  const accountType = req.query.accountType;

  try {
    if (!firstName || !lastName || !location || !email || !password)
      errorHandling(`400|Please provide all fields.|`);
    if (!accountType) errorHandling(`400|Please provide account type.|`);
    if (!accountType === 'customer' || !accountType === 'seller')
      errorHandling(`400|Please provide a valid account type.|`);
    else {
      const existingUser = await User.findOne({
        email: email,
      });
      if (existingUser)
        errorHandling(`401|User with email, ${email} already exists.|`);

      if (accountType === 'seller' && !sellerDetails) {
        errorHandling(`400|Please provide seller details.|`);
      } else {
        let otp = generateOTP();
        let otpExpiration = moment().add(15, 'minutes');

        let data = {
          emailOtp: otp,
        };

        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashedPassword = await bcrypt.hash(password, salt);

        let newUser = {
          accountType,
          email,
          firstName,
          lastName,
          location,
          password: hashedPassword,
          emailOtp: otp,
          emailOtpExpiration: otpExpiration,
        };

        if (accountType === 'seller') {
          newUser = { ...newUser, sellerDetails };
        }

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
          email: email,
        }).select(`-password -sellerDetails`);

        const sellerUser = await User.findOne({
          email: email,
        }).select('-password');

        await sendMail('OTP Email Verification', email, 'otp', data)
          .then(() => {
            res.status(200).json({
              statusCode: 200,
              message: 'Success, check your mail for your verification code!',
              data: accountType === 'seller' ? sellerUser : customerUser,
              token: token,
            });
          })
          .catch((e) => {
            next(new Error(e.stack));
          });
      }
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!password || !email) {
      res.status(400).json({
        message: 'Please fill all fields',
      });
    } else {
      const existingUser = await User.findOne({ email: email });
      if (!existingUser) {
        res.status(401).json({
          message: 'User does not exist',
        });
      } else {
        const isMatch = await bcrypt.compare(password, existingUser.password);
        if (!isMatch) {
          res.status(401).json({
            message: 'Incorrect password',
          });
        } else {
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
        }
      }
    }
  } catch (e) {
    res.status(500).json({
      message: 'Internal server error, please try again later!',
    });
  }
};

exports.verifyUser = async (req, res, next) => {
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
};

exports.resendOTP = async (req, res, next) => {
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
};

exports.deleteAllUsers = async (req, res, next) => {
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
};

