const ordersRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Order = require('../models/order')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

// GET ALL CATEGORIES WITH WRITTEN OUT USER INFORMATION

ordersRouter.get('/', async (request, response) => {
  const orders = await Order
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(orders.map(order => order.toJSON()))
})

// CREATE NEW CATEGORY

ordersRouter.post('/', async (request, response, next) => {
  const body = request.body

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)

  const order = new Order({
    name: body.name,
    state: body.state,
    date: new Date(),
    delivery: body.delivery === undefined ? false : body.delivery,
    paid: body.paid === undefined ? false : body.paid,
    orders: body.orders,
    user: user._id
  })

  const savedOrder = await order.save()
  user.orders = user.orders.concat(savedOrder._id)
  await user.save()

  response.json(savedOrder.toJSON())
})

// GET CATEGORY WITH SPECIFID ID

ordersRouter.get('/:id', async (request, response) => {
  const order = await Order.findById(request.params.id)
  if (order) {
    response.json(order.toJSON())
  } else {
    response.status(404).end()
  }
})

// DELETE CATEGORY WITH GIVEN ID

ordersRouter.delete('/:id', async (request, response) => {
  await Order.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

// UPDATE CATEGORY WITH GIVEN ID

ordersRouter.put('/:id', (request, response, next) => {
  const body = request.body

  const order = {
    name: body.name,
    state: body.state,
    delivery: body.delivery === undefined ? false : body.delivery,
    paid: body.paid === undefined ? false : body.paid,
    orders: body.orders
  }

  Order.findByIdAndUpdate(request.params.id, order, { new: true })
    .then(updatedOrder => {
      response.json(updatedOrder.toJSON())
    })
    .catch(error => next(error))
})


module.exports = ordersRouter