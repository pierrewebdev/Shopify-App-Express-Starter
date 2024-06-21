const express = require('express')
const moment = require('moment');
const cookieParser = require("cookie-parser");
const app = express()
var cors = require('cors');
const port = 80;
const bodyParser = require('body-parser'); // middleware

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//var passport = require('passport');
var session = require('express-session');
var env = require('dotenv').config(); 
env = env.parsed;

app.use( express.urlencoded({ extended: true }) );
app.use(express.json());
// For Passport 
app.use(session({
  secret: 'someverylargestringthatwecannotsimplyguess'
})); 

// session secret 
// app.use(passport.initialize());
// app.use(passport.session()); 

//Models 
var models = require("./models");
const { Sequelize, Model, DataTypes, DATE } = require('sequelize');
//Sync Database 
models.sequelize.sync().then(function() {
  console.log('Nice! All is looking good');
}).catch(function(err) {
  console.log(err, "Something went wrong with the Database Update!");
});

//Load mysql -- Want to write my own version of this
//const mysqlAPI = require('./src/mysql-api')(Sequelize, DataTypes, env);

//Load Traits 
const FunctionTrait = require('./traits/functions');
const RequestTrait = require('./traits/requests');
const traits = {FunctionTrait, RequestTrait}

// set ejs view cache
app.set('view cache', true);
app.set('views', `${__dirname}/pages/views`);
app.set('view engine', 'ejs');
app.set('etag', false);

//load passport strategies 
//require('./passport/passport.js')(passport, models.user);
require('./auth.js')(app, /*passport,*/ mysqlAPI, traits, env);

app.get('/', (req, res) => {
  // res.json({
  //   "status": true,
  //   "message": "Hello World" 
  // }).status(200);

  res.render("index")
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})