"use strict";

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
var directrix = -0.15;//-0.75;//0.8;

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
	var changed = false;
  if (x == 40) {
		// Down arrow
		directrix -= 0.01;
		console.log("directrix = " + directrix);
		changed = true;
  } else if (x == 38) {
		// Up arrow
		directrix += 0.01;
		console.log("directrix = " + directrix);
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

	console.log("Adding point " + vec2(x, y));
	points.push(vec2(x, y));
	sortPoints();
	render();
}

function sortPoints() {
	points.sort(function(a, b) {
		if (a[1] > b[1]) return -1;
		if (a[1] < b[1]) return 1;
		return 0;
	});
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
		vec2(-0.26166085486097, 0.7282501083050381),
		vec2(-0.5918022688644832, -0.04853266881009186),
		vec2(0.6187162825759516, 0.3677732886626375),
		vec2(0.16004879258276095, -0.7865965217117346),
		vec2(-0.8998955678143981, -0.9169239545442052),
		vec2(0.734375,0.05),
		vec2(0.734375,-0.02734375),
		vec2(-0.12109375,0.1328125),
	];

	sortPoints();

	// for (var i = 0; i < 5; ++i) {
	// 	var p = vec2(Math.random()*2-1, Math.random()*2-1);
	// 	console.log(p);
	// 	points.push(p);
	// }

	points.forEach(function(p) {
		events.push(p);
	});

  render();
}

function fortune() {
	var visited = [];
	vverts = [];
	everts = [];
	lines = [];
	var pointsCopy = points.slice();
	var events = new TinyQueue(pointsCopy, function(a, b) {
		return a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0;
	});
	// points.forEach(function(p) {
	while (events.length > 0) {
		var p = events.pop();
		var beachline = new Beachline();
		// directrix
		var direct = p[1];
		visited.push(p);
		visited.forEach(function(v) {
			var parabola = createParabola(v, direct);
			beachline.update(parabola);
		});
		vverts = vverts.concat(beachline.vertices());
		for (var i = 1; i < beachline.segments.length-1; ++i) {
			var left = vec3(beachline.segments[i-1].parabola.focus);
			var center = vec3(beachline.segments[i].parabola.focus);
			var right = vec3(beachline.segments[i+1].parabola.focus);
			// var equi = equidistant(left, center, right);
			// var r = length(subtract(center, equi));
			// // console.log(equi);
			// if (equi.x() == equi.x() && center.y() > left.y() &&
			// 		center.y() > right.y()) {
			// 	equi.sety(equi.y() - r);
			// 	everts.push(equi);
			// }
			// // var r = length(subtract(left, equi));
		}
	}
}

var render = function() {
	fortune();

  gl.clear(gl.COLOR_BUFFER_BIT);

	var eye = vec3(0, 0, 5);
	var at = vec3(0, 0, 0);
	var up = vec3(0, 1, 0);
  mvMatrix = lookAt(eye, at, up);
  pMatrix = ortho(-1, 1, -1, 1, 4, 6);

	var parabolas = [];
	points.forEach(function(p) {
		if (p[1] >= directrix) {
			var para = createParabola(p, directrix);
			parabolas.push(para);
			para.render(program, -1, 1, vec4(0.9,0.9,0.9,1));
		}
	});

	var beachline = new Beachline();
	parabolas.forEach(function(parabola) {
		beachline.update(parabola);
	});
	beachline.render(program, vec4(1.0, 0.0, 0.0, 1.0));

	points.forEach(function(p) {
		circle.render(program, vec3(p[0], p[1], 0));
	});

	var c = vec4(0.7, 0.0, 0.7);
	// vverts.forEach(function(px) {
	// 	var p = px;//.p;
	// 	circle.render(program, vec3(p[0], p[1], 0), 0.01, false, c);
	// });

	c = vec4(0.0, 0.7, 0.7);
	everts.forEach(function(p) {
		circle.render(program, vec3(p.x(), p.y(), 0), 0.01, false, c);
	});

	line.render(program, directrix, vec4(0,0,0,1));

	// var c1 = vec3(-0.1, 0.5, 0.0);
	// var c2 = vec3(0.5, 0.7, 0.0);
	// var c3 = vec3(-0.2, -0.5, 0.0);
	// var c = vec4(0.7, 0.0, 0.7);
	// circle.render(program, c1, 0.01, false, c);
	// circle.render(program, c2, 0.01, false, c);
	// circle.render(program, c3, 0.01, false, c);

	// var p = equidistant(c1, c2, c3);
	// var r = length(subtract(c1, p));
	// console.log(r);
	// circle.render(program, p, 0.01, false, c);
	// circle.render(program, c1, r, false, c);
	// circle.render(program, c2, r, false, c);
	// circle.render(program, c3, r, false, c);
}

