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
  let message;
  if (req.query.install) {
    message = 'App could not be installed. Please contact support.';
  } else if (req.query.error) {
    message = 'Unexpected error, please try again.';
  }
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

router.use('/', (req, res) => {
  let path = req.path;
  path = path.substring(1);
  console.log(path);
  if (path.indexOf('/') >= 0) {
    path = path.substring(path.indexOf('/'));
  }
  res.redirect(path);
});

module.exports = router;
