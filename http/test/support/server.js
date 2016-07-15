var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var globalSandbox = require('./global');

var app = express();

app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store');
  next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/hello', function(req, res){
  setTimeout(function () {
    res.send('Hello World');
  }, 150);
});

app.post('/pet', function(req, res){
  setTimeout(function () {
    var result = 'added ' + req.body.name + ' the ' + req.body.species;
    globalSandbox.petPOSTResponse = result;
    res.send(result);
  }, 150);
});

app.get('/json', function(req, res){
  setTimeout(function () {
    res.status(200).json({ name: 'manny' });
  }, 150);
});

app.get('/querystring', function(req, res){
  setTimeout(function () {
    res.send(req.query);
  }, 150);
});

app.get('/error', function(req, res){
  setTimeout(function () {
    res.status(500).send('boom');
  }, 150);
});

app.delete('/delete', function(req, res){
  setTimeout(function () {
    res.status(200).json({deleted: true})
  }, 150);
})

app.listen(process.env.PORT);
