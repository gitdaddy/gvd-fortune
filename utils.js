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

function processNewDataset() {
  var t0 = performance.now();
  var segments = [];
  var points = [];
  g_polygons.forEach(function(poly) {
    // markSiteRelations(poly.segments);
    segments = segments.concat(poly.segments);
    points = points.concat(poly.points);
  });

  sanitizePointSiteData(g_polygons);

  // debug only
  initDebugCircumcircle();
  drawSites(points);
  drawSegments(segments);

  var t1 = performance.now();
  var processTime = t1 - t0;
  console.log("Pre-process time:" + processTime.toFixed(6) + "(ms)");

  render();
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
    if (g_queue[localStorage.g_dataset])
      return [...g_queue[localStorage.g_dataset]];
  }
  var rslt = [];
  var points = [];
  g_polygons.forEach(function(poly) {
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
  g_queue[localStorage.g_dataset] = [...rslt];
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
  g_polygons.forEach(function(poly) {
    segments = segments.concat(poly.segments);
  });
  drawSegments(segments);
  // the drag could have changed the queue order
  render(true);
}

/// Code For Debugging the GVD

// function toggleFS() {
//   g_fullScreen = !g_fullScreen;

//   if (g_fullScreen) {
//     d3.select('#tree').attr('width', 0).attr('height', 0);
//     d3.select('#treeDebug').attr('width', widthT).attr('height', heightT);

//     var w = window.innerWidth - margin.left - margin.right;
//     var h = window.innerHeight - margin.top - margin.bottom;

//     d3.select('#gvdsvg').attr('width', w).attr('height', h);

//     var h2 = window.innerHeight / 2;
//     var w2 = window.innerWidth / 2;
//     d3.select('#gvd').attr(
//         'transform', 'translate(' + w2 + ',' + h2 + ') scale(' + width / 4.0 +
//             ',' + -1 * height / 4.0 + ')');
//     document.getElementById('mainView').className = 'fullscreen';
//   } else {
//     d3.select('#tree').attr('width', widthT).attr('height', heightT);
//     d3.select('#treeDebug').attr('width', 0).attr('height', 0);

//     d3.select('#gvdsvg').attr('width', width).attr('height', height);

//     d3.select('#gvd').attr(
//         'transform', 'translate(' + width / 2.0 + ',' + height / 2.0 +
//             ') scale(' + width / 2.0 + ',' + -1 * height / 2.0 + ')');
//     document.getElementById('mainView').className = 'column';
//   }
// }

function setDebug(msg) {
  var id = g_fullScreen ? "tree-debug1" : "tree-debug2";
  document.getElementById(id).innerHTML = msg;
}
