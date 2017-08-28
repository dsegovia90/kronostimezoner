const express = require('express');
const router = express.Router();
const slack = require('slack');
const Team = require('../models/teams.js');

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
    res.redirect('/thanks');
  }).catch((err) => {
    
    res.redirect('/?install=unsuccessful');
    console.error(err);
  })
})

router.post('/catchmessages', (req, res) => {
  res.send(req.body.challenge)
  let receivedText = req.body.event.text
  //split receivedText so that you can find the am pm after the space as an index
  let receivedTextArr = receivedText.toLowerCase().split(' ')
  let timeRegex = /\d{1,2}:\d{2}(pm|am)?/i

  if (timeRegex.test(receivedText) && !req.body.event.subtype) {
    console.log('received a time!')
    // Everything needed for the slack api interaction except text:
    let channel = req.body.event.channel
    let user = req.body.event.user
    let teamId = req.body.team_id
    // Capture the time the user sent via slack, and split it by the ':'
    let capturedTime = receivedText.match(timeRegex)[0].split(':')
    // SEPARATE HOUR AND MINUTES FOR LATER USE
    //check for ap pm after capturedTime followed by a space
    let checkTime = capturedTime.join(':')
    //capture next index after time
    let wordAfterTime = receivedTextArr[receivedTextArr.indexOf(checkTime)+1]
    //capture first two indexes of wordAfterTime
    let parseAmPm = wordAfterTime ? wordAfterTime.substring(0,2):''
    //conditionally set variable to am or pm
    let capturedAmPm = parseAmPm == 'pm' ? 'pm' : capturedTime[1].substring(2).length == 0 ? 'am': capturedTime[1].substring(2)
    //handle 12:00/12:00am/12:00pm user input
    if (capturedAmPm == 'am') {
      if ((capturedTime[1].substring(2).length == 2 && capturedTime[0] == '12') || (capturedTime[1].substring(2).length == 0 && capturedTime[0] == '12')) {
        capturedTime[0] = '24'
      }
    } else if (capturedAmPm == 'pm') {
      if (capturedTime[0] == '12') {
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
    let token
    let teamTokenPromise = Team.findOne({ teamId: teamId })
    teamTokenPromise.then((team) => {
      token = team.accessToken
      team.count++
      team.save()

      // This promise fetches the user info (the user is the one who sent the message)
      let userInfoPromise = new Promise((resolve, reject) => {
        slack.users.info({ token, user }, (err, data) => {
          if(err){
            reject(err)
          }else{
            resolve(data)
          }
        })
      })
      return userInfoPromise
    }).then((info) => {
      // Slack's user info includes the tz_offest which is in unixTime
      const tzOffset = info.user.tz_offset

      // We use the created utcProjectedTime - tzOffset of the user to display it in local time for the viewer
      let unixDate = utcProjectedTime - tzOffset

      let text

      if (capturedHour > 24 || capturedMinutes > 59) {
        text = `_Incorrect Time:_\n` + 
        `Hour must be less than 24 & minutes less than 60. \n` +
        `You entered ${capturedHour}:${capturedTime[1]}${capturedAmPm}`
      } else {
        text = `The time <@${user}> mentioned translates into <!date^${unixDate}^ {time} in your time.` + 
        `|Attempting to translate time but your slack version does not support it.>`
      }
      let postMessagePromise = new Promise((resolve, reject) => {
        slack.chat.postMessage({ token, channel, text }, (err, data) => {
          resolve(data)
          reject(err)
        })
      })
      // Return a promise to catch any errors. 
      return postMessagePromise
    })
      .catch((err) => {
        console.error(err)
      })
  }
})

module.exports = router;
