"use strict";

var sweepline = 0.1;

let g_datasets = {};
let g_polygons = [];
let g_queue = {};

var sweepLine;
var program;

var mvMatrix;

var closeEventPoints = [];
var dcel;

var g_debugObjs = [];
var g_addDebug = false;

let showEvents = false;
let showDebugObjs = false;
let fullScreen = false;
let hideInfo = false;

function siteColorSvg(id) {
  // return 'black';
  return d3.schemeCategory10[id % 10];
}

function arcColorSvg(id) {
  // return d3.schemeCategory20[id%20];
  return d3.schemeCategory10[id % 10];
}

function processNewDataset() {
  var segments = [];
  var points = [];
  g_polygons.forEach(function(poly) {
    markSiteRelations(poly.segments);
    segments = segments.concat(poly.segments);
    points = points.concat(poly.points);
  });

  initDebugCircumcircle();
  drawSites(points);
  drawSegments(segments);

  render();
}

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

function jointSegments(A, B) {
  return A.a == B.a || A.a == B.b || A.b == B.a || A.b == B.b;
}

function keydown(event) {
  var x = event.keyCode;
  var key = event.key;
  var changed = false;
  var inc = 0.01;
  if (x == 40 || key == "j" || key == "J") {
    // Down arrow
    if (event.shiftKey) {
      incSweepline(-inc * 0.01);
    } else if (event.ctrlKey) {
      incSweepline(-inc * 10);
    } else {
      incSweepline(-inc);
    }
    changed = true;
  } else if (x == 38 || key == "k" || key == "K") {
    // Up arrow
    if (event.shiftKey) {
      incSweepline(inc * 0.01);
    } else if (event.ctrlKey) {
      incSweepline(inc * 10);
    } else {
      incSweepline(inc);
    }
    changed = true;
  // } else if (x == 39) {
  //   // Right arrow
  //   if (events.length > 0) {
  //     var p = events.pop();
  //     reverseEvents.push(p);
  //     setSweepline(p[1]);
  //     changed = true;
  //   }
  // } else if (x == 37) {
  //   // Left arrow
  //   if (reverseEvents.length > 0) {
  //     var p = reverseEvents.pop();
  //     events.push(p);
  //     setSweepline(p[1]);
  //     changed = true;
  //   }
  } else if (key == "d") {
    // Print the sweepline value
    console.log("sweepline = " + sweepline);
  } else if (key == "i") {
    isoEdgeWidth = isoEdgeWidth == 0 ? 1 : 0;
    changed = true;
  } else if (key == 'e') {
    showEvents = !showEvents;
    d3.selectAll(".close-event")
      .attr('visibility', showEvents ? null : 'hidden');
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

function init() {
  if (localStorage.sweepline) {
    sweepline = parseFloat(localStorage.sweepline);
  }
  drawInit();

  document.onkeydown = keydown;
  document.getElementById("gvdsvg").onclick = mouseclick;
  document.getElementById("fullscreenToggle").onclick = toggleFS;
  document.getElementById("hideInfo").onclick = toggleHideInfo;
  document.getElementById("sweeplineLabel").innerHTML = sweepline.toFixed(3);

  createDatasets();
  for (let key in g_datasets) {
    var option = document.createElement("option");
    option.text = key;
    document.getElementById("g_dataset").add(option);
  }

  if (localStorage.g_dataset) {
    document.getElementById("g_dataset").value = localStorage.g_dataset;
  }
  datasetChange(document.getElementById("g_dataset").value);
}

function datasetChange(value) {
  console.log(value);
  localStorage.g_dataset = value;
  clearSurface();

  if (value == 'dataset6') {
    if (g_datasets[value].length == 0) {
      $.get("/data").then(function (json) {
        var polygons = parseInputJSON(json);
        polygons.push(g_boundingBox);
        g_datasets[value] = polygons;
        g_polygons = polygons;
        processNewDataset();
      });
    } else {
      g_polygons = g_datasets[value]; // load the cached data
      processNewDataset();
    }
  } else {
    g_polygons = g_datasets[value];
    processNewDataset();
  }
}

function sortedInsertion(queue, newEvent) {
  var yVal = newEvent.y;
  var idx = _.findIndex(queue, function(event) { return event.y > yVal; });
  // insert the new event in order or on top
  if (idx === -1) {
    queue.push(newEvent);
  } else {
    // PERFORMANCE - optional boost using pop/shift instead
    queue.splice(idx, 0, newEvent);
  }
}

// Create the queue for the current dataset
function createDataQueue(reorder){
  if (!reorder) {
    if (g_queue[localStorage.g_dataset]) return [...g_queue[localStorage.g_dataset]];
  }
  var rslt = [];
  var points = [];
  var segments = [];
  g_polygons.forEach(function(poly) {
    points = points.concat(poly.points);
    segments = segments.concat(poly.segments);
  });
  var sortedPoints = _.sortBy(points, 'y');

  _.forEach(sortedPoints, function(p) {
    var segs = _.remove(segments, function(s) {
      return equal(s.a, p);
    });
    if (!_.isEmpty(segs)) {
      var ss = _.sortBy(segs, function(seg) {
        return seg.b.x;
      });
      _.forEach(ss, function (s) {
        rslt.push(s);
      });
    }
    rslt.push(p);
  });

  // create a clone of the result to access again
  g_queue[localStorage.g_dataset] = [...rslt];
  return rslt;
}

function fortune(reorder) {
  nodeId = 1;
  var queue = createDataQueue(reorder);
  dcel = new DCEL();
  var beachline = new Beachline(dcel);
  closeEventPoints = [];
  if (queue.length < 1) return beachline;
  var nextY = queue[queue.length - 1].y;
  while (queue.length > 0 && nextY > sweepline) {
    var event = queue.pop();
    if (event.isCloseEvent) {
      if (event.live && event.arcNode.closeEvent.live) {
        var destPrev = event.arcNode.prevEdge().dcelEdge.dest;
        var destNext = event.arcNode.nextEdge().dcelEdge.dest;
        // only set if not overridden
        if (!destPrev.overridden) {
          destPrev.point = event.point;
        }
        if (!destNext.overridden) {
          destNext.point = event.point;
        }
        var newEvents = beachline.remove(event.arcNode, event.point, event.y);
        newEvents.forEach(function (ev) {
          if (ev.y < event.y - 0.000001) {
            sortedInsertion(queue, ev);
            if (ev.isCloseEvent) {
              closeEventPoints.push(ev);
            }
          }
        });
        // closeEventPoints.push(e.point);
      }
    } else {
      // Site event
      var newEvents = beachline.add(event);
      newEvents.forEach(function (ev) {
        if (ev.y < event.y - 0.000001) {
          sortedInsertion(queue, ev);
          if (ev.isCloseEvent) {
            closeEventPoints.push(ev);
          }
        }
      });
    }
    if (queue.length > 0)
      nextY = queue[queue.length - 1].y;
  }

  var ev = '';
  while (queue.length > 0) {
    var e = queue.pop();
    var at = "(y)@:" + e.y + " ";
    var data;
    if (e.type == "segment") {
      data = at + 'a(' + e.a.x + ',' + e.a.y + ') - b(' + e.b.x + ',' + e.b.y + ')';
    } else if (e.isCloseEvent) {
      var live = e.live && e.arcNode.closeEvent.live ? "(Live)" : "(Dead)";
      data = at + 'Close:' + e.id + " " + live + ' -point(' + e.point.x + ',' + e.point.y + ')';
    } else {
      data = at + 'point(' + e.x + ',' + e.y + ')';
    }
    if (e.isCloseEvent) {
      ev += data;
    } else {
      ev += data + ' r: ' + e.relation;
    }
    ev += '\n';
  }
  document.getElementById("events").innerHTML = ev;
  return beachline;
}

function render(reorder = false) {
  g_debugObjs = [];
  var t0 = performance.now();
  var beachline = fortune(reorder);
  var t1 = performance.now();

  var t = t1 - t0;
  console.log("Time to process:" + t);

  drawBeachline(beachline, sweepline, showEvents);
  drawCloseEvents(closeEventPoints);
  drawSweepline(sweepline);
  drawSurface(dcel);

  showTree(beachline.root);

  runTests();
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
function mouseclick(e) {
  document.getElementById("mouseX").innerHTML = win2x(e.offsetX);
  document.getElementById("mouseY").innerHTML = win2y(e.offsetY);
}

function toggleFS() {
  fullScreen = !fullScreen;

  if (fullScreen) {
    d3.select(".tree")
      .attr("width", 0)
      .attr("height", 0);

    var w = window.innerWidth - margin.left - margin.right;
    var h = window.innerHeight - margin.top - margin.bottom;

    d3.select("#gvdsvg")
      .attr("width", w)
      .attr("height", h);

    var h2 = window.innerHeight/2;
    var w2 = window.innerWidth/2;
    d3.select("#gvd")
      .attr("transform",
      "translate(" + w2 + "," + h2 + ") scale(" + width/4.0 + "," + -1*height/4.0 + ")");
    document.getElementById("mainView").className = "fullscreen";
  } else {
    d3.select(".tree")
    .attr("width", widthT)
    .attr("height", heightT);

    d3.select("#gvdsvg")
      .attr("width", width)
      .attr("height", height);

    d3.select("#gvd")
      .attr("transform",
      "translate(" + width/2.0 + "," + height/2.0 + ") scale(" + width/2.0 + "," + -1*height/2.0 + ")");
    document.getElementById("mainView").className = "column";
  }
}

function toggleHideInfo() {
  hideInfo = !hideInfo;
  if (hideInfo) {
    document.getElementById("moreInfo").hidden = true;
  } else {
    document.getElementById("moreInfo").hidden = false;
  }
}

function setDebug(msg) {
  document.getElementById("debug").innerHTML = msg;
}
