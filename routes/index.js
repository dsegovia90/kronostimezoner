const express = require('express');
const router = express.Router();
const attachments = require('../lib/slack/attachments')
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
 res.json({text:"hello world"})
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
  /*  Note that this token is specific for each team, in this case
      this token is of our team. Once we develop the install button, 
      we need to store this key for each team to be able to send
      messages.  */
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



router.post('/catchmessages', (req, res) => {
  res.send(req.body.challenge)
  let receivedText = req.body.event.text
  let timeRegex = /\d{1,2}:\d{2}(pm|am)?/i
  
  if(timeRegex.test(receivedText) && !req.body.event.subtype){
    // Everything needed for the slack api interaction except text:
    let token = process.env.VERIFICATION_TOKEN //extracted from db in the real world
    let channel = req.body.event.channel
    let user = req.body.event.user

    // Capture the time the user sent via slack, and split it by the ':'
    let capturedTime = receivedText.match(timeRegex)[0].split(':')

    // Separate hour and minutes from the capturedTime for later use
    let capturedHour = parseInt(capturedTime[0])
    let capturedMinutes = capturedTime[1] ? parseInt(capturedTime[1].substring(0,2)) : 0

    //get the current date in UTC to know the year, month and day in UTC
    let utcDate = new Date(); 

    //use utcDate to create a new date object with the capturedHour and capturedMinutes
    let utcProjectedTime = new Date( 
      Date.UTC(
        utcDate.getUTCFullYear(), 
        utcDate.getUTCMonth(), 
        utcDate.getUTCDate(), 
        capturedHour, 
        capturedMinutes
      )).getTime() / 1000

    // This promise fetches the user info (the user is the one who sent the message)
    let userInfoPromise = new Promise((resolve, reject) => {
      slack.users.info({token, user}, (err, data) => {
        resolve(data)
        reject(err)
      })
    })

    userInfoPromise.then((info) => {

      // Slack's user info includes the tz_offest which is in unixTime
      const tzOffset = info.user.tz_offset

      // We use the created utcProjectedTime - tzOffset of the user to display it in local time for the viewer
      let unixDate = utcProjectedTime - tzOffset

      // This creates the message, needs formatting. 
      let text = `<!date^${unixDate}^The translation of that time is {time}.|Can we meet soon?>`
      
      // Return a promise to catch any errors. 
      return postMessagePromise = new Promise((resolve, reject) => {
        slack.chat.postMessage({token, channel, text}, (err, data) => {
          resolve(data)
          reject(err)
        })
      })
    })
    .catch((err) => {
      console.error(err)
    })

  }
})




module.exports = router;
