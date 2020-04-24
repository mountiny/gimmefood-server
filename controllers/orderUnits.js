const orderUnitsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Order = require('../models/order')
const OrderUnit = require('../models/order_unit')
const Product = require('../models/product')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

// GET ALL CATEGORIES WITH WRITTEN OUT USER INFORMATION

orderUnitsRouter.get('/', async (request, response) => {
  const orderUnits = await OrderUnit
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(orderUnits.map(cat => cat.toJSON()))
})

// CREATE NEW CATEGORY

orderUnitsRouter.post('/', async (request, response, next) => {
  const body = request.body

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)
  const product = await Product.findById(body.product_id)
  const order = await Order.findById(body.order_id)

  const orderUnit = new OrderUnit({
    amount: body.amount,
    product: product._id,
    order: order._id,
    user: user._id
  })

  const savedOrderUnit = await orderUnit.save()
  user.orders = user.orders.concat(savedOrderUnit._id)
  await user.save()
  order.orders = order.orders.concat(savedOrderUnit._id)
  await order.save()
  product.stock = product.stock - 1
  await product.save()

  response.json(savedOrderUnit.toJSON())
})

// GET CATEGORY WITH SPECIFID ID

orderUnitsRouter.get('/:id', async (request, response) => {
  const orderUnit = await OrderUnit.findById(request.params.id)
  if (orderUnit) {
    response.json(orderUnit.toJSON())
  } else {
    response.status(404).end()
  }
})

// DELETE CATEGORY WITH GIVEN ID

orderUnitsRouter.delete('/:id', async (request, response) => {
  await OrderUnit.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

// UPDATE CATEGORY WITH GIVEN ID

// orderUnitsRouter.put('/:id', (request, response, next) => {
//   const body = request.body

//   const orderUnit = {
//     amount: body.amount
//   }

//   OrderUnit.findByIdAndUpdate(request.params.id, orderUnit, { new: true })
//     .then(updatedOrderUnit => {
//       response.json(updatedOrderUnit.toJSON())
//     })
//     .catch(error => next(error))
// })


module.exports = orderUnitsRouter