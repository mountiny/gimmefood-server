const mongoose = require('mongoose')

mongoose.set('useFindAndModify', false)

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 80
  },
  description: {
    type: String,
    maxlength: 300
  },
  price: {
    type: Number,
    required: true,
    set: p => (p*100),
    get: p => (p/100).toFixed(2)
  },
  stock: {
    type: Number,
    require: true,
    max: 100,
    min: -1
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
  allergens: {
    type: [Number]
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

productSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    returnedObject.date = returnedObject.date.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Product', productSchema)