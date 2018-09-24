'use strict';

//Importing modules
var express = require('express');
var routes = require('./app/routes/index.js');
var passport = require('passport');
var session = require('express-session');
var hbs = require("express-handlebars");
var path = require("path");
var mongoose = require("mongoose");
var bodyParser = require('body-parser');

//Setting up express
var app = express();
require('dotenv').load();
require('./app/config/passport')(passport);

//Setting up viewing engine
app.engine("hbs", hbs({ extname: "hbs", defaultLayout: __dirname + "/app/views/layouts/layout.hbs" }))
app.set("views", path.join(__dirname, "/app/views"));
app.set('view engine', 'hbs');

//Connect to database
mongoose.connect(process.env.MONGO_URI);
mongoose.Promise = global.Promise;

//Setting up middleware
app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/common', express.static(process.cwd() + '/app/common'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
	secret: 'secretClementine',
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

//Passing control to index.js to handle routing events
routes(app, passport);

//If system has given a port listen to that, else listen to 8080
var port = process.env.PORT || 8080;
app.listen(port, function() {
	console.log('Node.js listening on port ' + port + '...');
});
