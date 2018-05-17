"use strict";

var blue = vec4(0,0,1,1);
var red = vec4(1,0,0,1);

var directrix = 0.1;
// var directrix = -0.79;
// var directrix = -0.36;

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
  return a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0;
});

var reverseEvents = [];

var matrixStack = [];
function pushMatrix() {
  matrixStack.push(mvMatrix);
}
function popMatrix() {
  mvMatrix = matrixStack.pop();
}

function keydown(event) {
  var x = event.keyCode;
  var key = event.key;
  var changed = false;
  var inc = 0.01;
  if (x == 40 || key == "j" || key == "J") {
    // Down arrow
    if (event.shiftKey) {
      directrix -= 0.001;
    // } else if (event.ctlKey) {
    //   directrix -= 0.1;
    } else {
      directrix -= inc;
    }
    changed = true;
  } else if (x == 38 || key == "k" || key == "K") {
    // Up arrow
    if (event.shiftKey) {
      directrix += 0.001;
    // } else if (event.ctlKey) {
    //   directrix += 0.1;
    } else {
      directrix += inc;
    }
    // directrix += 0.01;
    changed = true;
  } else if (x == 39) {
    // Right arrow
    if (events.length > 0) {
      var p = events.pop();
      reverseEvents.push(p);
      directrix = p[1];
      changed = true;
    }
  } else if (x == 37) {
    // Left arrow
    if (reverseEvents.length > 0) {
      var p = reverseEvents.pop();
      events.push(p);
      directrix = p[1];
      changed = true;
    }
  } else if (key == "d") {
    // Print the directrix value
    console.log("directrix = " + directrix);
  }
  if (changed) {
    // Prevent scroll
    event.preventDefault();

    var t0 = performance.now();
    render();
    var t1 = performance.now();
    console.log("Call to render took " + (t1 - t0) + " milliseconds.")

    document.getElementById("directrixLabel").innerHTML = directrix.toFixed(3);
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

function pointCompare(a, b) {
  if (a[1] > b[1]) return -1;
  if (a[1] < b[1]) return 1;
  return 0;
}

function sortPoints() {
  points.sort(pointCompare);
  // Only keep points with unique y coordinates
  points = points.filter(function(value, index, self) { 
    if (index == 0) return true;
    return value[1] != self[index-1][1];
  });

  for (var i = 0; i < points.length; ++i) {
    points[i].id = (i+1);
  }
}

function init() {
  document.onkeydown = keydown;
  document.onclick = mouseclick;

  canvas = document.getElementById( "gl-canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  document.getElementById("directrixLabel").innerHTML = directrix.toFixed(3);

  gl.viewport( 0, 0, canvas.width, canvas.height );
  // gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
  gl.clearColor( 0.95, 0.95, 0.95, 1.0 );

  circle = new Circle();
  sweepLine = new SweepLine();

  program = new LineProgram();

  points = [
    vec3(-0.4, 0.8, 0),
    // vec3(-0.9, 0.1, 0),
    vec3(-0.4, 0.0, 0),
    vec3(0.4, 0.4, 0),
  ];

  segments = [
    // [vec3(-0.4, 0.8, 0), vec3(-0.4, 0.0, 0)]
    [points[0], points[1]]
    // [points[1], points[0]]
  ];

  // points = [
  //   vec3(-0.26, 0.73, 0),
  //   vec3(0.62, 0.37, 0),
  //   vec3(-0.12,0.13, 0),
  //   vec3(0.73,-0.13, 0),
  //   vec3(-0.65, -0.15, 0),
  //   vec3(0.16, -0.79, 0),
  //   vec3(-0.90, -0.92, 0),
  // ];

  // Math.seedrandom('3');
  // var numRandom = 0;
  // for (var i = 0; i < numRandom; ++i) {
  // 	var p = vec3(Math.random()*2-1, Math.random()*2-1, 0);
  // 	// console.log(p);
  // 	points.push(p);
  // }

  sortPoints();

  points.forEach(function(p) {
    events.push(p);
  });

  render();
}

function fortune() {
  nodeId = 1;
  dcel = new DCEL();
  var beachline = new Beachline();
  var pointsCopy = points.slice();
  var events = new TinyQueue(pointsCopy, function(a, b) {
    // if (a.y == b.y) {
    //   throw "Equal events!";
    // }
    return a.y > b.y ? -1 : a.y < b.y ? 1 : 0;
  });
  everts = [];
  while (events.length > 0 && events.peek().y > directrix) {
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
  console.log("Call to fortune took " + (t1 - t0) + " milliseconds.")

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

  sweepLine.render(program, directrix, vec4(0,0,0,1));

  // Temporary stuff
  var line = new Line();
  segments.forEach(function(s) {
    var p1 = s[0];
    var p2 = s[1];
    // Render the line
    line.render(program, p1.x, p1.y, p2.x, p2.y);
    // If the directrix intersects the segment...
    if (directrix < Math.max(p1.y, p2.y) &&
        directrix > Math.min(p1.y, p2.y)) {
      // p is the intersection between the sweepline and the segment
      var p = intersectLines(
        p1, p2, vec3(-100, directrix, 0), vec3(100, directrix, 0));
      // circle.render(program, p, 0.01, true, red);
      var theta_ =
        getBisector([vec3(-1, directrix, 0), vec3(1, directrix, 0)], s);
      [theta_, theta_+Math.PI/2].forEach(function(theta) {
        line.render_ray(program, p.x, p.y, theta);
        var pp = createParabola(points[0], directrix);
        var v = vec3(Math.cos(theta), Math.sin(theta), 0);
        var pint = pp.intersectSegment([p, add(p,v)]);
        pint.forEach(function(pi) {
          circle.render(program, pi, 0.01, true);
        });
      });
    }
  });
  // /Temporary stuff

  var renderEvents = false;

  beachline.render(program, directrix);

  var c = vec4(0.0, 0.7, 0.7);
  if (renderEvents) {
    everts.forEach(function(p) {
      circle.render(program, vec3(p.x, p.y, 0), 0.01, false, c);
    });
  }

  renderDcel(program, dcel, vec4(1, 0, 0, 1));

  showTree(beachline.root);
}

