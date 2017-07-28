const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
  token:{type: String},
  teamId: {type: String},
  teamDomain:{type:String},
  userId: {type: String},
  userName:{type:String}
})

module.exports = mongoose.model('User', UserSchema)

