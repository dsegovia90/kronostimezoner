const express = require('express');
const router = express.Router();
const slack = require('slack')


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
