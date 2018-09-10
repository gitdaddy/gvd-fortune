"use strict";

var blue = vec4(0,0,1,1);
var red = vec4(1,0,0,1);

var sweepline = 0.1;
// var sweepline = -0.79;
// var sweepline = -0.36;

var canvas;
var gl;

var circle;
var sweepLine;
var program;

var mvMatrix;
var pMatrix;

var points = [];
var segments = [];
var vverts = [];
var everts = [];
var dcel;

//------------------------------------------------------------
// Change this function to enable multi-colored arc cells
//------------------------------------------------------------
function siteColor(id) {
  // return vec4(0, 0, 1, 1);
  Math.seedrandom(id);
  var r = Math.random();
  var g = Math.random();
  var b = Math.random();
  return vec4(r, g, b, 1.0);
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
  if (e.shiftKey) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    x = (x / rect.width) * 2.0 - 1.0;
    y = (1.0 - y / rect.height) * 2.0 - 1.0;

    console.log("Adding point " + vec3(x, y, 0));
    points.push(vec3(x, y, 0));
    sortPoints();
    render();
  }
}

function init() {
  if (localStorage.sweepline) {
    sweepline = parseFloat(localStorage.sweepline);
  }

  document.onkeydown = keydown;
  document.onclick = mouseclick;

  canvas = document.getElementById( "gl-canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  document.getElementById("sweeplineLabel").innerHTML = sweepline.toFixed(3);

  gl.viewport( 0, 0, canvas.width, canvas.height );
  // gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
  gl.clearColor( 0.95, 0.95, 0.95, 1.0 );

  circle = new Circle();
  sweepLine = new SweepLine();

  program = new LineProgram();

  points = [
    // vec3(-0.4, 0.8, 0),
    // vec3(-0.4, 0.0, 0),
    vec3(-0.4, 0.8, 0),
    vec3(-0.4, -0.4, 0),
    vec3(0.4, 0.4, 0),
  ];

  segments = [
    makeSegment(points[0], points[1])
  ];

  // points = [
  //   vec3(-0.30, -0.1, 0),
  //   vec3(-0.41, -0.9, 0),
  //   vec3(-0.26, 0.73, 0),
  //   vec3(0.62, 0.37, 0),
  //   vec3(-0.12,0.13, 0),
  //   vec3(0.73,-0.13, 0),
  //   vec3(-0.65, -0.15, 0),
  //   vec3(0.16, -0.79, 0),
  //   vec3(-0.90, -0.92, 0),
  // ];

  // segments = [
  //   // makeSegment(points[0], points[1])
  // ];

  // Math.seedrandom('3');
  // var numRandom = 100;
  // for (var i = 0; i < numRandom; ++i) {
  // 	var p = vec3(Math.random()*2-1, Math.random()*2-1, 0);
  // 	// console.log(p);
  // 	points.push(p);
  // }

  // Give all points and segments a unique ID
  var id = 1;
  points.forEach(function(p) {
    p.id = id++;
  });
  segments.forEach(function(s) {
    s.id = id++;
  });

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
    // if (a.y == b.y) {
    //   throw "Equal events!";
    // }
    return a.y > b.y ? -1 : a.y < b.y ? 1 : 0;
  });
  everts = [];
  while (events.length > 0 && events.peek().y > sweepline) {
    var e = events.pop();
    if (e.isCloseEvent) {
      if (e.live) {
	e.arcNode.prevEdge().dcelEdge.dest.point = e.equi;
	e.arcNode.nextEdge().dcelEdge.dest.point = e.equi;
	var newEvents = beachline.remove(e.arcNode, e.equi);
        newEvents.forEach(function(ev) {
          if (ev.y < e.y - 0.000001) {
	    events.push(ev);
          }
        });
	everts.push(e.equi);
      }
    } else {
      // Site event
      var newEvents = beachline.add(e);
      newEvents.forEach(function(ev) {
        if (ev.y < e.y - 0.000001) {
	  events.push(ev);
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
  // console.log("Call to fortune took " + (t1 - t0) + " milliseconds.")

  gl.clear(gl.COLOR_BUFFER_BIT);

  var eye = vec3(0, 0, 5);
  var at = vec3(0, 0, 0);
  var up = vec3(0, 1, 0);
  mvMatrix = lookAt(eye, at, up);
  pMatrix = ortho(-1, 1, -1, 1, 4, 6);

  points.forEach(function(p) {
    var c = siteColor(p.id);
    circle.render(program, vec3(p[0], p[1], 0), 0.01, true, c);
  });

  sweepLine.render(program, sweepline, vec4(0,0,0,1));

  // Temporary stuff
  if (true) {
    var line = new Line();
    segments.forEach(function(s) {
      var p1 = s[0];
      var p2 = s[1];
      // Render the line
      line.render(program, p1.x, p1.y, p2.x, p2.y);
      // If the sweepline intersects the segment...
      if (sweepline < Math.max(p1.y, p2.y) &&
          sweepline > Math.min(p1.y, p2.y)) {
        var v = new V(s, sweepline);
        // v.thetas.forEach(function(theta) {
        //   var para = createParabola(points[0], sweepline);
        //   var pints = para.intersectRay(v.p, v.vectors[1]);
        //   v.render(program, -1, pints[0].x);
        // });
      }
    });

    var bline = getPointsBisector(points[0], points[2]);
    // line.render_line(program, bline[0], bline[1]);
    var gp = createGeneralParabola(points[2], segments[0]);
    var pints = gp.intersectLine(bline[0], subtract(bline[1], bline[0]));
    gp.renderGeneral(program, pints[0], 1, blue);
    pints.forEach(function(p) {
      circle.render(program, p, 0.01, true, red);
    });
  }
  // /Temporary stuff

  var renderEvents = true;

  beachline.render(program, sweepline, renderEvents);

  var c = vec4(0.0, 0.7, 0.7);
  if (renderEvents) {
    everts.forEach(function(p) {
      circle.render(program, vec3(p.x, p.y, 0), 0.01, false, c);
    });
  }

  renderDcel(program, dcel, vec4(1, 0, 0, 1));

  showTree(beachline.root);

  runTests();

}

