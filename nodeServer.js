const open = require('opn');
const express = require('express');
var router = express();
var fs = require('fs');
var _ = require('lodash');
// var rl = require('readline-sync');

const hostname = 'localhost';
const port = 8080;

function getRandomAdjustment(dataPoints, match) {
  var xDiff = Math.abs(dataPoints[match.s1Idx].x - dataPoints[match.s2Idx].x);
  var value = xDiff * 0.01;
  // var value = Math.random() * 1e-6;
  if (value === 0.0) {return 1e-6;}
  var rslt = Math.random() < 0.5 ? -value : value;
  // console.log("Returning adjustment:" + rslt);
  return rslt;
}

function getMatch(dataPoints) {
  for (var i = 1; i < dataPoints.length; i++) {
    if (dataPoints[i].y == dataPoints[i-1].y)
      return {
        s1Idx :i-1,
        s2Idx :i
      }
  }
  return null;
}

function sanitizeData(dataPoints) {
  // var sortedY = _.sortBy(dataPoints, 'y');
  var match = getMatch(dataPoints);
  while(match) {
    dataPoints[match.s1Idx].y -= getRandomAdjustment(dataPoints, match);
    match = getMatch(dataPoints);
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
    inputPoints = _.compact(inputPoints);
    if (inputPoints.length === 2) {
      var p = inputPoints[0].split(" ");
      var newElem = {x: parseFloat(p[0]), y: parseFloat(p[1])};
      dataPoints.push(newElem)
    } else {
      inputPoints.forEach(input => {
        if (input !== "") {
          var p = input.split(" ");
          if (p.length != 2)
            throw "Invalid input data line:" + input;
          var newElem = {x: parseFloat(p[0]), y: parseFloat(p[1])};
          dataPoints.push(newElem);
          sanitizeData(dataPoints);
        }
      });
    }
    // one file per polygon
    polygons.push({points: dataPoints, fileId: file});
  });

  json.polygons = polygons;
  return JSON.stringify(json); // {polygons:[{points: [{}], fileId: ''}, ..]}
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

