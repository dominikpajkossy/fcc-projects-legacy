// Init project
var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require("body-parser");
var fs = require("fs");

// Variables
var searchQuery = "";
var offset = 0;
var resArr = [];
var lastSearches = [];

//Middlewares
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function(req, res, next){
  
    
      res.sendfile(__dirname + '/views/index.html');
  
});

//For smaller applications it is ok to use this method,
//But if the file gets bigger, use a database instead
app.get("/history", function(req, res, next){
  fs.readFile(__dirname + "/data/history.json", "utf8", function(err, data){
      res.json( JSON.stringify(data) );
  })
});

app.get("/:id", function (req, res) {
  
  //Create log from searches
  var tmpObj = {};
  tmpObj.term = req.params.id;
  tmpObj.date = new Date();
  
  //Read json from file, parse it into an object, concat the current to object then save it back to the file
  fs.readFile(__dirname + "/data/history.json", "utf8", function(err, data){
      lastSearches = JSON.parse(data);
  })
  lastSearches = lastSearches.concat(tmpObj);
  fs.writeFile(__dirname + "/data/history.json", JSON.stringify(lastSearches) , function(err) {
      if(err) {
          return console.log(err);
      }

    console.log("The file was saved!");
  }); 
  //
  
  //Check for query named offset, if null set offset to 0
  if ( req.query.offset && req.query.offset <= 20){
      offset = Number(req.query.offset)
  }else{
      offset = 0;
  }
  
  //Init search query
  resArr = [];
  searchQuery = req.params.id;
  var options = {
  url: "https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=" + searchQuery + "&mkt=en-us",
    headers:{
    'Ocp-Apim-Subscription-Key': "aa0775b80b3e463395d2e62c537de3c1"
    }
  };
  
  //Make request from API server
  request(options, function (error, response, body) {
  
    //If no errors proceed
    if (!error && response.statusCode == 200) {
      for ( var i = offset; i < offset+10; i++){
        var tmpObject = {};
        tmpObject.name = JSON.parse(body).value[i].name;
        tmpObject.hostPageDisplayUrl = JSON.parse(body).value[i].hostPageDisplayUrl;
        tmpObject.thumbnailUrl = JSON.parse(body).value[i].thumbnailUrl;
        
        resArr = resArr.concat(tmpObject);
      }
      res.json(JSON.stringify(resArr));
    }
  })
});

//Create server
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
