const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3003;

// specify the folder
app.use(express.static(path.join(__dirname, 'uploads')));
// headers and content type
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

let storage = multer.diskStorage({
  // destination
  destination: function(req, file, cb) {
    cb(null, './uploads');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  },
});
let upload = multer({
  storage: storage,
});

app.post('/upload', upload.array('files', 12), function(req, res) {
  res.send(req.files);
});

let server = app.listen(port, function() {
  console.log('Listening on port %s...', port);
});
