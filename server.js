const path = require('path')

const express = require('express')
const app = express()
var cors = require('cors');
const port = 8080;
const bodyParser = require('body-parser'); // middleware

// set ejs view cache
app.set('view cache', false);
app.set('views', `${__dirname}/pages/views`);
app.set('view engine', 'ejs');
app.set('etag', false);

//set up ejs layout file
const expressLayouts = require('express-ejs-layouts')
app.use(expressLayouts)

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
    database: dbConfig.database,
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 mins
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

const sessionStore = new MySQLStore(sessionOptions);

// Handle session store errors
sessionStore.on('error', (error) => {
    console.error('Session store error:', error);
});

app.use( express.urlencoded({ extended: true }) );
app.use(express.json({
  limit: '10mb',
	verify: (req, _res, buf) => {
	  req.rawBody = buf; //rawBody is needed for getting the "raw" requests that we receive. This is used for validating Shopify webhooks. Check webhooksController.js
	},
}));

// Sets up a persistent session for user in Sessions DB Table 
app.use(session({
  secret: 'someverylargestringthatwecannotsimplyguess',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    maxAge: 86400000 // 24 hours
  }
}));

//Middleware that allows me to serve my compiled react app
app.use(express.static(path.join(__dirname, 'public')));


//Set up Models
const setupModels = require("./models/set-up")
setupModels()

//Load Traits 
const helpers = require('./helpers/functions');

require('./auth.js')(app)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
