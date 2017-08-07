const mongoose = require('mongoose')

const TeamsSchema = new mongoose.Schema({
  accessToken:{type:String},
  userId:{type: String},
  scope:{type:String},
  teamName:{type:String},
  teamId: {type:String}
})

module.exports = mongoose.model('Teams', TeamsSchema)
