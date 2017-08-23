const express = require('express');
const router = express.Router();
const Team = require('../models/teams.js');
const title = 'Kronos Timezoner'
const installButtonLink = process.env.INSTALL_BUTTON_LINK



router.get('/', (req, res) => {
  let message = req.query.install === 'unsuccessful' ? 
    'App could not be installed. Please contact support.' : 
    null
  
  let getCountPromise = new Promise((resolve, reject) =>{
    Team.find({}, (err, data) => {
      console.log("TEAMS: " + JSON.stringify(data))
      let num = 0
       data.map((item) => {
        num+= item.count 
      })
      console.log("COUNT: " + num )
      resolve(num)
    })
  })
  
  getCountPromise.then(num => {
    res.render('index', {title, num, installButtonLink, message}) //this link is unique to each app
  })
  .catch((err) => {
    console.error(err)
  })
})

router.get('/privacy', (req,res) => {
  res.render('privacy', {title, num, installButtonLink, message})
})

router.get('/support', (req,res) => {
  res.render('support', {title, num, installButtonLink, message})
})

router.get('/thanks', (req,res) => {
  res.render('thanks', {title, num, installButtonLink, message})
})

module.exports = router;