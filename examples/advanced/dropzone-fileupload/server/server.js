let express = require('express');
let multer = require('multer');
let path = require('path');
let app = express();
let port = 3003;


// specify the folder
app.use(express.static(path.join(__dirname, 'uploads')));
// headers and content type
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

let storage = multer.diskStorage({
    // destination
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
let upload = multer({
    storage: storage
});
// var type = upload.single('recfile');

// app.post("/upload", type, function (req, res) {
//     console.log('files', req.files);
//     res.send(req.files);
// });



app.post("/upload", upload.array('files', 12), function (req, res) {
    console.log('files', req.files);
    res.send(req.files);
});

let server = app.listen(port, function () {
    console.log("Listening on port %s...", port);
});