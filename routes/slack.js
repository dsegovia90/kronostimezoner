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
  slackResponse.response_type = 'in_channel';
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
    slackResponse.text = `An error has been made`;
  }
  res.type('application/json').json(slackResponse).end();
});

router.post('/catchmessages', (req, res) => {
  res.send(req.body.challenge);
  const receivedText = req.body.event.text;
  // split receivedText so that you can find the am pm after the space as an index
  const receivedTextArr = receivedText.toLowerCase().split(' ');
  const timeRegex = /\d{1,2}:\d{2}(pm|am)?/i;

  if (timeRegex.test(receivedText) && !req.body.event.subtype) {
    console.log('received a time!');
    // Everything needed for the slack api interaction except text:
    const channel = req.body.event.channel;
    const user = req.body.event.user;
    const teamId = req.body.team_id;
    // Capture the time the user sent via slack, and split it by the ':'
    const capturedTime = receivedText.match(timeRegex)[0].split(':');
    // SEPARATE HOUR AND MINUTES FOR LATER USE
    // check for ap pm after capturedTime followed by a space
    const checkTime = capturedTime.join(':');
    // capture next index after time
    const wordAfterTime = receivedTextArr[receivedTextArr.indexOf(checkTime) + 1];
    // capture first two indexes of wordAfterTime
    const parseAmPm = wordAfterTime ? wordAfterTime.substring(0, 2) : '';
    // conditionally set variable to am or pm
    let capturedAmPm = '';
    if (parseAmPm === 'pm') {
      capturedAmPm = 'pm';
    } else if (capturedTime[1].substring(2).length === 0) {
      capturedAmPm = 'am';
    } else {
      capturedAmPm = capturedTime[1].substring(2);
    }
    // handle 12:00/12:00am/12:00pm user input
    if (capturedAmPm === 'am') {
      if ((capturedTime[1].substring(2).length === 2 && capturedTime[0] === '12') || (capturedTime[1].substring(2).length === 0 && capturedTime[0] === '12')) {
        capturedTime[0] = '24';
      }
    } else if (capturedAmPm === 'pm') {
      if (capturedTime[0] === '12') {
        capturedTime[0] = '0';
      }
    }
    // Assign hour according to whether it is am or pm
    const capturedHour = capturedAmPm === 'am' ? parseInt(capturedTime[0], 10) : parseInt(capturedTime[0], 10) + 12;
    // let capturedHour = parseInt(capturedTime[0]) //this only outputs am time
    const capturedMinutes = capturedTime[1] ? parseInt(capturedTime[1].substring(0, 2), 10) : 0;

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
          resolve(data);
          reject(err);
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
          resolve(data);
          reject(err);
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
