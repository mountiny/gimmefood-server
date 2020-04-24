const mongoose = require('mongoose')

mongoose.set('useFindAndModify', false)

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  hidden: {
    type: Boolean
  },
  order: {
    type: Number,
    required: true
  },
  products: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

categorySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    returnedObject.date = returnedObject.date.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Category', categorySchema)