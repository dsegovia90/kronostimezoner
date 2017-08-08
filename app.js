const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const index = require('./routes/index');
const slack = require('./routes/slack');
const mongoose = require('mongoose')
const routes = require('./routes/index')
require('dotenv').config()

const app = express();

mongoose.Promise = global.Promise
const databaseUri= process.env.MONGO_URI
// mongoose.connect(databaseUri, { useMongoClient: true })
mongoose.connect(databaseUri,{ useMongoClient: true }, (err, res) => {
  if(err){
    console.log('DB CONNECTION FAIL: ' + err)
  }else{
    console.log('DB CONNECTION SUCCESS: ' )
  }
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/slack', slack);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.error(err)

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
