'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');
var Polls = require("../models/polls");
var pollsInMemory = [];
var currentPollIndex;

module.exports = function(app, passport) {

	function isLoggedIn(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}
		else {
			res.redirect('/');
		}
	}
	//Main
	app.route('/')
		.get(function(req, res) {
			Polls.find().lean().exec(function(err, docs) {
				if (err)
					throw err;
				res.render("index", { "polls": docs });
			});

		});
	//Login
	app.route('/login')
		.get(function(req, res) {
			res.sendFile(path + '/public/login.html');
		});
	//Logout
	app.route('/logout')
		.get(function(req, res) {
			req.logout();
			res.redirect('/');
		});
	//Create poll page
	app.route('/createpoll')
		.get(isLoggedIn, function(req, res) {
			res.render("createpoll");
		});
	//Create poll page post handler
	app.route("/createpoll")
		.post(isLoggedIn, function(req, res) {

			var newObject = {};
			newObject.pollname = req.body.poll;
			newObject.voteoptionnames = [];

			new Polls(newObject).save(function(err, doc) {
				if (err)
					throw err;
			})

			res.redirect("/");
		})

	//Currentpoll
	app.route('/:id')
		.get(isLoggedIn, function(req, res) {

			Polls.find().lean().exec(function(err, docs) {
				if (err)
					throw err;
				for (var i = 0; i < docs.length; i++) {
					if (req.params.id == docs[i].pollname) {
						currentPollIndex = i;
						res.render("currentpoll", { "poll": docs[i] });
						break;
					}
				}
			});
		});
	//Chart gets vote polls
	app.route('/:id/getinfo')
		.get(isLoggedIn, function(req, res) {

			Polls.find().lean().exec(function(err, docs) {
				if (err)
					throw err;

				for (var i = 0; i < docs.length; i++) {
					if (docs[i].pollname == req.params.id) {
						res.json(JSON.stringify(docs[i].voteoptionnames));
					}
				}

			});
		});
	//Create new poll and vote
	app.route('/:id')
		.post(isLoggedIn, function(req, res) {

			if (req.body.votename) {
				Polls.findOne({ "pollname": req.params.id }, function(err, foundObject) {
					if (err)
						throw err;
					foundObject.voteoptionnames = foundObject.voteoptionnames.concat({ name: req.body.votename, votes: 1 });
					foundObject.save();
				})
			}
			if (req.body.voteoptions) {
				Polls.findOne({ "pollname": req.params.id }, function(err, foundObject) {
					if (err)
						throw err;
					for (var i = 0; i < foundObject.voteoptionnames.length; i++) {
						if (foundObject.voteoptionnames[i].name == req.body.voteoptions) {
							foundObject.voteoptionnames[i].votes++;
							foundObject.save();
							break;
						}
					}


				})
			}
			res.redirect("/" + req.params.id);
			
		});

	//Login
	app.route('/api/:id')
		.get(isLoggedIn, function(req, res) {
			res.json(req.user.github);
		});
	app.route('/auth/github')
		.get(passport.authenticate('github'));

	app.route('/auth/github/callback')
		.get(passport.authenticate('github', {
			successRedirect: '/',
			failureRedirect: '/'
		}));

};
