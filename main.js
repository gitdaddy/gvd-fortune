"use strict";

// var directrix = 0.1;
var directrix = -0.79;

var canvas;
var gl;

// var parabola;
var circle;
var sweepLine;
var program;

var mvMatrix;
var pMatrix;

var points = [];
var vverts = [];
var everts = [];
var lines = [];
var dcel;

var events = new TinyQueue([], function(a, b) {
  return a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0;
});

// var reverseEvents = new TinyQueue([], function(a, b) {
//   return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
// 	});
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
  if (x == 40) {
    // Down arrow
    if (event.shiftKey) {
      directrix -= 0.001;
    } else {
      directrix -= 0.01;
    }
    changed = true;
  } else if (x == 38) {
    // Up arrow
    if (event.shiftKey) {
      directrix += 0.001;
    } else {
      directrix += 0.01;
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
    render();
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
  // points.sort(function(a, b) {
  // });
  points.sort(pointCompare);
  // Only keep points with unique y coordinates
  points = points.filter(function(value, index, self) { 
    if (index == 0) return true;
    return value[1] != self[index-1][1];
    // return self.indexOf(value) === index;
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

  gl.viewport( 0, 0, canvas.width, canvas.height );
  // gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
  gl.clearColor( 0.95, 0.95, 0.95, 1.0 );

  // parabola = new Parabola();
  circle = new Circle();
  sweepLine = new SweepLine();

  program = new LineProgram();

  points = [
    vec3(-0.26, 0.73, 0),
    vec3(-0.59, -0.05, 0),
    vec3(0.62, 0.37, 0),
    vec3(0.16, -0.79, 0),
    vec3(-0.90, -0.92, 0),
    vec3(0.73,-0.03, 0),
    vec3(-0.12,0.13, 0),
  ];

  sortPoints();

  // for (var i = 0; i < 5; ++i) {
  // 	var p = vec3(Math.random()*2-1, Math.random()*2-1, 0);
  // 	console.log(p);
  // 	points.push(p);
  // }

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
    return a.y() > b.y() ? -1 : a.y() < b.y() ? 1 : 0;
  });
  everts = [];
  lines = [];
  while (events.length > 0 && events.peek().y() > directrix) {
    var e = events.pop();
    if (e.isCloseEvent) {
      if (e.live) {
	e.arcNode.prevEdge().dcelEdge.dest.point = e.equi;
	e.arcNode.nextEdge().dcelEdge.dest.point = e.equi;
	beachline.remove(e.arcNode, e.equi);
	everts.push(e.equi);
      } else {
	console.log("canceled");
      }
    } else {
      // Site event
      var newEvents = beachline.add(e);
      newEvents.forEach(function(ev) {
	events.push(ev);
      });
    }
  }
  return beachline;
}

var render = function() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  var eye = vec3(0, 0, 5);
  var at = vec3(0, 0, 0);
  var up = vec3(0, 1, 0);
  mvMatrix = lookAt(eye, at, up);
  pMatrix = ortho(-1, 1, -1, 1, 4, 6);

  var parabolas = [];
  // points.forEach(function(p) {
  // 	if (p[1] >= directrix) {
  // 		var para = createParabola(p, directrix);
  // 		parabolas.push(para);
  // 		para.render(program, -1, 1, vec4(0.9,0.9,0.9,1));
  // 	}
  // });

  // Get only parabolas participating in the beachline.
  parabolas = [];
  // console.log("Directrix = " + directrix);
  // fortune(directrix).forEach(function(p) {
  // 	// console.log("Adding " + p);
  // 	var para = createParabola(p, directrix);
  // 	parabolas.push(para);
  // 	para.render(program, -1, 1, vec4(0.9,0.9,0.9,1));
  // });

  points.forEach(function(p) {
    circle.render(program, vec3(p[0], p[1], 0));
  });

  var c = vec4(0.7, 0.0, 0.7);
  // vverts.forEach(function(px) {
  // 	var p = px;//.p;
  // 	circle.render(program, vec3(p[0], p[1], 0), 0.01, false, c);
  // });

  sweepLine.render(program, directrix, vec4(0,0,0,1));

  var beachline = fortune();
  beachline.render(program, directrix);

  // lines.forEach(function(l) {
  // 	sweepLine.render(program, )
  // });

  c = vec4(0.0, 0.7, 0.7);
  everts.forEach(function(p) {
    circle.render(program, vec3(p.x(), p.y(), 0), 0.01, false, c);
  });

  // circleEvents.forEach(function(p) {
  // 	circle.render(program, p);
  // });

  showTree(beachline.root);

  // var DCEL = require("../lib/dcel").DCEL;

  // var e0 = dcel.makeEdge();
  // var e1 = dcel.makeEdge();
  // var e2 = dcel.makeEdge();
  // e0.name = "0";
  // e1.name = "1";
  // e2.name = "2";
  // e0.origin.point = vec3(0,0,0);
  // e1.origin.point = vec3(0.4,0,0);
  // e2.origin.point = vec3(0.4,0.4,0);

  // dcel.splice(e2, e0.lnext);
  // dcel.splice(e2.sym, e1);
  // dcel.splice(e2, e2.sym.lnext);
  // dcel.splice(e2.sym, e2.lnext);

  // console.log(e0.origin.point);
  // console.log(e0.dest.point);
  // console.log(e2.origin.point);
  // console.log(e2.dest.point);

  // var e0 = dcel.makeEdge();
  // var e1 = dcel.addEdgeVertex(e0);
  // var e2 = dcel.addEdgeVertex(e1);
  // var e3 = dcel.connect(e2, e0);
  // e0.name = "0";
  // e1.name = "1";
  // e2.name = "2";
  // e2.name = "3";
  // e0.origin.point = vec3(0,0,0);
  // e1.origin.point = vec3(0.4,0,0);
  // e2.origin.point = vec3(0.4,0.4,0);
  // e3.origin.point = vec3(0,0.4,0);

  // e0.left.name = "left face";
  // e0.right.name = "right face";

  // console.log(e0.origin.point);
  // console.log(e0.dest.point);
  // console.log(e1.origin.point);
  // console.log(e1.dest.point);
  // console.log(e2.origin.point);
  // console.log(e2.dest.point);
  // console.log(e2.left.name);
  // console.log(e3.origin.point);
  // console.log(e3.dest.point);
  // console.log(e3.left.name);

  // console.log(e3.sym.dest.point);
  // console.log(e3.sym.left.name);
  // console.log(e3.sym.right.name);

  // var iter = dcel.edges;
  // var count = 0;
  // var result = iter.next();
  // while (!result.done) {
  // 	count++;
  // 	result = iter.next();
  // }
  // console.log(count);

  renderDcel(program, dcel, vec4(1, 0, 0, 1));
  
  // lines.forEach(function(l) {
  // });
  

  // console.log(e0);

  // var length = 10;
  // var es = new Array(length);
  // for (var index = 0; index < length; index += 1) {
  //   es[index] = dcel.makeEdge();
  // }

  // console.log(es[0]);

  // var eiterator = dcel.edges;
  // var viterator = dcel.vertices;
  // var eresult = eiterator.next();
  // for (var index = 0; index < length; index += 1) {
  // 	// eresult.done == false
  // 	// eresult.value == es[index]
  //   eresult = eiterator.next();
  // }
  // // eresult.done == true
}

