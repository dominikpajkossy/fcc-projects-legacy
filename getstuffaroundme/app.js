var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var session = require('express-session');
var request = require('request');
var storedIds = [];
var dotenv = require("dotenv/config");

app.set('port', (process.env.PORT || 5000));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({secret: 'whatever', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

//passport authentication
passport.use(new Strategy({
    consumerKey: process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
    callbackURL: process.env.CALLBACKURL
}, function (token, tokenSecret, profile, callback) {
    return callback(null, profile);
}));

passport.serializeUser(function (user, callback) {
    callback(null, user);
});

passport.deserializeUser(function (obj, callback) {
    callback(null, obj);
});

function getGoogleData(placeType, inputField, callback){
    var options = {
        url: "https://maps.googleapis.com/maps/api/place/textsearch/json?query=" + placeType + "+in+" + inputField + "&key=AIzaSyBEFfEFCJQQjASIIWquBI7s3eDfkxkqCZU"
    };
    request(options, function (err, status, body) {
        var retArr = [];

        for (var i = 0; i < JSON.parse(body).results.length; i++) {
            var tmpObj = {};

            tmpObj.name = JSON.parse(body).results[i].name;
            tmpObj.formatted_address = JSON.parse(body).results[i].formatted_address;
            tmpObj.geometry = JSON.parse(body).results[i].geometry;
            tmpObj.icon = JSON.parse(body).results[i].icon;
            tmpObj.rating = JSON.parse(body).results[i].rating;
            tmpObj.id = JSON.parse(body).results[i].id;
            tmpObj.goingCount = 0;

            //Iterate through the elements to see if there is a match with the ids
            //When a match is found update the objects goingCount to the value stored
            for (var j = 0; j < storedIds.length; j++){
                if ( tmpObj.id == storedIds[j].id ){
                    tmpObj.goingCount = storedIds[j].goingCount;
                    break;
                }
            }
            retArr = retArr.concat(tmpObj);
        }
        callback(retArr);
    })
}

//Index
app.get("/", function (req, res) {
    res.render("index", {user: req.user});
});

//Gets the id of the clicked button
app.get("/postgoing/:id", function (req, res) {
    //Check to see if the user is logged in
    if ( req.isAuthenticated() ){
        //Loop through the stored ids
        for (var i = 0; i < storedIds.length; i++){
            var foundId = false;
            //Check if there is a stored id which has been voted on
            if ( req.params.id == storedIds[i].id ){
                //Check if there is a userName property of the current stored id
                if ( storedIds[i].userName ){
                    //Loop through the stored userNames and set nameFlag to false if there is a match
                    var hasStoredId = false;
                    for ( var j = 0; j < storedIds[i].userName.length; j++){
                        if ( storedIds[i].userName[j] == req.user.id ){
                            hasStoredId = true;
                            break;
                        }
                    }
                    //If nameFlag is true let the user vote
                    if ( !hasStoredId ){
                        storedIds[i].goingCount += 1;
                        storedIds[i].userName = storedIds[i].userName.concat(req.user.id);
                        res.json( storedIds[i].goingCount );
                        res.end();
                        foundId = true;
                        break;
                    }
                }
            }
        }
        //If there is no entry for that ID, create new entry
        if (!foundId){
            storedIds = storedIds.concat(
                {
                    id : req.params.id,
                    goingCount : 1,
                    userName : []
                }
            );
            storedIds[storedIds.length-1].userName = storedIds[storedIds.length-1].userName.concat(req.user.id);
            res.json( storedIds[storedIds.length-1].goingCount );
            res.status(200);
            res.end();
        }
    }else{
        console.log("You are not authenticated");
    }
});

//Login handler
app.get("/twitter/login", passport.authenticate("twitter"));

//Logout handler
app.get('/twitter/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

//Twitter callback URL handler redirects to /
app.get("/twitter/return", passport.authenticate("twitter", {failureRedirect: "/"}), function (req, res) {
    res.redirect("/");
});

//Post requests handler
app.post("/", function (req, res) {
    if ( req.body.placeType && req.body.inputField ){
        getGoogleData(req.body.placeType, req.body.inputField, function(data){
            res.render("index", {user: req.user, result: data});
        });
    }
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
});
