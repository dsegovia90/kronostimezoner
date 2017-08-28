const express = require('express');

const router = express.Router();
const Team = require('../models/teams.js');

router.use((req, res, next) => {
  res.locals.title = 'Kronos Timezoner';
  res.locals.installButtonLink = process.env.INSTALL_BUTTON_LINK;
  const path = req.path;

  res.locals.slashActive = '';
  res.locals.supportActive = '';
  res.locals.privacyActive = '';

  if (path === '/') {
    res.locals.slashActive = 'is-active';
  } else if (path === '/support') {
    res.locals.supportActive = 'is-active';
  } else if (path === '/privacy') {
    res.locals.privacyActive = 'is-active';
  }

  const getCountPromise = Team.find({});
  let num = 0;

  getCountPromise.then((teams) => {
    teams.forEach((team) => {
      num += team.count;
    });
    res.locals.num = num;
    next();
  }).catch((err) => {
    console.log(err);
    res.locals.num = null;
    next();
  });
});

router.get('/', (req, res) => {
  const message = req.query.install === 'unsuccessful' ?
    'App could not be installed. Please contact support.' :
    null;
  res.render('index', { message });
});

router.get('/privacy', (req, res) => {
  res.render('privacy');
});

router.get('/support', (req, res) => {
  res.render('support');
});

router.get('/thanks', (req, res) => {
  res.render('thanks');
});

module.exports = router;
