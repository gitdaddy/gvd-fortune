function f(x, h, k, p) {
	return (x-h)*(x-h)/(4*p) + k;
}

// h - x offset
// k - y offset
// p - scale factor (distance from parabola to directrix)
function intersect(h1, k1, p1, h2, k2, p2) {
	// Check for degenerate parabolas
	const EPSILON = 0.00000001;
	if (Math.abs(p1) < EPSILON) {
		if (Math.abs(p2) < EPSILON) {
			// Both parabolas have no width
			return [];
		}
		var x = h1;
		var y = f(x, h2, k2, p2);
		return [ vec2(x, y), vec2(x, y) ];
	} else if (Math.abs(p2) < EPSILON) {
		var x = h2;
		var y = f(x, h1, k1, p1);
		return [ vec2(x, y), vec2(x, y) ];
	}

	var a = 0.25*(1/p1 - 1/p2);
	var b = 0.5*(h2/p2 - h1/p1);
	var c = 0.25*(h1*h1/p1 - h2*h2/p2) + k1 - k2;
	var disc = b*b - 4*a*c;
	var xintersections = [];
	if (a == 0) {
		// One solution -- no quadratic term
		xintersections.push(-c/b);
	} else if (disc < 0) {
		// No real solutions
	} else {
		// One or two solutions.
		var x1 = (-b + Math.sqrt(disc))/(2*a);
		var x2 = (-b - Math.sqrt(disc))/(2*a);
		if (x1 < x2) {
			xintersections.push(x1);
			xintersections.push(x2);
		} else {
			xintersections.push(x2);
			xintersections.push(x1);
		}
	}
	// return xintersections;
	var ret = [];
	xintersections.forEach(function(x) {
		var y = f(x, h1, k1, p1);//(x-h1)*(x-h1)/(4*p1) + k1;
		ret.push(vec2(x, y));
	});
	return ret;
}

// h - x offset
// k - y offset
// p - scale factor
// directrix is at k-p
// focus is at k+p
// start drawing from x0 and stop at x1
// y = (x-h)^2/(4p) + k
Parabola = function(focus, h, k, p) {
	this.focus = focus;
	this.h = h;
	this.k = k;
	this.p = p;
}

// The directrix is assumed to be horizontal and is given as a y-value.
function createParabola(focus, directrix) {
	var h = focus.x();
	var k = (directrix+focus.y())/2;
	var p = (focus.y()-directrix)/2;
	return new Parabola(focus, h, k, p);
}

Parabola.prototype.intersect = function(para) {
	return intersect(this.h, this.k, this.p, para.h, para.k, para.p);
}

Parabola.prototype.f = function(x) {
	return f(x, this.h, this.k, this.p);
}

Parabola.prototype.render = function(program, x0, x1, color=vec4(0,0,1,1)) {
	program.use();

	this.points = []
	for (var x = x0; x < x1; x += 0.01) {
		var y = this.f(x);
		this.points.push(vec4(x, y, 0, 1));
	}
	var y = this.f(x1);
	this.points.push(vec4(x1, y, 0, 1));

  this.pointsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

	// pushMatrix();
	// mvMatrix = mult(mvMatrix, translate(h, k, 0));
	// mvMatrix = mult(mvMatrix, scalem(1, 1/(4*p), 1));
  gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
	// popMatrix();

  gl.uniformMatrix4fv(program.pMatrixLoc, false, flatten(pMatrix));
  gl.uniform4fv(program.colorLoc, flatten(color));

  gl.enableVertexAttribArray(program.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer);
  gl.vertexAttribPointer(program.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.LINE_STRIP, 0, this.points.length);

	gl.deleteBuffer(this.pointsBuffer);
}

