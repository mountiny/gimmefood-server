const mongoose = require('mongoose')

mongoose.set('useFindAndModify', false)

const orderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  delivery: {
    type: Boolean
  },
  paid: {
    type: Boolean
  },
  orders: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderUnit'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

orderSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    returnedObject.date = returnedObject.date.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Order', orderSchema)