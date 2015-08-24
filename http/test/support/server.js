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
  res.send('Hello World');
});

app.post('/pet', function(req, res){
  var result = 'added ' + req.body.name + ' the ' + req.body.species;
  globalSandbox.petPOSTResponse = result;
  res.send(result);
});

app.get('/json', function(req, res){
  res.status(200).json({ name: 'manny' });
});

app.get('/querystring', function(req, res){
  res.send(req.query);
});

app.get('/error', function(req, res){
  res.status(500).send('boom');
});

app.listen(process.env.ZUUL_PORT);
