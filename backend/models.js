const mongoose = require('mongoose');

// Review Schema
const reviewSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  hasUsedFirstOrderCoupon: { type: Boolean, default: false }
}, { timestamps: true });

// Product Schema with Dynamic Specs & Reviews
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, enum: ['Electronics', 'Fashion', 'Grocery'], required: true },
  imageUrl: { type: String, required: true },
  stock: { type: Number, default: 10 },
  specs: { type: Map, of: String }, // Flexible specifications (Processor, Fabric, Expiry, etc.)
  reviews: [reviewSchema]
}, { timestamps: true });

// Order Schema
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  orderItems: Array,
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  status: { type: String, default: 'Delivered' }
}, { timestamps: true });

// Coupon Schema
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountPercentage: { type: Number, required: true },
  isFirstOrderOnly: { type: Boolean, default: false }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Product: mongoose.model('Product', productSchema),
  Order: mongoose.model('Order', orderSchema),
  Coupon: mongoose.model('Coupon', couponSchema)
};