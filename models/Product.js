const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    sellerID: {
      type: String,
      required: true,
      ref: 'User',
    },
    productName: {
      type: String,
      required: true,
    },
    productDescription: {
      type: String,
      required: true,
    },
    productImage: {
      type: Array,
      required: true,
    },
    productPrice: {
      type: String,
      required: true,
    },
    productCurrency: {
      type: String,
      required: true,
    },
    productQuantity: {
      type: String,
      required: true,
    },
    productUnit: {
      type: String,
      required: true,
    },
    productDiscount: {
      type: String,
      required: true,
    },
    productCategory: {
      type: String,
      required: true,
    },
    totalProductQuantity: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Product = mongoose.model('Product', productSchema);

module.exports = {
  Product: Product,
};

