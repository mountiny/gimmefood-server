const jwt = require('jsonwebtoken')
const config = require('../utils/config')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

loginRouter.post('/', async (request, response) => {
  const body = request.body
  console.log('Body: ', body)

  const user = await User.findOne({ username: body.username })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(body.password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid username or password'
    })
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  }

  console.log('Token secret: ', config.SECRET)

  const token = jwt.sign(userForToken, 'thisisveryverysecretstringS642342~#@#$')
  console.log(token)
  response
    .status(200)
    .send({ token, username: user.username, name: user.name })
})

module.exports = loginRouter