const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const path = require('path')

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
logger.info('PORT: ', process.env.PORT)
logger.info('TEST mongo uri: ', process.env.TEST_MONGODB_URI)
logger.info('sev mongo uri: ', process.env.DEV_MONGODB_URI)
logger.info('secret: ', process.env.SECRET)
logger.info('Sekred at the beggining: ', process.env.SEKRED)

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

app.get('/*', (req, res) => {
  let url = path.join(__dirname+'/build/index.html')
  console.log('Url path: ', url)
  // if (!url.startsWith('/app/')) // we're on local windows
  //   url = url.substring(1)
  res.sendFile('/build/index.html', { root: __dirname })
})

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app