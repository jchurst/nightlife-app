const express = require('express');
const bodyParser = require('body-parser');
const handlebars = require('express-handlebars');
const passport = require('passport');
const session = require('express-session');


// Config app dependencies
require('./config/db');
require('./config/passport');


// Config app
var app = express();
app.use('/', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.engine('html', handlebars({
  extname: 'html',
  defaultLayout: 'default',
  layoutsDir: app.get('views') + '/layouts',
  partialsDir: app.get('views') + '/partials'
}));
app.set('view engine', 'html');


// Init passport and an active session, if there is one
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('./util').attachUser);


// Config routes
app.use(require('./routes/app.js'));
app.use(require('./routes/auth.js'));
app.use(require('./routes/errors.js'));


// Start server
app.listen(app.get('port'));