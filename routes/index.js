const express = require('express');
const router = express.Router();
const attachments = require('../lib/slack/attachments')
const cities = require('../lib/cities')

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Slack-Timezoner' });
});

router.post('/helloworld',(req, res) => {
	res.json({"text":"Hello World"})
})

router.post('/city',(req, res) => {
	console.log("OPENING PAY: " + JSON.stringify(req.body))
	res.json({
						"Content-type": "application/json",
						"response_type": 'ephemeral',
						"text": `Hi ${req.body.user_name}!`,
						"attachments": [
							{
               "text":"What city are you from:",
               "mrkdwn": true,
               "fallback": "You are unable to choose a city",
               "callback_id": "city",
               "attachment_type": "default",
               "actions":[
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
	res.json({"text":`${payload.user.name} chose *${payload.actions[0].selected_options[0].value}*`})
	res.end()
})

module.exports = router;
