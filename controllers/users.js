const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const path = require('path')
const { v4: uuidv4 } = require('uuid')


const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

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

usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({}).populate('notes', { content: 1, date: 1 })
  response.json(users.map(u => u.toJSON()))
})

usersRouter.get('/category-list', async (request, response) => {

  let user = []

  if (request.query.slug) {
    const slug = request.query.slug

    user = await User.find({ slug })
      .populate({
        path: 'categories',
        populate: {
          path: 'products',
          match: { hidden: false }
        }
      })
  }

  console.log('User in category list: ', user)

  if (user.length === 0) {
    return response.status(404).json({ error: 'This URL does not exist' })
  }

  if (!user[0].verified) {
    return response.status(400).json({ error: 'This account is not verified yet' })
  }

  response.json(user[0].toJSON())

})
usersRouter.get('/menu-list', async (request, response) => {

  let user = []

  if (request.query.username) {
    const username = request.query.username

    user = await User.find({ username })
      .populate({
        path: 'categories',
        populate: {
          path: 'products'
        }
      })
  }

  if (user.length === 0) {
    return response.status(404).json({ error: 'This URL does not exist' })
  }

  response.json(user[0].categories.map(cat => cat.toJSON()))

})

usersRouter.post('/user-info', async (request, response, next) => {
  try {

    const token = getTokenFrom(request)
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!token || !decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)

    response.json(user)

  } catch (exception) {
    next(exception)
  }
})

usersRouter.post('/', async (request, response, next) => {
  try {
    const body = request.body

    const username_check = await User.find({ username: body.username })

    if (username_check.length !== 0) {
      throw { name : 'SignupUsernameError', message : 'This username is already used.' }
    }

    const email_check = await User.find({ email: body.email })
    if (email_check.length !== 0) {
      throw { name : 'SignupEmailError', message : 'This email is already used.' }
    }

    const slug_check = await User.find({ email: body.slug })
    if (slug_check.length !== 0) {
      throw { name : 'SignupSlugError', message : 'This URL name is already used.' }
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const user = new User({
      username: body.username,
      name: body.name,
      email: body.email,
      slug: body.slug,
      subheading: 'take out',
      shop_button: 'Give me some sugar!',
      business_description: 'This is a description of your business which you can change in settings of your account :)',
      takeout_description: 'If you want to let customers know where or when to pick up the bought goods, write it in your settings as well!',
      location: '',
      image: '',
      verified: false,
      activation_link: '',
      passwordHash,
    })

    const savedUser = await user.save()

    response.json(savedUser)
  } catch (exception) {
    next(exception)
  }
})


usersRouter.put('/edit',uploadImage.single('image'), async (request, response, next) => {
  const body = request.body

  // console.log('Body of the request', body)

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  let editedUser = {
    name: body.name,
    subheading: body.subheading,
    shop_button: body.shop_button,
    business_description: body.business_description,
    takeout_description: body.takeout_description,
    location: body.location
  }

  if (request.file) {
    let image_path = request.file.filename
    editedUser = { ...editedUser, image: image_path }
  } else if (body.image === '') {
    editedUser = { ...editedUser, image: '' }
  }

  User.findByIdAndUpdate(body.id, editedUser, { new: true })
    .then(updatedUser => {
      response.json(updatedUser.toJSON())
    })
    .catch(error => next(error))
})


usersRouter.put('/categories', async (request, response, next) => {
  const body = request.body

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const newCategories = body.map((cat) => cat.id)

  const newUser = {
    categories: newCategories
  }

  User.findByIdAndUpdate(decodedToken.id, newUser, { new: true })
    .then(updatedUser => {
      response.json(updatedUser.toJSON())
    })
    .catch(error => next(error))

})

module.exports = usersRouter