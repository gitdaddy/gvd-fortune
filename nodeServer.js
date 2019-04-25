const open = require('opn');
const express = require('express');
var router = express();
var fs = require('fs');

const hostname = 'localhost';
const port = 8080;

function getDatasetJson() {
  // read in the files
  var json = {};
  var shapes = [];
  var polygon = {points: []};

  var lineReader = require('readline').createInterface({
    input: fs.createReadStream('./data/maze/files.txt')
  });

  lineReader.on('line', function (line) {
    console.log('Line from file:', line);
    // TODO for each line read in the polygon
  });

  shapes.push(polygon);

  json.polygons = shapes;
  return JSON.stringify(json); // {polygons:[{points: [{}], ..]}
}

// route code
router.get('/', function(req, res) {
  res.type("html");
  res.sendFile('index.html', {root: __dirname});
});

router.get('/data', function(req, res) {
  res.type('json');
  res.json(getDatasetJson());
});

router.use(express.static(__dirname));

router.listen(port);

// open default web client
open('http://localhost:8080/');


// old style server
// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Welcome\n');
// });

// server.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
//   // specify the app to open in
//   open('http://localhost:8080/');
// });
