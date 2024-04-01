'use strict';
const { User } = require('../../models/User');
const { updateToken } = require('../../core/updateToken');
const jwt = require('jsonwebtoken');
const { errorHandling } = require('../../middlewares/errorHandling');
const { generateOTP } = require('../../core/otpGenerator');
const { sendMail } = require('../../core/emailService');
const moment = require('moment');

async function sellerRegister(request, response, next){
  try {

    let data = request.body;

    let id = request.params.id;
    let user = await User.findById(id);
    if (!user) errorHandling(`400|User does not exist.|`)

    if(!data.companyName) errorHandling(`400|Company Name field Missing.|`)
    if(!data.ceo) errorHandling(`400|CEO field Missing.|`)
    if(!data.street) errorHandling(`400|Street field Missing.|`)
    if(!data.houseNumber) errorHandling(`400|House Number field Missing.|`)
    if(!data.postalCode) errorHandling(`400|Postal code field Missing.|`)
    if(!data.city) errorHandling(`400|City field Missing.|`)
    if(!data.country) errorHandling(`400|Country field Missing.|`)
    if(!data.vatID) errorHandling(`400|Vat ID field Missing.|`)

    data.availability = 'open'
    data.joinDate = moment()

    const accountType = "seller";

    let sellerDetails = data;

    user = await User.findByIdAndUpdate(id, { accountType, sellerDetails }, { new: true }).select('-password')

    response.status(200).json({ message: "Account Registered as Seller!!", data: user })

  }
  catch(e){
    next(new Error(e.stack))
  }
}

module.exports = {
  sellerRegister
}