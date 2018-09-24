'use strict';

var express = require('express');
var app = express();
var dotenv = require("dotenv/config");
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require("mongoose");
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var expressValidator = require("express-validator");
var session = require("express-session");

//Connect to mongodb and setup Schema
mongoose.connect("mongodb://" + process.env.MONGO_USERNAME + ":" + process.env.MONGO_PASSWORD + "@" + process.env.MONGO_DATABASE,
    {useMongoClient: true}
    , function (err) {
        if (err) console.log(err);
    });
var Schema = new mongoose.Schema({
    email: String,
    password: String,
    urls: []
});
var user = mongoose.model("user", Schema);

//Set port and viewing engine
app.set('port', (process.env.PORT || 5000));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//Set middleware
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(session({
    secret: 's436h4s6',
    resave: false,
    saveUninitialized: false
}));

//Passport initialization
app.use(passport.initialize());
app.use(passport.session());

//Serialize and deserialize functions
passport.serializeUser(function (user, done) {
    return done(null, user._id);
});
passport.deserializeUser(function (id, done) {
    user.findById(id, function (err, user) {
        done(err, user);
    })
});

//Passport strategy to log in the user
passport.use(new LocalStrategy({
        usernameField: 'inputUser',
        passwordField: 'inputPassword',
        passReqToCallback: true,
        session: false
    },
    function (req, username, password, done) {
        user.findOne({email: req.body.inputUser}, function (err, user) {
            if (err)
                console.log(err);

            if (user) {
                if (user.password == req.body.inputPassword) {
                    console.log("Login Success!");
                    done(null, user);
                } else {
                    console.log("Login Failure!");
                    done(null, false);
                }
            } else {
                done(null, false);
            }
        });
    }
));

//Route handling
app.get("/", function (req, res) {
    user.find({}, 'urls -_id', function (err, data) {
        var urlArray = [];
        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].urls.length; j++) {

                urlArray = urlArray.concat(data[i].urls[j]);
            }
        }
        res.render("index", {user: req.user, images: urlArray});
    })
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    req.checkBody('inputEmail', 'The email you entered is invalid.').isEmail();
    req.checkBody('inputEmail', 'Email address must be between 4-100 characters long, please try again.').len(4, 100);
    req.checkBody('inputPassword', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody("inputPassword", "Password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");
    req.checkBody("inputPasswordMatch", "Passwords does not match.").equals(req.body.inputPassword);
    var errors = req.validationErrors();
    if (errors) {
        res.render("register", {
            title: "Registration failed",
            error: errors
        });
    } else {
        new user({
            email: req.body.inputEmail,
            password: req.body.inputPassword,
            urls: []
        }).save(function (err, doc) {
            console.log(doc);
            res.redirect("/");
        })
    }
});

app.post('/login',
    passport.authenticate('local', {failureRedirect: '/register', successRedirect: "/"}),
    function (req, res) {
        res.redirect('/');
    });

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.get("/profile", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("profile", {user: req.user});
    } else {
        res.redirect("/");
    }
})

//Handle delete request via query on profile page
app.post("/profile", function (req, res) {
    if (req.isAuthenticated()) {
        var inputUrl = req.query.url;
        var userEmail = req.user.email;
        var indexToDelete;

        user.findOne({email: userEmail}, function (err, user) {
            if (err)
                console.log(err);

            for (var i = 0; i < user.urls.length; i++) {
                if ( user.urls[i].url == inputUrl ) {
                    indexToDelete = i;
                    break;
                }
            }

            //Remove url and text object
            user.urls.splice(indexToDelete, 1);

            res.status("200");
            res.end();
            user.save();
        });
    } else {
        //Unauthorized acces
        res.status(401);
    }

});

app.post("/submiturl", function (req, res) {
    if (req.isAuthenticated()) {
        //Check for url correction
        //needs to be added.
        user.findOne({email: req.user.email}, function (err, data) {
            data.urls = data.urls.concat({url: req.body.inputUrl, urlText: req.body.inputText});
            data.save();
            res.status(200);
            res.redirect("/profile");
            res.end();
        })
    }
})

//Listen to port
app.listen(app.get('port'), function () {
    console.log("Node app is running at localhost:" + app.get('port'))
});