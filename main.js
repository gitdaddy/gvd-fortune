"use strict";

var sweepline = 0.1;

let datasets;
var numLabels = 2;

var circle;
var sweepLine;
var program;

var mvMatrix;
var pMatrix;

var points = [];
var segments = [];
var vverts = [];
var closeEventPoints = [];
var dcel;

var debugObjs = [];

let showEvents = false;
let showSegmentBoundaries = false;
let showDebugObjs = false;

function siteColorSvg(id) {
  // return 'black';
  return d3.schemeCategory10[id%10];
}

function arcColorSvg(id) {
  // return d3.schemeCategory20[id%20];
  return d3.schemeCategory10[id%10];
}

var events = new TinyQueue([], function(a, b) {
  return a.y > b.y ? -1 : a.y < b.y ? 1 : 0;
});

var reverseEvents = [];

var matrixStack = [];
function pushMatrix() {
  matrixStack.push(mvMatrix);
}
function popMatrix() {
  mvMatrix = matrixStack.pop();
}

function setSweepline(d) {
  sweepline = d;
  localStorage.sweepline = d;
}

function incSweepline(inc) {
  setSweepline(sweepline + inc);
}

function keydown(event) {
  var x = event.keyCode;
  var key = event.key;
  var changed = false;
  var inc = 0.01;
  if (x == 40 || key == "j" || key == "J") {
    // Down arrow
    if (event.shiftKey) {
      incSweepline(-inc*0.1);
    } else if (event.ctrlKey) {
      incSweepline(-inc*10);
    } else {
      incSweepline(-inc);
    }
    changed = true;
  } else if (x == 38 || key == "k" || key == "K") {
    // Up arrow
    if (event.shiftKey) {
      incSweepline(inc*0.1);
    } else if (event.ctrlKey) {
      incSweepline(inc*10);
    } else {
      incSweepline(inc);
    }
    changed = true;
  } else if (x == 39) {
    // Right arrow
    if (events.length > 0) {
      var p = events.pop();
      reverseEvents.push(p);
      setSweepline(p[1]);
      changed = true;
    }
  } else if (x == 37) {
    // Left arrow
    if (reverseEvents.length > 0) {
      var p = reverseEvents.pop();
      events.push(p);
      setSweepline(p[1]);
      changed = true;
    }
  } else if (key == "d") {
    // Print the sweepline value
    console.log("sweepline = " + sweepline);
  } else if (key == "i") {
    isoEdgeWidth = isoEdgeWidth==0 ? 1 : 0;
    changed = true;
  } else if (key == 'e') {
    showEvents = !showEvents;
    d3.selectAll(".close-event")
      .attr('visibility', showEvents ? null : 'hidden');
  } else if (key == 'b') {
    showSegmentBoundaries = !showSegmentBoundaries;
    d3.selectAll(".seg-boundary")
      .attr('visibility', showSegmentBoundaries ? null : 'hidden');
  } else if (key == 'v') {
    showDebugObjs = !showDebugObjs;
    d3.selectAll(".debug-line")
    .attr('visibility', showDebugObjs ? null : 'hidden');
    d3.selectAll(".debug-parabola")
    .attr('visibility', showDebugObjs ? null : 'hidden');
  }
  if (changed) {
    // Prevent scroll
    event.preventDefault();

    var t0 = performance.now();
    render();
    var t1 = performance.now();
    // console.log("Call to render took " + (t1 - t0) + " milliseconds.")

    document.getElementById("sweeplineLabel").innerHTML = sweepline.toFixed(3);
  }
}

let gvdw = 500;
let gvdh = 500;

let SITE_RADIUS = 10/gvdw;
let SITE_RADIUS_HIGHLIGHT = 11/gvdw;

function x2win(x) {
  let xmin = -1;
  let xmax = 1;
  return (x-xmin)/(xmax-xmin) * gvdw;
}

function win2x(xWin) {
  var half = gvdw / 2;
  var dist = xWin - half;
  return dist / half;
}

function y2win(y) {
  let ymin = -1;
  let ymax = 1;
  return (1-(y-ymin)/(ymax-ymin)) * gvdh;
}

function win2y(yWin) {
  var half = gvdh / 2;
  var dist = half - yWin;
  return dist / half;
}

function init() {
  if (localStorage.sweepline) {
    sweepline = parseFloat(localStorage.sweepline);
  }

  document.onkeydown = keydown;
  document.getElementById("gvdsvg").onclick = mouseclick;
  document.getElementById("sweeplineLabel").innerHTML = sweepline.toFixed(3);

  createDatasets();
  for (let key in datasets) {
    var option = document.createElement("option");
    option.text = key;
    document.getElementById("dataset").add(option);
  }

  for (var i = 2; i < 10; i++) {
    var option = document.createElement("option");
    option.text = i;
    document.getElementById("numLabels").add(option);
  }

  if (localStorage.dataset) {
    document.getElementById("dataset").value = localStorage.dataset;
  }
  datasetChange(document.getElementById("dataset").value);
}

function numLabelsChange(value)
{
  var intVal = parseInt(value);
  numLabels = intVal;
  datasetChange(localStorage.dataset);
}

function datasetChange(value) {
  console.log(value);
  localStorage.dataset = value;

  points = datasets[value].points;
  segments = datasets[value].segments;
  // Give all points and segments a unique ID and label
  var id = 1;
  points.forEach(function(p) {
    p.id = id++;
    p.label = p.id % numLabels;
  });

  segments.forEach(function(s) {
    s.id = id++;
    s.label = s.id % numLabels;
    // label all connected sites with the same label
    points.forEach(function (p) {
      if ((p.x == s.a.x && p.y == s.a.y) ||
          (p.x == s.b.x && p.y == s.b.y)) {
        p.label = s.label;
      }
      // if point is on the lowest y point of the segment it is flipped
      p.flipped = (p.x == s.b.x && p.y == s.b.y);
    });
  });

  initDebugCircumcircle();
  drawSites(points);
  drawSegments(segments);

  //------------------------------
  // Check for identical y values.
  //------------------------------
  var yvalues = [];
  points.forEach(function(p) {
    yvalues.push(p.y);
  });
  // Don't check segments since they're constructed from points
  // segments.forEach(function(s) {
  //   yvalues.push(s.y);
  // });
  yvalues.sort();
  for (var i = 1; i < yvalues.length; ++i) {
    if (yvalues[i] == yvalues[i-1]) {
      console.log("WARNING: sites with identical y values of " + yvalues[i]);
    }
  }

  //------------------------------
  // Check for identical x values.
  //------------------------------
  var xvalues = [];
  points.forEach(function(p) {
    xvalues.push(p.x);
  });
  xvalues.sort();
  for (var i = 1; i < xvalues.length; ++i) {
    if (xvalues[i] == xvalues[i-1]) {
      console.log("WARNING: sites with identical x values of " + xvalues[i]);
    }
  }

  events = [];

  // Add points as events
  points.forEach(function(p) {
    events.push(p);
  });

  // Add segments as events
  segments.forEach(function(s) {
    events.push(s);
  });

  render();
}

function fortune() {
  nodeId = 1;
  dcel = new DCEL();
  var beachline = new Beachline(dcel);
  var pointsCopy = points.slice();
  _.forEach(segments, function (seg) { seg.ordered = false; });
  var segmentsCopy = segments.slice();
  var events = new TinyQueue(pointsCopy.concat(segmentsCopy), function(a, b) {
    return a.y > b.y ? -1 : a.y < b.y ? 1 : 0;
  });
  closeEventPoints = [];
  while (events.length > 0 && events.peek().y > sweepline) {
    var e = events.pop();
    if (e.type == "segment" && !e.ordered) {
      e.ordered = true;
      events.push(e);
      e = events.pop();
    }
    if (e.isCloseEvent) {
      if (e.live) {
	e.arcNode.prevEdge().dcelEdge.dest.point = e.point;
	e.arcNode.nextEdge().dcelEdge.dest.point = e.point;
	var newEvents = beachline.remove(e.arcNode, e.point);
        newEvents.forEach(function(ev) {
          if (ev.y < e.y - 0.000001) {
	    events.push(ev);
            if (ev.isCloseEvent) {
	      closeEventPoints.push(ev);
            }
          }
        });
	// closeEventPoints.push(e.point);
      }
    } else {
      // Site event
      var newEvents = beachline.add(e);
      newEvents.forEach(function(ev) {
        if (ev.y < e.y - 0.000001) {
	  events.push(ev);
          if (ev.isCloseEvent) {
	    closeEventPoints.push(ev);
          }
        }
      });
    }
  }

  let ev = '<br>';
  while (events.length > 0) {
    var e = events.pop();
    ev += e.y + '<br>';
  }
  document.getElementById("events").innerHTML = ev;
  return beachline;
}

function render() {
  debugObjs = [];
  var t0 = performance.now();
  var beachline = fortune();
  var t1 = performance.now();

  drawBeachline(beachline, sweepline, showEvents);
  drawCloseEvents(closeEventPoints);
  drawSweepline(sweepline);
  drawSurface(dcel);

  showTree(beachline.root);

  runTests();
}

function onSiteDrag() {
  drawSegments(segments);
  render();
}

/// Code For Debugging the GVD

function mouseclick(e) {
  document.getElementById("mouseX").innerHTML = win2x(e.offsetX);
  document.getElementById("mouseY").innerHTML = win2y(e.offsetY);
}

function setDebug(msg) {
  document.getElementById("debug").innerHTML = msg;
}
