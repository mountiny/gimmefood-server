const productsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Category = require('../models/category')
const Product = require('../models/product')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

// GET ALL products WITH WRITTEN OUT USER INFORMATION

productsRouter.get('/', async (request, response) => {
  const products = await Product
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(products.map(product => product.toJSON()))
})

// CREATE NEW CATEGORY

productsRouter.post('/', async (request, response, next) => {
  const body = request.body

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)

  const category = await Category.findById(body.cat_id)

  const product = new Product({
    name: body.name,
    description_short: body.description_short,
    description_long: body.description_long,
    price: body.price,
    stock: body.stock,
    date: new Date(),
    hidden: body.hidden === undefined ? false : body.hidden,
    order: body.order,
    allergens: body.allergens,
    category: category._id,
    user: user._id
  })

  console.log('Product to be saved: ', product)

  const savedProduct = await product.save()

  console.log('Saved product: ', savedProduct)
  user.products = user.products.concat(savedProduct._id)
  console.log('User products adjusted: ', user.products)
  category.products = category.products.concat(savedProduct._id)
  console.log('Category products adjusted: ', category.products)
  await user.save()
  await category.save()

  response.json(savedProduct.toJSON())
})

// GET CATEGORY WITH SPECIFID ID

productsRouter.get('/:id', async (request, response) => {
  const product = await Product.findById(request.params.id)
  if (product) {
    response.json(product.toJSON())
  } else {
    response.status(404).end()
  }
})

// DELETE CATEGORY WITH GIVEN ID

productsRouter.delete('/', async (request, response, next) => {
  const body = request.body

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  await Product.findByIdAndRemove(body.prod_id)
  response.status(204).end()
})

// UPDATE CATEGORY WITH GIVEN ID

// productsRouter.put('/:id', (request, response, next) => {
//   const body = request.body

//   // const category = await Category.findById(body.cat_id)

//   const product = {
//     name: body.name,
//     description: body.description,
//     price: body.price,
//     stock: body.stock,
//     hidden: body.hidden === undefined ? false : body.hidden,
//     order: body.order,
//     allergens: body.allergens,
//     // category: category._id
//   }

//   Product.findByIdAndUpdate(request.params.id, product, { new: true })
//     .then(updatedProduct => {
//       response.json(updatedProduct.toJSON())
//     })
//     .catch(error => next(error))
// })

productsRouter.put('/', (request, response, next) => {
  const body = request.body

  console.log('Body of the request', body)

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const product = {
    name: body.name,
    description_short: body.description_short,
    description_long: body.description_long,
    price: body.price,
    stock: body.stock,
    hidden: body.hidden,
    order: body.order,
    allergens: body.allergens,
  }


  Product.findByIdAndUpdate(body.id, product, { new: true })
    .then(updatedProduct => {
      response.json(updatedProduct.toJSON())
    })
    .catch(error => next(error))
})


module.exports = productsRouter