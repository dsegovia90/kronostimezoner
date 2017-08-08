const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'Slack Timezoner', installButtonLink: process.env.INSTALL_BUTTON_LINK }) //this link is unique to each app
})

module.exports = router;