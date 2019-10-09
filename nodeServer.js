// const open = require('opn');
const express = require('express');
var router = express();
var fs = require('fs');
var _ = require('lodash');

const hostname = 'localhost';
const port = 8080;

/* function sameSign(a,b) {
  return (a * b) > 0;
}

function crossZ(v1, v2) {
  return (v1.x*v2.y) - (v1.y*v1.x);
}

function isColinear(p1, p2, p3) {
  var v1 = {x:p2.x - p1.x, y:p2.y - p1.y};
  var v2 = {x:p3.x - p1.x, y:p3.y - p1.y};
  return crossZ(v1, v2) === 0;
}

function overlap(x1, y1, x2, y2, x3, y3, x4, y4){
	var a1, a2, b1, b2, c1, c2;
	var r1, r2 , r3, r4;
	var denom;

	// a1, b1, c1, where line joining points 1 and 2
	// is "a1 x + b1 y + c1 = 0".
	a1 = y2 - y1;
	b1 = x1 - x2;
	c1 = (x2 * y1) - (x1 * y2);

	// r3 and r4.
	r3 = ((a1 * x3) + (b1 * y3) + c1);
  r4 = ((a1 * x4) + (b1 * y4) + c1);

  // check co-linear isColinear(p1,p2,p3)
  var np0 = {x: x1, y: y1};
  var np1 = {x: x2, y: y2};
  var lp0 = {x: x3, y: y3};
  var lp1 = {x: x4, y: y4};
  if (isColinear(lp0, lp1, np0) || isColinear(lp0, lp1, np1)) return 0;

	// Check signs of r3 and r4. If both point 3 and point 4 lie on
	// same side of line 1, the line segments do not intersect.
	if ((r3 !== 0) && (r4 !== 0) && sameSign(r3, r4)){
		return 0; //return that they do not intersect
	}

	// a2, b2, c2
	a2 = y4 - y3;
	b2 = x3 - x4;
	c2 = (x4 * y3) - (x3 * y4);

	// r1 and r2
	r1 = (a2 * x1) + (b2 * y1) + c2;
	r2 = (a2 * x2) + (b2 * y2) + c2;

	// Check signs of r1 and r2. If both point 1 and point 2 lie
	// on same side of second line segment, the line segments do
	// not intersect.
	if ((r1 !== 0) && (r2 !== 0) && (sameSign(r1, r2))){
		return 0; //return that they do not intersect
	}

	//Line segments intersect: intersection point.
	denom = (a1 * b2) - (a2 * b1);

	if (denom === 0) {
		return 1; //collinear
	}

	// lines_intersect
	return 1; //lines intersect, return true
}

function overlapsAny(x0, y0, x1, y1, lines) {
  var rslt = false;
  _.forEach(lines, function (l) {
    if (overlap(x0, y0, x1, y1, l.x0, l.y0, l.x1, l.y1)){
      rslt = true;
      return;
    }
  });
  return rslt;
}

function writeRandom(size, datasetFile) {
  // all bounds are within -1, 1
  var sibDir = "./data/random_" + size;

  var path = './data/' + datasetFile + '.txt';

  // add a line that doesn't intersect any previous line
  var lines = [];
  var i = 0;
  var isOverLapping = false;
  while (i < size || isOverLapping) {
    var negativeY = Math.random() > 0.5;
    var negativeX = Math.random() > 0.5;
    var x0 = Math.random();
    if (negativeX) x0 = -x0;
    var x1 = Math.random();
    if (negativeX) x1 = -x1;
    var y0 = Math.random();
    if (negativeY) y0 = -y0;
    var y1 = Math.random();
    if (negativeY) y1 = -y1;
    if (overlapsAny(x0, y0, x1, y1, lines)) {
      console.log("overlapped i:" + i)
      isOverLapping = true;
    } else {
      isOverLapping = false;
      lines.push({x0: x0, y0: y0, x1: x1, y1: y1});
      i++;
    }
  }

  var count = 1;
  _.forEach(lines, function (l) {
    l.fileId = "line" + count++ + ".txt";
    // lines are in the format of (p1.p2..p1) start .. point ... start
    var data = `${l.x0} ${l.y0}\n${l.x1} ${l.y1}\n${l.x0} ${l.y0}`;
    var newPath = sibDir + '/' + l.fileId;
    fs.writeFile(newPath, data, function (err) {
      if (err) throw err;
    })
  });

  // write the new file references in dataset#.text
  fs.open(path, 'w', function(err, fd) {
    if (err) {
      throw 'could not open file: ' + err;
    }
    var data = "";
    _.forEach(lines, function(l, idx) {
      if (idx !== 0) data += "\n";
      data +=  sibDir + '/' + l.fileId;
    });
    var buffer = new Buffer(data);

    // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
    fs.write(fd, buffer, 0, buffer.length, null, function(err) {
        if (err) throw 'error writing file: ' + err;
        fs.close(fd, function() {
            console.log('wrote the file successfully');
        });
    });
  });
} */

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

router.get('/randomize', function(req, res) {
  // Randomize the dataset data
  // writeRandom(100, "dataset2");
  // writeRandom(200, "dataset3");
  // writeRandom(500, "dataset4");
  writeRandom(1000, "dataset5");
});

router.use(express.static(__dirname));

router.listen(port);

// open default web client
// open('http://localhost:8082/');

