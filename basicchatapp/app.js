var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

var socket = require("socket.io");
var server = app.listen(process.env.PORT);
var io = socket(server);

io.on("connection", function(socket){
    console.log("New connection: " + socket.id);

    socket.on("clientmessage", function(data){
        console.log(data);
        io.emit("servermessage", {senderId : socket.id, message : data.message});
    })
})

module.exports = app;
