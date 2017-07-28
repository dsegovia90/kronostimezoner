const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
	token:{type: String},
    teamID: {type: String},
    teamDomain:{type:String},
    channelID: {type: String},
    channelName: {type: String},
    userID: {type: String},
	userName:{type:String, default:''},
	timeStamp:{type:Date, default:Date.now}
})

const Run = mongoose.model('User', UserSchema)

module.exports = User
