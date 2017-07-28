const express = require('express');
const router = express.Router();
const attachments = require('../lib/slack/attachments')
const User = require('../models/Users')
const cities = require('../lib/cities')

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Slack-Timezoner' });
});

router.post('/helloworld', (req, res) => {
  User.findOne({ userId: req.body.user_id, teamId: req.body.team_id })
    .then((user) => {
      let message = undefined
      if (!user) {
        user = new User()
        message = { "text": `Hello *@${req.body.user_name}*!\nYou are now stored in the database.` }
      }
      user.token = req.body.token
      user.teamId = req.body.team_id
      user.teamDomain = req.body.team_domain
      user.userId = req.body.user_id
      user.userName = req.body.user_name
      message = message ? message : { "text": `Welcome back *@${req.body.user_name}*!` }
      user.save()
      return message
    }).then((message) => {
      res.json(message)
    }).catch((err) => {
      //this catches any error in the chain, no need to catch twice.
      console.log(err)
    })
})

router.post('/city', (req, res) => {
  console.log("OPENING PAY: " + JSON.stringify(req.body))
  res.json({
    "Content-type": "application/json",
    "response_type": 'ephemeral',
    "text": `Hi ${req.body.user_name}!`,
    "attachments": [
      {
        "text": "What city are you from:",
        "mrkdwn": true,
        "fallback": "You are unable to choose a city",
        "callback_id": "city",
        "attachment_type": "default",
        "actions": [
          {
            "name": 'city',
            "text": 'City',
            "type": 'select',
            "value": 'city',
            "style": 'primary',
            "options": attachments.loopCities(cities)
          }
        ]
      }
    ]
  })
})

router.post('/showcity', (req, res) => {
  let payload = JSON.parse(req.body.payload)
  console.log("PARSE: " + JSON.stringify(JSON.parse(req.body.payload)))
  res.json({ "text": `${payload.user.name} chose *${payload.actions[0].selected_options[0].value}*` })
})

module.exports = router;
