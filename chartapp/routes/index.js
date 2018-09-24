var express = require('express');
var router = express.Router();
var app = require("../app.js");

//

//
var stocks = [];

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', stock : stocks });
});


module.exports = router;
