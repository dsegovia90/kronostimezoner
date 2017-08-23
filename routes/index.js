const express = require('express');
const router = express.Router();
const Team = require('../models/teams.js');
// const installButtonLink = process.env.INSTALL_BUTTON_LINK

let getCountPromise = new Promise((resolve, reject) => {
  Team.find({}, (err, data) => {
    let num = 0
    data.map((item) => {
      num += item.count
    })
    resolve(num)
    reject(null)
  })
})

router.use((req, res, next) => {
  res.locals.title = 'Kronos Timezoner'
  res.locals.installButtonLink = process.env.INSTALL_BUTTON_LINK

  getCountPromise.then((num) => {
    res.locals.num = num
    next()
  }).catch((err) => {
    res.locals.num = null
    next()
  })
})

router.get('/', (req, res) => {
  let message = req.query.install === 'unsuccessful' ?
    'App could not be installed. Please contact support.' :
    null
  res.render('index', { message }) //this link is unique to each app
})

router.get('/privacy', (req, res) => {
  res.render('privacy')
})

router.get('/support', (req, res) => {
  res.render('support')
})

router.get('/thanks', (req, res) => {
  res.render('thanks')
})

module.exports = router;