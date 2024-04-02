const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    emailOtp: {
      type: String,
    },
    emailOtpExpiration: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isSeller: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    accountType: {
      type: String,
      enum: ['customer', 'seller'],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    profilePhoto: {
      type: String,
    },
    sellerDetails: {
      companyName: {
        type: String,
      },
      ceo: {
        type: String,
      },
      street: {
        type: String,
      },
      houseNumber: {
        type: String,
      },
      postalCode: {
        type: String,
      },
      city: {
        type: String,
      },
      country: {
        type: String,
      },
      vatID: {
        type: String,
      },
      availability: {
        type: String,
        default: 'open',
      },
      joinDate: {
        type: String,
      },
      likes: {
        type: Array,
        ref: 'User',
      },
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model('User', userSchema);

module.exports = {
  User: User,
};

