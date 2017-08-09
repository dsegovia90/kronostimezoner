const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.render('index', { title: 'Timezoner', installButtonLink: process.env.INSTALL_BUTTON_LINK }) //this link is unique to each app
})

router.get('/privacy', (req,res) => {
  res.render('privacy', {title: 'Timezoner', installButtonLink: process.env.INSTALL_BUTTON_LINK })
})

router.get('/support', (req,res) => {
  res.render('support', {title: 'Timezoner', installButtonLink: process.env.INSTALL_BUTTON_LINK })
})

module.exports = router;