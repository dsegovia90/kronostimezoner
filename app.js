const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const index = require('./routes/index');
const slack = require('./routes/slack');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

app.set('socket', io); // <-- bind socket to app

mongoose.Promise = global.Promise;
const databaseUri = process.env.MONGO_URI;
// mongoose.connect(databaseUri, { useMongoClient: true })
mongoose.connect(
  databaseUri,
  { useMongoClient: true },
  (err, res) => { // eslint-disable-line no-unused-vars
    if (err) {
      console.log(err);
    } else {
      console.log('Database Connection Successfull.');
    }
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/slack', slack);
app.use('/', index); // Keep this last to catch all undefined routes


// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.error(err);

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

exports.server = server;
exports.app = app;
