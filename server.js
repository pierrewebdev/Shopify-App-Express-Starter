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
const MySQLStore = require('express-mysql-session')(session);
var env = require('dotenv').config(); 
env = env.parsed;

var dbEnv = env.NODE_ENV || "development";
const dbConfig = require('./config.json')[dbEnv];

const sessionOptions = {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database
};
const sessionStore = new MySQLStore(sessionOptions);

app.use( express.urlencoded({ extended: true }) );
app.use(express.json());
// For Passport 
app.use(session({
  secret: 'someverylargestringthatwecannotsimplyguess',
  store: sessionStore
})); 

// session secret 
// app.use(passport.initialize());
// app.use(passport.session()); 

//Set up Models
const setupModels = require("./models/set-up")
setupModels()

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
//require('./auth.js')(app, /*passport,*/ mysqlAPI, traits, env);

require('./auth.js')(app)

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