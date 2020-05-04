const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({}).populate('notes', { content: 1, date: 1 })
  response.json(users.map(u => u.toJSON()))
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

module.exports = usersRouter