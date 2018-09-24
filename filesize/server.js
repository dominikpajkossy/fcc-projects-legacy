// init project
var express = require('express');
var app = express();
// file handling
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

app.use(express.static('public'));

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.post("/fileupload", upload.single('filetoupload'),  function (req, res) {
    res.json(JSON.stringify({"size": req.file.size}));
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
