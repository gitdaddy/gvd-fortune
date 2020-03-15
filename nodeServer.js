const open = require('open');
const express = require('express');
var router = express();
var fs = require('fs');
var _ = require('lodash');
var file_io = require('./fileIO.js')
const gvd_Addon = require("./gvd2.0/build/Release/addon.node");
// const gvd_Addon = require("./gvd2.0/build/Debug/addon.node");

const hostname = 'localhost';
const port = 8083;

function sameSign(a,b) {
  return (a * b) > 0;
}

function crossZ(v1, v2) {
  return (v1.x*v2.y) - (v1.y*v1.x);
}

function pointsColinear(p1, p2, p3) {
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

  // check co-linear pointsColinear(p1,p2,p3)
  var np0 = {x: x1, y: y1};
  var np1 = {x: x2, y: y2};
  var lp0 = {x: x3, y: y3};
  var lp1 = {x: x4, y: y4};
  if (pointsColinear(lp0, lp1, np0) || pointsColinear(lp0, lp1, np1)) return 0;

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

// function writeRandom(size, datasetFile) {
//   // all bounds are within -1, 1
//   var sibDir = "./data/random_" + size;

//   var path = './data/' + datasetFile + '.txt';

//   // add a line that doesn't intersect any previous line
//   var lines = [];
//   var i = 0;
//   var isOverLapping = false;
//   while (i < size || isOverLapping) {
//     var negativeY = Math.random() > 0.5;
//     var negativeX = Math.random() > 0.5;
//     var x0 = Math.random();
//     if (negativeX) x0 = -x0;
//     var x1 = Math.random();
//     if (negativeX) x1 = -x1;
//     var y0 = Math.random();
//     if (negativeY) y0 = -y0;
//     var y1 = Math.random();
//     if (negativeY) y1 = -y1;
//     if (overlapsAny(x0, y0, x1, y1, lines)) {
//       console.log("overlapped i:" + i)
//       isOverLapping = true;
//     } else {
//       isOverLapping = false;
//       lines.push({x0: x0, y0: y0, x1: x1, y1: y1});
//       i++;
//     }
//   }

//   var count = 1;
//   _.forEach(lines, function (l) {
//     l.fileId = "line" + count++ + ".txt";
//     // lines are in the format of (p1.p2..p1) start .. point ... start
//     var data = `${l.x0} ${l.y0}\n${l.x1} ${l.y1}\n${l.x0} ${l.y0}`;
//     var newPath = sibDir + '/' + l.fileId;
//     fs.writeFile(newPath, data, function (err) {
//       if (err) throw err;
//     })
//   });

//   // write the new file references in dataset#.text
//   fs.open(path, 'w', function(err, fd) {
//     if (err) {
//       throw 'could not open file: ' + err;
//     }
//     var data = "";
//     _.forEach(lines, function(l, idx) {
//       if (idx !== 0) data += "\n";
//       data +=  sibDir + '/' + l.fileId;
//     });
//     var buffer = new Buffer(data);

//     // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
//     fs.write(fd, buffer, 0, buffer.length, null, function(err) {
//         if (err) throw 'error writing file: ' + err;
//         fs.close(fd, function() {
//             console.log('wrote the file successfully');
//         });
//     });
//   });
// }

// approach not useful for over 40 sided polygon
// function rpgWrite(size) {
//   // all bounds are within -1, 1
//   var outputFile = "./data/RPG/rpg_" + size + ".txt";

//   // add a line that doesn't intersect any previous line
//   var lines = [];
//   var points = [];
//   var i = 0;
//   var isOverLapping = false;
//   while (i < size || isOverLapping) {
//     var negativeY = Math.random() > 0.5;
//     var negativeX = Math.random() > 0.5;
//     var x = Math.random();
//     if (negativeX) x = -x;
//     var y = Math.random();
//     if (negativeY) y = -y;
//     if (i !== 0) {
//       var xPrev = points[i-1][0];
//       var yPrev = points[i-1][1];
//       if (overlapsAny(xPrev, yPrev, x, y, lines)) {
//         console.log("overlapped i:" + i)
//         isOverLapping = true;
//       } else {
//         isOverLapping = false;
//         lines.push({x0: xPrev, y0: yPrev, x1: x, y1: y});
//         points.push([x, y]);
//         i++;
//       }
//     } else {
//       points.push([x, y]);
//       i++;
//     }
//   }

//   var data = "";
//   _.each(points, pt => {
//     data += `${pt[0]} ${pt[1]}\n`;
//   });

//   // complete the cycle
//   // TODO can we test for overlap here?
//   data += `${points[0][0]} ${points[0][1]}\n`;

//   fs.writeFile(outputFile, data, function (err) {
//     if (err) throw err;
//   });
// }

// function holesWrite(numSegments, datasetIdx) {
//   // all bounds are within -1, 1
//   var dir = "./data/holes/h_" + numSegments + "/";
//   var boxes = [];

//   var outerBox = [
//     [-.95, 0.95],
//     [.95, 0.95],
//     [.95, -0.95],
//     [-.95, -0.95],
//     [-.95, 0.95],
//   ];
//   boxes.push(outerBox);

//   var numHoles = (numSegments / 4) - 1;
//   var dim = Math.ceil(Math.sqrt(numHoles));
//   if ((dim + 1) === 0) throw "invalid hole dim";
//   var step = 1.9 / (dim + 1);

//   var startCenter = [outerBox[0][0] + step, outerBox[0][1] - step];
//   for (var i = 0; i < dim; i++){
//     for (var j = 0; j < dim; j++){
//       if ((i+1) * (j+1) > numHoles) {
//         // console.log("i * j =" + i * j  +" > " + numHoles)
//         break;
//       }
//       var newCenter = [startCenter[0] + step*i, startCenter[1] - step*j];
//       var nw = [newCenter[0] - (step/3), newCenter[1] + (step/3)];
//       var ne = [newCenter[0] + (step/3), newCenter[1] + (step/3)];
//       var sw = [newCenter[0] + (step/3), newCenter[1] - (step/3)];
//       var se = [newCenter[0] - (step/3), newCenter[1] - (step/3)];
//       var newBox = [nw, ne, sw, se, nw];
//       boxes.push(newBox);
//     }
//   }

//   var files = "";
//   var count = 1;
//   _.each(boxes, b => {
//     var data = "";
//     _.each(b, pt => {
//       data += `${pt[0]} ${pt[1]}\n`;
//     });
//     var filename = "box_" + count + ".txt";
//     files += dir + filename + "\n";
//     fs.writeFile(dir + filename, data, function (err) {
//       if (err) throw err;
//     });
//     count++;
//   });

//   console.log("writing holes dataset to file")

//   fs.writeFile(`./data/dataset${datasetIdx}.txt`, files, function (err) {
//     if (err) throw err;
//   });
// }

function getDatasetJson(path) {
  // read in the files
  var json = {};
  var polygons = [];
  var files = fs.readFileSync(path, 'utf-8').split('\n');
  files.forEach(file => {
    // comments don't need to be processed
    if (file[0] !== '#' && file.length !== 0) {
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

function labelConnectedComponents(src, height, width) {
  var count = 1;
  var conflicts = new Array(1000);
  for (var row = 0; row < height; row++) {
    for (var col = 0; col < width; col++) {
      var idx = col + row * width;
      if (src[idx] === 255) {
        var idxBehind = idx - 1;
        var idxAbove = idx - width;
        // connected
        if (src[idxBehind] !== 0 && src[idxAbove] !== 0) {
          if (src[idxBehind] === src[idxAbove]) {
            src[idx] = src[idxBehind];
          } else {
            // conflict - remember them for later
            if (src[idxBehind] < src[idxAbove]) {
              src[idx] = src[idxBehind];
              conflicts[src[idxAbove]] = src[idxBehind];
            } else {
              src[idx] = src[idxAbove];
              conflicts[src[idxBehind]] = src[idxAbove];
            }
          }
        } else if (src[idxBehind] !== 0) {
          src[idx] = src[idxBehind];
        } else if (src[idxAbove] !== 0) {
          src[idx] = src[idxAbove];
        } else {
          // test go until you end || connect to something above
          var endIdx = idx;
          var end = false;
          var above = false;
          while (!above && !end) {
            idxAbove = idxAbove + 1;
            above = (src[idxAbove] !== 0);
            end = (!src[endIdx] || src[endIdx] === 0);
            endIdx++;
          }

          if (end) {
            // not connected - label
            src[idx] = count;
            // console.log("count:" + count);
            count++;
          } else {
            // increment the start to the end and label
            // to match the top
            for (var ii = idx; ii <= endIdx; ii++){
              src[ii] = src[idxAbove];
            }
            col += (endIdx - idx);
          }
        }
      }
    }
  }

  // re- label
  // conflicts = _.uniq(conflicts);
  // console.log("re label rows conflicts size:" + conflicts.length);
  var len = height * width;
  for (var i = conflicts.length - 1; i > -1; i--)
  {
    var low = conflicts[i];
    if (low) {
      for (var j = 0; j < len; j++){
        if (src[j] === i) {
          src[j] = low;
        }
      }
    }
  }
  return src;
}

function getMapDatasetJson(filePath) {
  var json = {};
  var lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  var padding = 50;
  json.height = lines.length - 4 + padding;
  json.width = lines[4].length - 1 + padding;

  var oneDimPixelArray = new Uint8Array(json.height * json.width);

  for (var i = 4; i < lines.length; i++) {
    for (var k = 0; k < lines[i].length-1; k++) {
      if (lines[i][k] === '@') { // non-passable object
        // compute the current idx
        var pI = ((i + padding/2) - 4) * json.width;
        var pK = k + padding;
        oneDimPixelArray[pI + pK] = 255;// black
      }
    }
  }

  var output = labelConnectedComponents(oneDimPixelArray, json.height, json.width);
  json.value = output;
  return JSON.stringify(json);
}

//////////////////////////////////// route code ///////////////////////////////////
router.get('/', function(req, res) {
  res.type("html");
  res.sendFile('index.html', {root: __dirname});
});

// TODO old deprecate
router.get('/data', function(req, res) {
  res.type('json');
  res.json(getDatasetJson(req.query.value));
});

router.get('/data_new', function(req, res) {
  res.type('json');
  var val = parseFloat(req.query.sweepline);
  if (val > 1.0 || val < -1.0) return;
  console.log("Compute @ val:" + val);
  let jsonObj = gvd_Addon.ComputeGVD(req.query.value, val);
  if (!jsonObj)
    console.log("Server failed to perform task");
  var j = file_io.readOutputFiles(jsonObj);
  j.msg = jsonObj.msg;
  j.err = jsonObj.err;
  res.json(j);
});

router.get('/line_change', function(req, res) {
  res.type('json');
  var val = parseFloat(req.query.sweepline);
  if (val > 1.0 || val < -1.0) return;
  // console.log("Update @ val:" + val);
  let jsonObj = gvd_Addon.Update(val);
  if (!jsonObj)
    console.log("Server failed to perform task");
  var j = file_io.readOutputFiles(jsonObj);
  j.msg = jsonObj.msg;
  j.err = jsonObj.err;
  res.json(j);
});

router.get('/map', function(req, res) {
  var filePath = req.query.value;
  res.type('json');
  res.json(getMapDatasetJson(filePath));
});

// router.get('/randomize', function(req, res) {
//   // Randomize the dataset data
//   // writeRandom(100, "dataset2");
//   // writeRandom(200, "dataset3");
//   // writeRandom(500, "dataset4");
//   writeRandom(1000, "dataset5");
// });

// router.get('/rpg', function(req, res) {
//   rpgWrite(32);
// });

// router.get('/holes', function(req, res) {
//   // holesWrite(64, 10);
//   // holesWrite(128, 11);
//   holesWrite(1024, 14);
//   // holesWrite(2048, 15);
//   holesWrite(4096, 16);
//   holesWrite(8192, 17);
//   holesWrite(16384, 18);
//   holesWrite(32768, 19);
// });

router.use(express.static(__dirname));

router.listen(port);

// open default web client
open('http://localhost:8083/');

