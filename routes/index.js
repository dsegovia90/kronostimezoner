const express = require('express');
const request = require('request')
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Slack-Timezoner' });
});

router.post('/helloworld',(req, res, next) => {
	res.json({"text":"Hello World"})
	res.end()
})

module.exports = router;
