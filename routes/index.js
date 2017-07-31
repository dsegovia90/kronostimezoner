const express = require('express');
const router = express.Router();
const responses = require('../lib/slack/responses')
const User = require('../models/Users')
const cities = require('../lib/cities')
const moment = require('moment')
const slack = require('slack')


function findDates() {

  let datesArr = []
  let nextDate
  let dateObj = {}
  for (let i = 0; i < 31; i++) {
    console.log("TIME:" + moment().add(i, 'days').format('ll'))
    nextDate = moment().add(i, 'days').format('ll')
    dateObj = { "text": nextDate, "value": nextDate }
    datesArr.push(dateObj)
  }
  console.log("DATESARR: " + datesArr)
  return datesArr
}

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

router.post('/choosedate', (req, res) => {
  console.log("OPENING PAY: " + JSON.stringify(req.body))
  res.json({
    "Content-type": "application/json",
    "response_type": 'ephemeral',
    "text": `Hi @${req.body.user_name}!`,
    "attachments": [
      {
        "text": "What day would you like to choose:",
        "mrkdwn": true,
        "fallback": "You are unable to choose a day",
        "callback_id": "choose_day",
        "attachment_type": "default",
        "actions": [
          {
            "name": 'day',
            "text": 'Choose Day',
            "type": 'select',
            "value": 'day',
            "style": 'primary',
            "options": responses.chooseDates()
          }
        ]
      }
    ]
  })
})

router.post('/showdate', (req, res) => {
  let payload = JSON.parse(req.body.payload)
  console.log("PARSE: " + JSON.stringify(JSON.parse(req.body.payload)))
  res.json({ "text": `@${payload.user.name} chose *${payload.actions[0].selected_options[0].value}*` })
})

router.post('/sendtime', (req, res) => {
  res.end();
  let channel = req.body.channel_id
  let token = process.env.VERIFICATION_TOKEN
  let unixDate = Math.round(Date.now() / 1000)
  let text = `<!date^${unixDate}^The time and date is {date} at {time}.|Can we meet soon?>`

  let postMessagePromise = new Promise((resolve, reject) => {
    slack.chat.postMessage({ token, channel, text }, (err, data) => {
      resolve(data);
      reject(err);
    })
  })

  postMessagePromise.then((data) => {
    console.log(data)
  }).catch((err) => {
    console.error(err)
  })
})

module.exports = router;
