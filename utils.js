'use strict';

// A place for utility functions

function sameSign(a,b) {
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

function siteColorSvg(id) {
  // return 'black';
  return d3.schemeCategory10[id % 10];
}

function arcColorSvg(id) {
  // return d3.schemeCategory20[id%20];
  return d3.schemeCategory10[id % 10];
}

function sanitizePointSiteData(polygons) {
  var points = [];
  _.forEach(polygons, function(poly) {
    points = points.concat(poly.points);
  });

  var sp = _.sortBy(points, function(p) { return p[1]; });
  for (var i = 1; i < sp.length; i++) {
    if (sp[i][0] === sp[i-1][0] && sp[i][1] === sp[i-1][1]) {
      console.log("applying offset to overlapping point");
      // offset the data point of i
      // WATCH VALUE
      sp[i][1] -= 0.00001;
    }
  }
}

function processNewDataset(setIdx) {

  g_datasetList[setIdx].isMap ?
    readMapData(g_datasetList[setIdx].filename) :
    readDataset(setIdx);
}

function x2win(x) {
  let xmin = -1;
  let xmax = 1;
  return (x - xmin) / (xmax - xmin) * width;
}

function win2x(xWin) {
  var half = width / 2;
  var dist = xWin - half;
  return dist / half;
}

function y2win(y) {
  let ymin = -1;
  let ymax = 1;
  return (1 - (y - ymin) / (ymax - ymin)) * height;
}

function win2y(yWin) {
  var half = height / 2;
  var dist = half - yWin;
  return dist / half;
}

function sortedInsertion(queue, newEvent) {
  var idx = _.sortedIndexBy(queue, newEvent, function(event) { return getEventY(event); });

  // insert the new event in order or on top
  if (idx === -1) {
    queue.push(newEvent);
  } else {
    queue.splice(idx, 0, newEvent);
  }
}

// Create the queue for the current dataset
function createDataQueue(reorder) {
  if (!reorder) {
    if (g_queue[localStorage.setIdx.toString()])
      return [...g_queue[localStorage.setIdx.toString()]];
  }
  var rslt = [];
  var points = [];
  g_datasetList[g_setIdx].data.forEach(function(poly) {
    points = points.concat(poly.points);
  });
  var sortedPoints = _.sortBy(points, function(p) { return p[1]; });

  _.forEach(sortedPoints, function(p) {
    var poly = getPolygonByLabel(p.label);
    var segs = _.filter(poly.segments, function(s) {
      return s.a[0] === p[0] && s.a[1] === p[1];
    });

    if (!_.isEmpty(segs)) {
      if (segs.length === 2) {
        if (isRightOfLine(segs[0].a, segs[0].b, segs[1].b)) {
          rslt.push(segs[0]);
          rslt.push(segs[1]);
        } else {
          rslt.push(segs[1]);
          rslt.push(segs[0]);
        }
      } else {
        rslt.push(segs[0]);
      }
    }
    rslt.push(p);
  });

  // create a clone of the result to access again
  g_queue[localStorage.setIdx.toString()] = [...rslt];
  return rslt;
}

function getEventPacket(event, queue) {
  // The queue can only hold at most 2 descendants
  if (queue.length < 2) return {site: event, type: PACKET_TYPE.CHILD};
  var n = queue[queue.length - 1];
  var nn = queue[queue.length - 2];
  // var packet = {};
  if (nn.type === 'segment' && n.type === 'segment') {
    return {
      site: event,
      rightChild: queue.pop(),
      leftChild: queue.pop(),
      type: PACKET_TYPE.MULTI_CHILD_PARENT
    };
  } else if (n.type === 'segment') {
    return {site: event, child: queue.pop(), type: PACKET_TYPE.PARENT};
  }

  return {site: event, type: PACKET_TYPE.CHILD};
}

function onSiteDrag() {
  var segments = [];
  g_datasetList[g_setIdx].data.forEach(function(poly) {
    segments = segments.concat(poly.segments);
  });
  drawSegments(segments);
  // the drag could have changed the queue order
  render(true);
}

function setTreeDebug(msg) {
  console.log(msg);
}

function getLocalSettings() {
  if (localStorage.settings)
    return JSON.parse(localStorage.settings)
}

function storeLocalSettings(settings) {
  localStorage.settings = JSON.stringify(settings);
}


// File IO Util Functions
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

// TODO maps
// function readMapData(filePath) {
//   var json = {};
//  var lines = fs.readFileSync(filePath, 'utf-8').split('\n');
//   var padding = 50;
//   json.height = lines.length - 4 + padding;
//   json.width = lines[4].length - 1 + padding;

//   var oneDimPixelArray = new Uint8Array(json.height * json.width);

//   for (var i = 4; i < lines.length; i++) {
//     for (var k = 0; k < lines[i].length-1; k++) {
//       if (lines[i][k] === '@') { // non-passable object
//         // compute the current idx
//         var pI = ((i + padding/2) - 4) * json.width;
//         var pK = k + padding;
//         oneDimPixelArray[pI + pK] = 255;// black
//       }
//     }
//   }

//   var output = labelConnectedComponents(oneDimPixelArray, json.height, json.width);
//   json.value = output;
//   return JSON.stringify(json);
// }

// Merge with dataset.js
function readDataset(setIdx) {
  // read in the files
  var points = [];
  var segments = [];
  var t0 = performance.now();

  d3.text(g_datasetList[setIdx].filePath, (fileData) => {
    var files = fileData.split("\n");
    var size = files.length;
    var count = 0;
    _.each(files, f => {
      if (f[0] === '#' || f.length === 0) {
        count++;
      } else {
        d3.text(f, (data) => {
          var dataPoints = [];
          var inputPoints = _.compact(data.trim().split("\n"));

          if (inputPoints.length === 2) {
            var p = inputPoints[0].split(" ");
            var newElem = {x: parseFloat(p[0]), y: parseFloat(p[1])};
            dataPoints.push(newElem)
          } else {
            inputPoints.forEach(input => {
              if (input !== "") {
                var p = input.split(" ");
                // if (p.length != 2)
                //   throw "Invalid input data line:" + input;
                var newElem = {x: parseFloat(p[0]), y: parseFloat(p[1])};
                dataPoints.push(newElem);
              }
            });
          }

          var poly = new Polygon();
          if (dataPoints.length > 1) {
            if (g_datasetList[setIdx].sanitize)
              dataPoints = sanitizeData(dataPoints);

            var p1 = new vec3(dataPoints[0].x,  dataPoints[0].y, 0);
            poly.addPoint(p1);
            points.push(p1);
            for(var i = 1; i < dataPoints.length-1; ++i) {
              var p = new vec3(dataPoints[i].x,  dataPoints[i].y, 0);
              // point.fileId = polygon.fileId;
              poly.addPoint(p);
              points.push(p);
              segments.push(poly.createSegment(i-1, i));
            }
            // last segment in the polygon (end, start)
            segments.push(poly.createSegment(dataPoints.length-2, 0));
          } else {
            // only a single point
            var point = new vec3(dataPoints[0].x,  dataPoints[0].y, 0);
            // point.fileId = polygon.fileId;
            poly.addPoint(point);
          }
          // one file per polygon
          if (!g_datasetList[setIdx].data) g_datasetList[setIdx].data = [];
          g_datasetList[setIdx].data.push(poly);

          count++;
          if (count === size) {
            // end
            if (g_datasetList[setIdx].sanitize)
              sanitizePointSiteData(g_datasetList[setIdx].data);

            drawSites(points);
            drawSegments(segments);

            var t1 = performance.now();
            var processTime = t1 - t0;
            console.log("Pre-process time:" + processTime.toFixed(6) + "(ms)");
            render();
            updateOverview();
          }
        });
      }
    });
  });
}
