'use strict';

const { User } = require('../../models/User');
const { Product } = require('../../models/Product');

async function addProduct(request, response, next) {
  try {
    let data = request.body;

    let id = request.params.id;
    let user = await User.findById(id);
    if (!user) errorHandling(`400|User does not exist.|`);

    if (!data.productName) errorHandling(`400|Product Name field Missing.|`);
    if (!data.productDescription)
      errorHandling(`400|Product Description field Missing.|`);
    if (!data.productImage) errorHandling(`400|Product Image field Missing.|`);
    if (!data.productPrice) errorHandling(`400|Product Price field Missing.|`);
    if (!data.productCurrency)
      errorHandling(`400|Product Currency field Missing.|`);
    if (!data.productQuantity)
      errorHandling(`400|Product Quantity field Missing.|`);
    if (!data.productUnit) errorHandling(`400|Product Unit field Missing.|`);
    if (!data.productDiscount)
      errorHandling(`400|Product Discount field Missing.|`);
    if (!data.productCategory)
      errorHandling(`400|Product Category field Missing.|`);
    if (!data.totalProductQuantity)
      errorHandling(`400|Product Total Quantity field Missing.|`);

    data.sellerID = id;

    const newProduct = new Product(data);

    await newProduct.save();

    response.status(200).json({
      statusCode: 200,
      message: 'Success, product created!',
      data: newProduct,
    });
  } catch (e) {
    next(new Error(e.stack));
  }
}

module.exports = {
  addProduct,
};

