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
var request = require("request");
var hbs = require('hbs');

//Connect to mongodb and setup Schema
mongoose.connect("mongodb://" + process.env.MONGO_USERNAME + ":" + process.env.MONGO_PASSWORD + "@" + process.env.MONGO_DATABASE,
    {useMongoClient: true}
    , function (err) {
        if (err) console.log(err);
    });
var Schema = new mongoose.Schema({
    email: String,
    name: String,
    city: String,
    description: String,
    password: String,
    trades: [],
    books: []
});
var user = mongoose.model("user", Schema);

//Set port to env port or 5000
app.set('port', (process.env.PORT || 5000));

//Set viewing engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

//Set middleware
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(session({
    secret: 'q35grtg345er',
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
            if (err) console.log(err);

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

function getAllBooks(callback) {
    user.find({}, "books", function (err, data) {
        var bookArray = [];
        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].books.length; j++) {
                bookArray = bookArray.concat(data[i].books[j]);
            }
        }
        callback(bookArray);
    })
}

//Route handling
app.get('/', function (req, res) {

    if (req.isAuthenticated()) {
        getAllBooks(function (data) {
            for ( var i = 0; i < data.length; i++){
                data[i].currentUser = req.user.email;
            }
            res.render("index", {allBooks: data, currentUser : req.user.email});
        })
    } else {
        getAllBooks(function (data) {
            res.render("index", {allBooks: data});
        })
    }
});

app.get('/register', function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    req.checkBody('inputEmail', 'The email you entered is invalid.').isEmail();
    req.checkBody('inputEmail', 'Email address must be between 4-100 characters long.').len(4, 100);
    req.checkBody('inputPassword', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody("inputPassword", "Password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");
    req.checkBody("inputPasswordMatch", "Passwords don't match.").equals(req.body.inputPassword);
    var errors = req.validationErrors();

    if (errors) {
        res.render("register", {
            title: "Registration failed",
            error: errors
        });
    } else {
        new user({
            email: req.body.inputEmail,
            password: req.body.inputPassword
        }).save(function (err) {
            if (err) console.log(err);
            res.redirect("/");
        })
    }
});

app.get('/login', function (req, res) {
    res.render("login");
});

app.post('/login',
    passport.authenticate('local', {failureRedirect: '/register', successRedirect: "/"}),
    function (req, res) {
        res.redirect('/');
    }
);

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.get("/profile", function (req, res) {
    if (req.isAuthenticated) {
        user.findOne({email: req.user.email}, function (err, data) {
            if (err) console.log(err);

            res.render("profile", {
                currentUser: req.user.email,
                userBooks: data.books,
                userName: req.user.name,
                userCity: req.user.city,
                userDescription: req.user.description,
                trades: data.trades
            });
        })
    } else {
        res.redirect("/");
    }
});

app.post("/profile", function (req, res) {

    //Make a request for google books API
    request.get("https://www.googleapis.com/books/v1/volumes?q=" + req.body.inputBook, function (err, data) {
        var books = JSON.parse(data.body);

        user.findOne({"email": req.user.email}, function (err, user) {
            if (err) console.log(err);

            user.books = user.books.concat(
                {
                    title: books.items[0].volumeInfo.title,
                    thumbnail: books.items[0].volumeInfo.imageLinks.smallThumbnail,
                    selflink: books.items[0].selfLink,
                    id: books.items[0].id,
                    authors : books.items[0].volumeInfo.authors,
                    webreader : books.items[0].accessInfo.webReaderLink,
                    owner: req.user.email
                }
            );
            user.save(function (err) {
                if (err) console.log(err);

                res.redirect("/profile");
            })
        })
    });
});

app.post("/profileupdate", function (req, res) {

    if (req.isAuthenticated) {
        user.findOne({email: req.user.email}, function (err, data) {
            if (err) console.log(err);

            if (req.body.profileName) {
                data.name = req.body.profileName;
            }
            if (req.body.profileCity) {
                data.city = req.body.profileCity;
            }
            if (req.body.profileDescription) {
                data.description = req.body.profileDescription;
            }

            data.save(function (err) {
                if (err) console.log(err);
                res.redirect("/profile");
            })
        })
    } else {
        res.redirect("/");
    }
});

app.post("/tradesubmit", function (req, res) {

    //Create id for transaction
    var commonId = req.body.tradeSubmitId + req.user.books[0].id + (Math.round((Math.random() * 100) + 10)).toString();

    user.findOne({"email": req.body.tradeSubmitOwner}, function (err, data) {
        data.trades = data.trades.concat({
            yourEmail: req.body.tradeSubmitOwner,
            iWantThisBook: req.body.tradeSubmitId,
            myEmail: req.user.email,
            iGiveYouThisBook: req.user.books[0].id,
            incoming: false,
            id: commonId
        });
        data.save(function (err) {
            if (err) console.log(err);
        })
    });

    user.findOne({"email": req.user.email}, function (err, data) {
        data.trades = data.trades.concat({
            yourEmail: req.body.tradeSubmitOwner,
            iWantThisBook: req.body.tradeSubmitId,
            myEmail: req.user.email,
            iGiveYouThisBook: req.user.books[0].id,
            incoming: true,
            id: commonId
        });
        data.save(function (err) {
            if (err) console.log(err);
        })
    });

    res.redirect("/");
});

app.post("/tradedelete", function (req, res) {
    user.find({"trades.id": req.body.tradeId}, function (err, data) {

        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].trades.length; j++) {
                if (data[i].trades[j].id === req.body.tradeId) {
                    data[i].trades.splice(j, 1);
                    data[i].save(function (err) {
                        if (err) console.log(err);
                    })
                }
            }
        }

        res.redirect("/profile");
    })
});

app.post("/tradeconfirm", function (req, res) {
    user.find({"trades.id": req.body.tradeId}, function (err, data) {

        //Check for errors
        if( data.length !== 2 ){
            console.log("Error: Id mismatch found!");
            res.redirect("/profile");
        }

        //Get the details of the current trade
        var currentTrade;
        for ( var i = 0; i < data[0].trades.length; i++){
            if ( data[0].trades[i].id == req.body.tradeId ){
                currentTrade = data[0].trades[i];
                break;
            }
        }
        var tmp;
        for ( var i = 0; i < data[0].books.length; i++){
            if( data[0].books[i].id == currentTrade.iWantThisBook ){
                tmp = data[0].books[i];
                data[0].books.splice(i,1);
                break;
            }
        }

        for ( var i = 0; i < data[1].books.length; i++){
            if( data[1].books[i].id == currentTrade.iGiveYouThisBook ){
                data[0].books = data[0].books.concat(data[1].books[i]);
                data[1].books.splice(i,1);
                data[1].books = data[1].books.concat(tmp);
                break;
            }
        }

        data[0].save(function(err){
            if (err) console.log(err);
            data[1].save(function(err){
                if (err) console.log(err);
                res.redirect("/profile");
            })
        });
    });
});

//Listen to port
app.listen(app.get('port'), function () {
    console.log("Node app is running at localhost:" + app.get('port'))
});
