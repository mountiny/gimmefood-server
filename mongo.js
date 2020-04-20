const mongoose = require('mongoose')

if ( process.argv.length<3 ) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url =
  `mongodb+srv://mountiny_takeout:${password}@takeout-1t5ya.mongodb.net/takeout?retryWrites=true&w=majority`

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })

const noteSchema = new mongoose.Schema({
  content: String,
  date: Date,
  important: Boolean,
})

const Note = mongoose.model('Note', noteSchema)

const search = (filter) => {
    Note.find({filter}).then(result => {

        mongoose.connection.close()
        return result;
    })
}
const all_important = () => {
    Note.find({important: true}).then(result => {
        mongoose.connection.close()
        return result;
    })
}

// Note.find({}).then(result => {
//     result.forEach(note => {
//       console.log(note)
//     })
//     mongoose.connection.close()
// })