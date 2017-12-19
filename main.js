"use strict";

var directrix = 0.1;

var canvas;
var gl;

// var parabola;
var circle;
var line;
var program;

var mvMatrix;
var pMatrix;

var points = [];
var vverts = [];
var everts = [];
var lines = [];

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
		directrix -= 0.01;
		changed = true;
  } else if (x == 38) {
		// Up arrow
		directrix += 0.01;
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
		render();
	}
}

function mouseclick(e) {
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
	line = new Line();

	program = new LineProgram();

	points = [
		vec3(-0.26, 0.73, 0),
		vec3(-0.59, -0.05, 0),
		vec3(0.62, 0.37, 0),
		vec3(0.16, -0.79, 0),
		vec3(-0.90, -0.92, 0),
		// vec3(0.73,0.05, 0),
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
	var circleEvents = [];
	var beachline = new Beachline2();
	var pointsCopy = points.slice();
	var events = new TinyQueue(pointsCopy, function(a, b) {
		return a.y() > b.y() ? -1 : a.y() < b.y() ? 1 : 0;
	});
	everts = [];
	while (events.length > 0 && events.peek().y() > directrix) {
		var e = events.pop();
		if (e.hasOwnProperty('node')) {
			// Circle event
			beachline.remove(e.node);
		} else {
			// Site event
			var newEvents = beachline.add(e);
			newEvents.forEach(function(ev) {
				events.push(ev);
				everts.push(ev.equi);
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

	line.render(program, directrix, vec4(0,0,0,1));

	var beachline = fortune();
	beachline.render(program, directrix);

	c = vec4(0.0, 0.7, 0.7);
	everts.forEach(function(p) {
		circle.render(program, vec3(p.x(), p.y(), 0), 0.01, false, c);
	});

	// circleEvents.forEach(function(p) {
	// 	circle.render(program, p);
	// });
	// showTree(treeData);
	showTree(beachline.root);

}

