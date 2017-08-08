const express = require('express');
const router = express.Router();
const slack = require('slack');
const Team = require('../models/teams.js');

router.get('/', (req, res) => {
  res.render('index', { title: 'Slack Timezoner', installButtonLink: process.env.INSTALL_BUTTON_LINK }) //this link is unique to each app
})

//slack button route
router.get('/install', (req, res) => {
  let client_id = process.env.SLACK_CLIENT_ID
  let client_secret = process.env.SLACK_CLIENT_SECRET
  let code = req.query.code

  let oauthPromise = new Promise((resolve, reject) => {
    slack.oauth.access({ client_id, client_secret, code }, (err, data) => {
      resolve(data)
      reject(err)
    })
  })

  oauthPromise.then((data) => {
    return Promise.all([Team.findOne({ teamId: data.team_id }), data])
  }).then(([team, data]) => {
    if (!team) {
      team = new Team(); // Team didn't exist.
    }
    team.accessToken = data.access_token
    team.scope = data.scope
    team.userId = data.user_id
    team.teamName = data.team_name
    team.teamId = data.team_id

    return team.save()
  }).then(() => {
    res.redirect('/')
  }).catch((err) => {
    console.error(err);
  })
})

router.post('/catchmessages', (req, res) => {
  res.send(req.body.challenge)
  let receivedText = req.body.event.text
  let timeRegex = /\d{1,2}:\d{2}(pm|am)?/i

  if (timeRegex.test(receivedText) && !req.body.event.subtype) {
    // Everything needed for the slack api interaction except text:
    let channel = req.body.event.channel
    let user = req.body.event.user
    let teamId = req.body.team_id
    let token = process.env.VERIFICATION_TOKEN //extracted from db in the real world

    // Capture the time the user sent via slack, and split it by the ':'
    let capturedTime = receivedText.match(timeRegex)[0].split(':')

    // SEPARATE HOUR AND MINUTES FOR LATER USE
    // Set user input time to am if no stipulation otherwise assign am or pm to variable
    let capturedAmPm = capturedTime[1].substring(2).length == 0 ? 'am' : capturedTime[1].substring(2)


     //handle 12:00/12:00am/12:00pm user input
    if(capturedAmPm=='am'){
      if((capturedTime[1].substring(2).length == 2 && capturedTime[0]=='12') || (capturedTime[1].substring(2).length == 0 && capturedTime[0]=='12') ){
        capturedTime[0] = '24'
      }
    }else if(capturedAmPm =='pm'){
      if(capturedTime[0]=='12'){
        capturedTime[0] = '0'
      } 
    }

    //Assign hour according to whether it is am or pm
    let capturedHour = capturedAmPm == 'am' ? parseInt(capturedTime[0]) : parseInt(capturedTime[0]) + 12
    // let capturedHour = parseInt(capturedTime[0]) //this only outputs am time
    let capturedMinutes = capturedTime[1] ? parseInt(capturedTime[1].substring(0, 2)) : 0

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

    let teamTokenPromise = Team.findOne({ teamId: teamId })
    teamTokenPromise.then((team) => {
      let token = team.accessToken
      // This promise fetches the user info (the user is the one who sent the message)
      let userInfoPromise = new Promise((resolve, reject) => {
        slack.users.info({ token, user }, (err, data) => {
          resolve(data)
          reject(err)
        })
      })
      return userInfoPromise
    }).then((info) => {

      // Slack's user info includes the tz_offest which is in unixTime
      const tzOffset = info.user.tz_offset

      // We use the created utcProjectedTime - tzOffset of the user to display it in local time for the viewer
      let unixDate = utcProjectedTime - tzOffset

      // This creates the message, needs formatting. 
      let text = `<!date^${unixDate}^The translation of that time is {time}.|Can we meet soon?>`

      let postMessagePromise = new Promise((resolve, reject) => {
        slack.chat.postMessage({ token, channel, text }, (err, data) => {
          resolve(data)
          reject(err)
        })
      })
      // Return a promise to catch any errors. 
      return postMessagePromise
    }).catch((err) => {
      console.error(err)
    })
  }
})

module.exports = router;
