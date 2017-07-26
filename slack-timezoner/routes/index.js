const express = require('express');
const request = require('request')
const router = express.Router();

let sendMessageToSlackResponseURL = (responseURL, JSONmessage)=>{
	let postOptions = {
			uri: responseURL,
			method: 'POST',
			headers: {
					'Content-type': 'application/json'
			},
			json: JSONmessage
	}
	request(postOptions, (error, response, body) => {
			if (error){
					console.log(error)
			}
	})
}

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Slack-Timezoner' });
});

router.post('/helloworld',(req, res, next) => {
	let responseURL = req.body.response_url
	let botPayload = {
		text : 'Hello World'
	}
	sendMessageToSlackResponseURL(responseURL,botPayload)
})

module.exports = router;
