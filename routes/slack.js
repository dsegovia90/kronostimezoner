const express = require('express');

const router = express.Router();
const slack = require('slack');
const Team = require('../models/teams.js');

// slack button route
router.get('/install', (req, res) => {
  const client_id = process.env.SLACK_CLIENT_ID; // eslint-disable-line
  const client_secret = process.env.SLACK_CLIENT_SECRET; // eslint-disable-line
  const code = req.query.code;

  const oauthPromise = new Promise((resolve, reject) => {
    slack.oauth.access({ client_id, client_secret, code }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

  oauthPromise.then(data => (Promise.all([Team.findOne({ teamId: data.team_id }), data])
  )).then(([team, data]) => {
    let teamToStore = team;
    if (!teamToStore) {
      teamToStore = new Team(); // Team didn't exist.
    }
    teamToStore.accessToken = data.access_token;
    teamToStore.scope = data.scope;
    teamToStore.userId = data.user_id;
    teamToStore.teamName = data.team_name;
    teamToStore.teamId = data.team_id;

    return teamToStore.save();
  }).then(() => {
    res.redirect('/thanks');
  }).catch((err) => {
    res.redirect('/?install=unsuccessful');
    console.error(err);
  });
});

router.post('/kronos', (req, res) => {
  const slackResponse = {};
  slackResponse.response_type = 'ephemeral';
  if (req.body.user_name) {
    slackResponse.text = `Hello <@${req.body.user_name}>. Need Help?
    _To have the time translated, simply type your message including a time in one of the following formats:_
        *HH:MM* _10:30_
        *H:MM*  _1:30_ (will translate to AM)
        *H:MMam*  _3:30am_ (or pm)
        *Ham* _3am_ (or pm)
        *H am* _3 am_ (or pm)  
        *Note*: _am and pm are NOT case-sensitive_

    _Enjoy Kronos Timezoner!_`;
  } else {
    slackResponse.text = 'An error has been made';
  }
  res.json(slackResponse);
});

router.post('/catchmessages', (req, res) => {
  res.send(req.body.challenge);
  const receivedText = req.body.event.text;
  // split receivedText so that you can find the am pm after the space as an index
  const timeRegex = /\d{1,2}:\d{2}(pm|am)?/i;
  const hourRegex = /\d{1,2}(pm|am)?/i;
  // const timeRegex = /\d{1,2}:\d{2}[pm,am]|\d{1,2}:\d{2} [pm,am] |\d{1,2}:\d{2}/i;
  // const hourRegex = /\d{1,2}[^:][pm,am]|\d{1,2}[^:] [pm,am]/i;

  if ((timeRegex.test(receivedText) || hourRegex.test(receivedText)) && !req.body.event.subtype) {
    // split receivedText so that you can find the am pm after the space as an index
    const receivedTextArr = receivedText.toLowerCase().split(' ');
    console.log('RECEIVEDTEXTARRAY')
    console.log(receivedTextArr)
    console.log('received a time!');
    // Everything needed for the slack api interaction except text:
    const channel = req.body.event.channel;
    const user = req.body.event.user;
    const teamId = req.body.team_id;
    let capturedTime;
    let capturedAmPm = '',
    checkTime,
    wordAfterTime,
    parseAmPm,
    capturedHour,
    capturedMinutes
    // find format of time input
    if (receivedText.match(hourRegex)[0] && !(receivedText.match(timeRegex))){

      //handle long string that includes a time input
      if (!receivedTextArr.includes(receivedText.match(hourRegex)[0])){
        console.log("STOPPED HOURREGEX");
        return
      }

      const getHour = receivedText.match(hourRegex)[0];
      if (getHour.includes('am') || getHour.includes('pm')){
        capturedTime = getHour.length === 4 ? [(getHour.slice(0,2).toString()),'00'] : [(getHour.slice(0,1).toString()),'00'];  
        capturedAmPm = getHour.length === 4 ? getHour.slice(2) : getHour.slice(1);
      } else if (receivedTextArr[receivedTextArr.indexOf(getHour)+1].substring(0,2)==='am' || receivedTextArr[receivedTextArr.indexOf(getHour)+1].substring(0,2)==='pm'){
        capturedAmPm = receivedTextArr[receivedTextArr.indexOf(getHour)+1].substring(0,2);
        capturedTime = [getHour, '00'];
      } else {
        return
      }
    } else if (receivedText.match(timeRegex)[0]){
       // SEPARATE HOUR AND MINUTES FOR LATER USE
      // capture the time the user sent via slack, and split it by the ':'
      capturedTime = receivedText.match(timeRegex)[0].split(':');
      // check for ap pm after capturedTime followed by a space
      checkTime = capturedTime.join(':');
      

      if (!receivedTextArr.includes(receivedText.match(timeRegex)[0])){
        console.log("STOPPED TIMEREGEX");
        return
      }
      // capture next index after captured time
      wordAfterTime = receivedTextArr[receivedTextArr.indexOf(checkTime)+1]
      if (capturedTime[1].includes('a')){
        capturedAmPm = 'am'
      } else if(capturedTime[1].includes('p')) {
        capturedAmPm = 'pm'
      } else if (!wordAfterTime || !(wordAfterTime.substring(0,2)==='pm') || wordAfterTime.substring(0,2)===('am')){
        capturedAmPm = 'am'
      }else if (wordAfterTime.substring(0,2)==='pm'){
        capturedAmPm = 'pm'
      } 
    }
    //adjust hour for 24 hour time instead of American 12
    if (capturedAmPm === 'am') {
      if ((capturedTime[1].substring(2).length === 2 && capturedTime[0] === '12') || (capturedTime[1].substring(2).length === 0 && capturedTime[0] === '12')) {
        capturedTime[0] = '24';
      }
    } else if (capturedAmPm === 'pm') {
      if (capturedTime[0] === '12') {
        capturedTime[0] = '0';
      }
    }
    //capture Hours and minutes from capturedTime array 
    capturedHour = capturedAmPm === 'am' ? parseInt(capturedTime[0], 10) : parseInt(capturedTime[0], 10) + 12;
    capturedMinutes = capturedTime[1] ? parseInt(capturedTime[1].substring(0, 2), 10) : 0;
  
    // Assign hour according to whether it is am or pm
    
    // get the current date in UTC to know the year, month and day in UTC
    const utcDate = new Date();

    // use utcDate to create a new date object with the capturedHour and capturedMinutes
    const utcProjectedTime = new Date(
      Date.UTC(
        utcDate.getUTCFullYear(),
        utcDate.getUTCMonth(),
        utcDate.getUTCDate(),
        capturedHour,
        capturedMinutes // eslint-disable-line comma-dangle
      )).getTime() / 1000;
    let token;
    const teamTokenPromise = Team.findOne({ teamId });
    teamTokenPromise.then((team) => {
      const foundTeam = team;
      token = foundTeam.accessToken;
      foundTeam.count += 1;
      foundTeam.save();

      // This promise fetches the user info (the user is the one who sent the message)
      const userInfoPromise = new Promise((resolve, reject) => {
        slack.users.info({ token, user }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      return userInfoPromise;
    }).then((info) => {
      // Slack's user info includes the tz_offest which is in unixTime
      const tzOffset = info.user.tz_offset;

      /*  We use the created utcProjectedTime - tzOffset of
          the user to display it in local time for the viewer */
      const unixDate = utcProjectedTime - tzOffset;

      let text;

      if (capturedHour > 24 || capturedMinutes > 59) {
        text = '_Incorrect Time:_\n' +
          'Hour must be less than 24 & minutes less than 60. \n' +
          `You entered ${capturedHour}:${capturedTime[1]}${capturedAmPm}`;
      } else {
        text = `The time <@${user}> mentioned translates into <!date^${unixDate}^ {time} in your time.` +
          '|Attempting to translate time but your slack version does not support it.>';
      }
      const postMessagePromise = new Promise((resolve, reject) => {
        slack.chat.postMessage({ token, channel, text }, (err, data) => {
          if (err) {
            resolve(data);
          } else {
            reject(err);
          }
        });
      });
      // Return a promise to catch any errors.
      return postMessagePromise;
    })
      .catch((err) => {
        console.error(err);
      });
  }
});

module.exports = router;
