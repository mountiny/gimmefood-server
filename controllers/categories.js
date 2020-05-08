const categoriesRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/user')

const Category = require('../models/category')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

// GET ALL CATEGORIES WITH WRITTEN OUT USER INFORMATION

categoriesRouter.get('/', async (request, response) => {

  const username = request.query.username

  const user = await User.find({ username: username }).populate('categories', { name: 1 })

  if (user.length === 0) {
    return response.status(404).json({ error: 'This URL does not exist' })
  }

  console.log('I am here in Category')

  const categories = await Category
    .find({ 'user' : user[0]._id }).populate('user', { username: 1, name: 1 }).populate('products')

  response.json(categories.map(cat => cat.toJSON()))
})

// CREATE NEW CATEGORY

categoriesRouter.post('/', async (request, response, next) => {
  const body = request.body

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)

  const category = new Category({
    name: body.name,
    hidden: body.hidden === undefined ? false : body.hidden,
    date: new Date(),
    order: body.order,
    user: user._id
  })

  const savedCategory = await category.save()
  user.categories = user.categories.concat(savedCategory._id)
  await user.save()

  response.json(savedCategory.toJSON())
})

// GET CATEGORY WITH SPECIFID ID

categoriesRouter.get('/:id', async (request, response) => {
  const category = await Category.findById(request.params.id)
  if (category) {
    response.json(category.toJSON())
  } else {
    response.status(404).end()
  }
})

// DELETE CATEGORY WITH GIVEN ID

categoriesRouter.delete('/', async (request, response, next) => {
  const body = request.body

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  await Category.findByIdAndRemove(body.cat_id)
  response.status(204).end()
})

// UPDATE CATEGORY WITH GIVEN ID

categoriesRouter.put('/', (request, response, next) => {
  const body = request.body

  console.log('Body of the request', body)

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const category = {
    name: body.name,
    hidden: body.hidden,
    products: body.products.map((prod) => prod.id)
  }

  Category.findByIdAndUpdate(body.id, category, { new: true })
    .then(updatedCat => {
      response.json(updatedCat.toJSON())
    })
    .catch(error => next(error))
})


module.exports = categoriesRouter