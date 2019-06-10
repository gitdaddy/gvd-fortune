const open = require('opn');
const express = require('express');
var router = express();
var fs = require('fs');
var _ = require('lodash');
// var rl = require('readline-sync');

const hostname = 'localhost';
const port = 8080;

function getRandomAdjustment() {
  var value = Math.random() * .001;
  return Math.random() < 0.5 ? -value : value;
}

function getMatch(sortedY) {
  for (var i = 0; i < sortedY.length; i++) {
    if (i > 0) {
      if (sortedY[i].y == sortedY[i-1].y)
        return sortedY[i];
    }
  }
  return null;
}

function sanitizeData(dataPoints) {
  var sortedY = _.sortBy(dataPoints, 'y');
  var match = getMatch(sortedY);
  while(match) {
    match.y -= getRandomAdjustment();
    match = getMatch(sortedY);
  }
}

function getDatasetJson() {
  // read in the files
  var json = {};
  var polygons = [];
  // var files = fs.readFileSync('./data/testFiles.txt', 'utf-8').split('\n');
  // Load the whole dataset
  var files = fs.readFileSync('./data/maze/files.txt', 'utf-8').split('\n');
  files.forEach(file => {
    var inputPoints = fs.readFileSync(file, 'utf-8').split('\n');
    var dataPoints = [];
    inputPoints.forEach(input => {
      if (input !== "") {
        var p = input.split(" ");
        if (p.length != 2)
          throw "Invalid input data line:" + input;

        var newElem = {x: parseFloat(p[0]), y: parseFloat(p[1])};
        if (dataPoints.length > 0){
          var previousElem = dataPoints[dataPoints.length - 1];

          // move the new element down slightly so we don't process the horizontal line
          if (previousElem.y == newElem.y) {
            newElem.y -= getRandomAdjustment();
          }
        }
        dataPoints.push(newElem);
        sanitizeData(dataPoints);
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

