// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var parser = require("user-agent-parser");
var fs = require("fs");

 function getClientAddress (req) {
        return (req.headers['x-forwarded-for'] || '').split(',')[0] 
               || req.connection.remoteAddress;
};

app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/whoami", function (req, res) {
  
    var whoami = {};
  
  whoami.ip = getClientAddress(req);
  whoami.language = req.headers['accept-language'].toString().split(',')[0];
  var useragent = parser( req.headers['user-agent'] )
  whoami.browser = useragent.browser.name + " " + useragent.browser.version;
  whoami.os = useragent.os.name + " " + useragent.os.version;
  
  var date = new Date();
  
    fs.appendFile(__dirname + "/test.txt","\n\n" + date + "\n" + JSON.stringify(whoami) , function(err) {
    if(err) 
        throw err;

    console.log("The file was saved!");
}); 
  
   //whoami = req.headers;
  res.json( JSON.stringify( whoami ) );
  
});


var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
