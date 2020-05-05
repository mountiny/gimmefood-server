const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')

// Routers
const notesRouter = require('./controllers/notes')
const categoriesRouter = require('./controllers/categories')
const productsRouter = require('./controllers/products')
const ordersRouter = require('./controllers/orders')
const orderUnitsRouter = require('./controllers/orderUnits')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const stripeRouter = require('./controllers/stripe')

const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')
const helmet = require('helmet')

logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connection to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use(helmet())
app.use(middleware.requestLogger)

app.use('/api/users', usersRouter)
app.use('/api/notes', notesRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/order-units', orderUnitsRouter)
app.use('/api/login', loginRouter)

app.use('/api/:userSlug/stripe', stripeRouter)

if (process.env.NODE_ENV === 'development') {
  const testingRouter = require('./controllers/testing')
  app.use('/api/testing', testingRouter)
}

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app