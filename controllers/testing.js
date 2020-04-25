const router = require('express').Router()
const Product = require('../models/product')
const Category = require('../models/category')
const Order = require('../models/order')
const OrderUnit = require('../models/order_unit')
const User = require('../models/user')

router.post('/reset', async (request, response) => {
  await Product.deleteMany({})
  await Category.deleteMany({})
  await Order.deleteMany({})
  await OrderUnit.deleteMany({})
  await User.deleteMany({})

  response.status(204).end()
})

module.exports = router