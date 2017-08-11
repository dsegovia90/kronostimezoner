const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  let message = req.query.install === 'unsuccessful' ? 
    'App could not be installed. Please contact support.' : 
    null
  res.render('index', { title: 'Timezoner', installButtonLink: process.env.INSTALL_BUTTON_LINK, message: message}) //this link is unique to each app
})

router.get('/privacy', (req,res) => {
  res.render('privacy', {title: 'Timezoner', installButtonLink: process.env.INSTALL_BUTTON_LINK })
})

router.get('/support', (req,res) => {
  res.render('support', {title: 'Timezoner', installButtonLink: process.env.INSTALL_BUTTON_LINK })
})

router.get('/thanks', (req,res) => {
  res.render('thanks', {title: 'Timezoner', installButtonLink: process.env.INSTALL_BUTTON_LINK })
})

module.exports = router;