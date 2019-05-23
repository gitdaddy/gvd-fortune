"use strict";

var sweepline = 0.1;

let g_datasets = {};
let g_polygons = [];

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

  //------------------------------
  // Check for identical y values.
  //------------------------------
  var yvalues = [];
  points.forEach(function (p) {
    yvalues.push(p.y);
  });
  yvalues.sort();
  for (var i = 1; i < yvalues.length; ++i) {
    if (yvalues[i] == yvalues[i - 1]) {
      console.log("WARNING: sites with identical y values of " + yvalues[i]);
    }
  }

  //------------------------------
  // Check for identical x values.
  //------------------------------
  var xvalues = [];
  points.forEach(function (p) {
    xvalues.push(p.x);
  });
  xvalues.sort();
  for (var i = 1; i < xvalues.length; ++i) {
    if (xvalues[i] == xvalues[i - 1]) {
      console.log("WARNING: sites with identical x values of " + xvalues[i]);
    }
  }

  events = [];
  // Add points as events
  points.forEach(function (p) {
    events.push(p);
  });
  // Add segments as events
  segments.forEach(function (s) {
    events.push(s);
  });
  render();
}

var events = new TinyQueue([], function (a, b) {
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
      incSweepline(-inc * 0.1);
    } else if (event.ctrlKey) {
      incSweepline(-inc * 10);
    } else {
      incSweepline(-inc);
    }
    changed = true;
  } else if (x == 38 || key == "k" || key == "K") {
    // Up arrow
    if (event.shiftKey) {
      incSweepline(inc * 0.1);
    } else if (event.ctrlKey) {
      incSweepline(inc * 10);
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

let SITE_RADIUS = 0.01;

let SITE_RADIUS_HIGHLIGHT = 11 / width;

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

  if (value == 'dataset6') {
    if (g_datasets[value].length == 0) {
      $.get("/data").then(function (json) {
        var polygons = parseInputJSON(json);
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

function fortune() {
  nodeId = 1;
  var points = [];
  var segments = [];
  g_polygons.forEach(function(poly) {
    points = points.concat(poly.points);
    segments = segments.concat(poly.segments);
  });
  dcel = new DCEL();
  var beachline = new Beachline(dcel);
  var pointsCopy = points.slice();
  _.forEach(segments, function (seg) { seg.ordered = false; });
  var segmentsCopy = segments.slice();
  var events = new TinyQueue(pointsCopy.concat(segmentsCopy), function (a, b) {
    return a.y > b.y ? -1 : a.y < b.y ? 1 : 0;
  });
  closeEventPoints = [];
  while (events.length > 0 && events.peek().y > sweepline) {
    var e = events.pop();
    /* process segment end points first before the segments
     Example    * A      In the Queue order: BCA
              /  \       Processing order ABC
          B  /    \ C
     */
    while (e.type == "segment" && !e.ordered) {
      e.ordered = true;
      events.push(e);
      e = events.pop();
    }
    if (e.isCloseEvent) {
      if (e.live && e.arcNode.closeEvent.live) {
        var destPrev = e.arcNode.prevEdge().dcelEdge.dest;
        var destNext = e.arcNode.nextEdge().dcelEdge.dest;
        // only set if not overridden
        if (!destPrev.overridden) {
          destPrev.point = e.point;
        }
        if (!destNext.overridden) {
          destNext.point = e.point;
        }
        var newEvents = beachline.remove(e.arcNode, e.point, e.y);
        newEvents.forEach(function (ev) {
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
      newEvents.forEach(function (ev) {
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
    if (e.isCloseEvent) {
      ev += e.y + ' - close node id:' + e.arcNode.id + ' : ';
    } else {
      ev += e.y + " r: " + e.relation + ' : ';
    }
  }
  document.getElementById("events").innerHTML = ev;
  return beachline;
}

function render() {
  g_debugObjs = [];
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

// TODO fix
function onSiteDrag() {
  var segments = [];
  g_polygons.forEach(function(poly) {
    segments = segments.concat(poly.segments);
  });
  drawSegments(segments);
  render();
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
      "translate(" + w2 + "," + h2 + ") scale(" + width/2.0 + "," + -1*height/2.0 + ")");
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
