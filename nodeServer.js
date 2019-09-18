const open = require('opn');
const express = require('express');
var router = express();
var fs = require('fs');
var _ = require('lodash');

const hostname = 'localhost';
const port = 8082;

function getDatasetJson(set) {
  // read in the files
  var json = {};
  var polygons = [];
  var path = './data/' + set + '.txt';
  var files = fs.readFileSync(path, 'utf-8').split('\n');
  files.forEach(file => {
    // comments don't need to be processed
    if (file[0] !== '#') {
      var inputPoints = fs.readFileSync(file.trim(), 'utf-8').split('\n');
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
            // sanitizeData(dataPoints);
          }
        });
      }
      // one file per polygon
      polygons.push({points: dataPoints, fileId: file});
    }
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
  var set = req.query.value;
  res.type('json');
  res.json(getDatasetJson(set));
});

router.use(express.static(__dirname));

router.listen(port);

// open default web client
open('http://localhost:8082/');

