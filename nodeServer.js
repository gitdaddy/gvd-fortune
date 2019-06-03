const open = require('opn');
const express = require('express');
var router = express();
var fs = require('fs');
// var rl = require('readline-sync');

const hostname = 'localhost';
const port = 8080;

function getDatasetJson() {
  // read in the files
  var json = {};
  var polygons = [];
  var files = fs.readFileSync('./data/testFiles.txt', 'utf-8').split('\n');
  // Load the whole dataset
  // var files = fs.readFileSync('./data/maze/files.txt', 'utf-8').split('\n');
  files.forEach(file => {
    var inputPoints = fs.readFileSync(file, 'utf-8').split('\n');
    var dataPoints = [];
    inputPoints.forEach(input => {
      if (input !== "") {
        var p = input.split(" ");
        if (p.length != 2)
          throw "Invalid input data line:" + input;
        dataPoints.push({x: parseFloat(p[0]), y: parseFloat(p[1])});
      }
    });
    // one file per polygon
    polygons.push({points: dataPoints});
  });

  json.polygons = polygons;
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

// router.get('/testData', function(req, res) {
//   res.type('json');
//   res.json(getTestDatasetJson());
// });

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
