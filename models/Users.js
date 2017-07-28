const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
  token:{type: String},
  teamID: {type: String},
  teamDomain:{type:String},
  userID: {type: String},
  userName:{type:String}
})

module.exports = mongoose.model('User', UserSchema)

