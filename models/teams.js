const mongoose = require('mongoose');

const TeamsSchema = new mongoose.Schema({
  accessToken: { type: String },
  userId: { type: String },
  scope: { type: String },
  teamName: { type: String },
  teamId: { type: String },
  lastUpdate: { type: Date, default: new Date() },
  count: { type: Number, default: 0 },
});

module.exports = mongoose.model('Teams', TeamsSchema);
