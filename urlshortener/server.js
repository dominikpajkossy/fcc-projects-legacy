// REFACTOR
// Needs to check if input url is valid or not
var express = require('express');
var app = express();
var mongo = require("mongodb").MongoClient;
var responseJSON = {
  "short" : "",
  "original" : ""
}


app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


//Creates an entry in the database
app.get("/create/*", function (req, res) {
  responseJSON.original = req.params[0].toString();
  responseJSON.short = Math.floor( Math.random()*89999 + 10000 );
  
  mongo.connect("mongodb://127.0.0.1:27017/test", function(err, db){
    if ( err )
      throw err;
    
    var collection = db.collection("links");
    
    res.json(JSON.stringify( responseJSON ));
    collection.insertOne( responseJSON );
    db.close();
  });
  
});

//Redirect to other site if id matches
app.get("/:id", function (req, res) {
  
  mongo.connect("mongodb://127.0.0.1:27017/test", function(err, db){
  var collection = db.collection("links");
    
     collection.find( { short : Number(req.params.id) } ).toArray(function(err, documents) {
        if (err)
            throw err;
       
        res.redirect(documents[0].original);
    })
    db.close();
  })
})

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
