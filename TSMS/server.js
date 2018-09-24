// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var jade = require("jade");

function getMonthString(month){
  switch (month){
    case 0 : 
      return "January";
      break;
    case 1 : 
      return "February";
      break;
    case 2 : 
      return "March";
      break;
    case 3 : 
      return "April";
      break;
    case 4 : 
      return "May";
      break;
    case 5 : 
      return "June";
      break;
    case 6 : 
      return "July";
      break;
    case 7 : 
      return "August";
      break;
    case 8 : 
      return "September";
      break;
    case 9 : 
      return "October";
      break;
    case 10 : 
      return "November";
      break;
    case 11 : 
      return "December";
      break;
  }
}

app.use(express.static('public'));

app.get("/:id", function (request, response) {
  
  var resFile = {
    "unix" : 0,
    "natural" : ""
  }
  
  if ( !isNaN(request.params.id) ){
    var date = new Date( Number(request.params.id)*1000 );
  }else{
    var date = new Date( request.params.id );
  }
  
  var month = getMonthString(date.getMonth());
  
  resFile.unix = Number( date.getTime()/1000 );
  resFile.natural = month + " " + date.getDate() + "," + date.getFullYear();
  
  response.json( JSON.stringify(resFile) )
});

app.get("/", function (request, response) {
  response.sendFile( __dirname + "/views/index.html" )
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
