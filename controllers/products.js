const productsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Category = require('../models/category')
const Product = require('../models/product')

const path = require('path')
const { v4: uuidv4 } = require('uuid')


const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}


const DIR = './build/public/images'

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, DIR)
//   },
//   filename: (req, file, cb) => {
//     const fileName = file.originalname.toLowerCase().split(' ').join('-')
//     cb(null, uuidv4() + '-' + fileName)
//   }
// })

// var upload = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
//       cb(null, true)
//     } else {
//       cb(null, false)
//       return cb(new Error('Only .png, .jpg and .jpeg format allowed!'))
//     }
//   }
// })


const multer = require('multer')
const storage = multer.diskStorage({
  destination : function( req , file , cb ){
    cb(null,path.join(path.resolve(__dirname, '..'), 'public/uploads'))
  },
  filename: function( req , file , cb ){
    cb(null, uuidv4() + file.originalname)
  }
})
const uploadImage = multer({ storage : storage })

// GET ALL products WITH WRITTEN OUT USER INFORMATION

productsRouter.get('/', async (request, response) => {
  const products = await Product
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(products.map(product => product.toJSON()))
})

// // CREATE NEW CATEGORY
// productsRouter.post('/',uploadImage.single('image'), (request, response) => {
//   const body = request.body
//   console.log('Request ---', body)
//   console.log('Request file ---', request.file)
//   // upload(req, res, function (err) {
//   //   console.log('Request ---', req.body)
//   //   console.log('Request file ---', req.file)//Here you get file.
//   //   /*Now do where ever you want to do*/
//   //   if(!err) {
//   //     return res.send(200).end()
//   //   }
//   // })
// })

productsRouter.post('/',uploadImage.single('image'), async (request, response, next) => {
  const body = request.body

  const token = getTokenFrom(request)
  console.log('Token: ', token)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)
  const category = await Category.findById(body.cat_id)

  let image_path = ''

  if (request.file) {
    const image = request.file
    image_path = image.filename
  }

  const product = new Product({
    name: body.name,
    description_short: body.description_short,
    description_long: body.description_long,
    price: body.price,
    stock: body.stock,
    date: new Date(),
    hidden: body.hidden === undefined ? false : body.hidden,
    allergens: JSON.parse(body.allergens),
    image: image_path,
    category: category._id,
    user: user._id
  })

  const savedProduct = await product.save()

  user.products = user.products.concat(savedProduct._id)

  category.products = category.products.concat(savedProduct._id)

  try {
    await user.save()
  } catch (e) {
    next(e)
  }

  await category.save((err, category) => {
    if (err) {
      return response.json(err)
    }
  })

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

productsRouter.put('/',uploadImage.single('image'), async (request, response, next) => {
  const body = request.body

  console.log('Body of the request', body)

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  let product = {
    name: body.name,
    description_short: body.description_short,
    description_long: body.description_long,
    price: body.price,
    stock: body.stock,
    hidden: body.hidden,
    allergens: JSON.parse(body.allergens)
  }

  if (request.file) {
    let image_path = request.file.filename
    product = { ...product, image: image_path }
  } else if (body.image === '') {
    product = { ...product, image: '' }
  }

  Product.findByIdAndUpdate(body.id, product, { new: true })
    .then(updatedProduct => {
      response.json(updatedProduct.toJSON())
    })
    .catch(error => next(error))
})


module.exports = productsRouter