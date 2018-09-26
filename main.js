"use strict";

var blue = vec4(0,0,1,1);
var red = vec4(1,0,0,1);

var sweepline = 0.1;
// var sweepline = -0.79;
// var sweepline = -0.36;

// var canvas;
// var gl;

let datasets;

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

let showEvents = false;

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
  } else if (key == 'e') {
    showEvents = !showEvents;
    d3.selectAll(".close-event")
      .attr('visibility', showEvents ? null : 'hidden');
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

function mouseclick(e) {
  // TODO: replace getting the rect from gl canvas to d3.
  // if (e.shiftKey) {
  //   // var rect = canvas.getBoundingClientRect();
  //   var x = event.clientX - rect.left;
  //   var y = event.clientY - rect.top;
  //   x = (x / rect.width) * 2.0 - 1.0;
  //   y = (1.0 - y / rect.height) * 2.0 - 1.0;

  //   console.log("Adding point " + vec3(x, y, 0));
  //   points.push(vec3(x, y, 0));
  //   sortPoints();
  //   render();
  // }
}

let gvdw = 500;
let gvdh = 500;

let SITE_RADIUS = 8/gvdw;
let SITE_RADIUS_HIGHLIGHT = 11/gvdw;

function x2win(x) {
  let xmin = -1;
  let xmax = 1;
  return (x-xmin)/(xmax-xmin) * gvdw;
}

function y2win(y) {
  let ymin = -1;
  let ymax = 1;
  return (1-(y-ymin)/(ymax-ymin)) * gvdh;
}

function createDatasets() {
  let points1 = [
    vec3(-0.4, 0.8, 0),
    vec3(-0.4, -0.4, 0),
    vec3(0.4,  0.5, 0),
  ];
  let segments1 = [
    makeSegment(points1[0], points1[1])
  ];

  let points2 = [
    // segment test points
    vec3(-0.2, -0.2, 0),
    vec3(-0.2, -0.6, 0),
    vec3(0.2, -0.3, 0),
    // remaining points
    vec3(-0.30, 0.1, 0),
    vec3(-0.41, 0.9, 0),
    vec3(-0.26, 0.73, 0),
    vec3(-0.5, 0.3, 0),
    vec3(-0.12,0.13, 0),
    vec3(0.73,0.15, 0),
    vec3(0.42,0.5, 0),
    vec3(0.49,0.71, 0),
    vec3(0.66,0.66, 0),
  ];
  let segments2 = [
    makeSegment(points2[0], points2[1])
  ];

  let points5 = [
    vec3(-0.26, 0.73, 0),
    vec3(0.62, 0.37, 0),
    vec3(-0.12,0.13, 0),
    vec3(-0.30, -0.1, 0),
    vec3(0.73,-0.13, 0),
    vec3(-0.65, -0.15, 0),
  ];
  let segments5 = [];

  let points3 = [];
  let segments3 = [];
  {
    Math.seedrandom('5');
    let numRandom = 30;
    for (var i = 0; i < numRandom; ++i) {
      var p = vec3(Math.random()*2-1, Math.random()*2-1, 0);
      points3.push(p);
    }
  }

  Math.seedrandom('3');
  let numRandom = 100;
  let points4 = [];
  for (var i = 0; i < numRandom; ++i) {
  	var p = vec3(Math.random()*2-1, Math.random()*2-1, 0);
  	points4.push(p);
  }
  let segments4 = [];

  datasets = {
    'dataset1' : { points:points1, segments:segments1 },
    'dataset2' : { points:points2, segments:segments2 },
    'dataset3' : { points:points3, segments:segments3 },
    'dataset4' : { points:points4, segments:segments4 },
    'dataset5' : { points:points5, segments:segments5 },
  };
}

function init() {
  if (localStorage.sweepline) {
    sweepline = parseFloat(localStorage.sweepline);
  }

  document.onkeydown = keydown;
  document.onclick = mouseclick;

  document.getElementById("sweeplineLabel").innerHTML = sweepline.toFixed(3);

  createDatasets();
  for (let key in datasets) {
    var option = document.createElement("option");
    option.text = key;
    document.getElementById("dataset").add(option);  
  }

  if (localStorage.dataset) {
    document.getElementById("dataset").value = localStorage.dataset;
  }
  datasetChange(document.getElementById("dataset").value);
}

function datasetChange(value) {
  console.log(value);
  localStorage.dataset = value;

  points = datasets[value].points;
  segments = datasets[value].segments;
  // Give all points and segments a unique ID
  var id = 1;
  points.forEach(function(p) {
    p.id = id++;
  });
  segments.forEach(function(s) {
    s.id = id++;
  });

  initDebugCircumcircle();
  drawSites(points, segments);

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
  var segmentsCopy = segments.slice();
  var events = new TinyQueue(pointsCopy.concat(segmentsCopy), function(a, b) {
    return a.y > b.y ? -1 : a.y < b.y ? 1 : 0;
  });
  closeEventPoints = [];
  while (events.length > 0 && events.peek().y > sweepline) {
    var e = events.pop();
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
  return beachline;
}

var render = function() {
  var t0 = performance.now();
  var beachline = fortune();
  var t1 = performance.now();

  // Temporary stuff
  if (segments.length > 0) {
    var bline = bisectPoints(points[0], points[2]);
    var bline2 = bisectPoints(points[1], points[2]);
    var gp = createGeneralParabola(points[2], segments[0]);
    // var pints = gp.intersectLine(bline[0], subtract(bline[1], bline[0]));
    // var pints2 = gp.intersectLine(bline2[0], subtract(bline2[1], bline2[0]));
    var pints = gp.intersectLine(bline);
    var pints2 = gp.intersectLine(bline2);

    // Draw the temp general parabola
    {
      gp.prepDraw(-1, pints[0], pints2[0]);
      let parabolas = [gp];
      let line = d3.line()
        .x(function (d) {return d.x;})
        .y(function (d) {return d.y;})
        .curve(d3.curveLinear)
      ;
      let selection = d3.select("#gvd").selectAll(".gvd-surface-parabola")
        .data(parabolas);
      // exit
      selection.exit().remove();
      // enter
      selection.enter()
        .append("path")
        .attr("d", p => line(p.drawPoints))
        .style("fill","none")
        .attr("class", "gvd-surface-parabola")
        .attr("vector-effect", "non-scaling-stroke")
        .attr("transform", p => p.transform)
      ;
      // update
      selection.attr("d", p => line(p.drawPoints))
        .attr("transform", p => p.transform)
      ;
    }
  } else {
    let selection = d3.select("#gvd").selectAll(".gvd-surface-parabola").remove();
  }
  // /Temporary stuff

  drawBeachline(beachline, sweepline, showEvents);

  // var c = vec4(0.0, 0.7, 0.7);
  // if (showEvents) {
    drawCloseEvents(closeEventPoints);
    // closeEventPoints.forEach(function(p) {
    //   // circle.render(program, vec3(p.x, p.y, 0), 0.01, false, c);
    // });
  // }

  drawSweepline(sweepline);
  drawSurface(dcel);

  showTree(beachline.root);

  runTests();
}

function setDebug(msg) {
  document.getElementById("debug").innerHTML = msg;
}

