const express = require('express');
const router = express.Router();
const Team = require('../models/teams.js');
const title = 'Kronos Timezoner'
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
  res.render('index', { title, installButtonLink: process.env.INSTALL_BUTTON_LINK, message }) //this link is unique to each app
})

router.get('/privacy', (req, res) => {
  res.render('privacy', { title, installButtonLink: process.env.INSTALL_BUTTON_LINK })
})

router.get('/support', (req, res) => {
  res.render('support', { title, installButtonLink: process.env.INSTALL_BUTTON_LINK })
})

router.get('/thanks', (req, res) => {
  res.render('thanks', { title, installButtonLink: process.env.INSTALL_BUTTON_LINK })
})

module.exports = router;