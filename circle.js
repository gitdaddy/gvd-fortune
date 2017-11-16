Circle = function() {
	this.points = []
	this.points.push(vec4(0, 0, 0, 1));
	for (var t = 0; t < 360; t+=1) {
		var x = Math.cos(radians(t));
		var y = Math.sin(radians(t));
		this.points.push(vec4(x, y, 0, 1));
	}
	this.points.push(this.points[1]);

  this.pointsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

	this.color = vec4(0, 0, 1, 1);
}

Circle.prototype.render = function(program, p, r = 0.01, filled = true, color = this.color) {
	program.use();

	s = r;

	pushMatrix();
	mvMatrix = mult(mvMatrix, translate(p[0], p[1], p[2]));
	mvMatrix = mult(mvMatrix, scalem(s, s, s));
  gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
	popMatrix();

  gl.uniformMatrix4fv(program.pMatrixLoc, false, flatten(pMatrix));
  gl.uniform4fv(program.colorLoc, flatten(color));

  gl.enableVertexAttribArray(program.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer);
  gl.vertexAttribPointer(program.vertexLoc, 4, gl.FLOAT, false, 0, 0);

	if (filled) {
		gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);
	} else {
		gl.drawArrays(gl.LINE_STRIP, 1, this.points.length-1);
	}
}

// function equidistant(c1, c2, c3) {
// 	var p0 = add(c2, mult(0.5, subtract(c1, c2)));
// 	var v = normalize(subtract(c1, c2));
// 	var x = -v[1];
// 	var y = v[0];
// 	v = vec3(x, y, 0);
// 	var a = dot(v, v);

// 	// var sum = add(c1, add(c2, c3));
// 	// var b = (2/3)*dot(subtract(mult(3,p0), sum), v);
// 	var b1 = dot(subtract(p0, c1), v);
// 	var b2 = dot(subtract(p0, c2), v);
// 	var b3 = dot(subtract(p0, c3), v);
// 	// var b3 = dot(subtract(c3, p0), v);
// 	// var b = (2/3)*(b1+b2+b3);
// 	console.log("b3 = " + b3);
// 	var b = (2/3)*b3;

// 	var n1 = dot(subtract(p0, c1), subtract(p0, c1));
// 	var n2 = dot(subtract(p0, c2), subtract(p0, c2));
// 	var n3 = dot(subtract(p0, c3), subtract(p0, c3));
// 	var c = (1/3) * (n1 + n2 + n3);
// 	var disc = b*b-4*a*c;
// 	console.log("a = " + a + " b2 = " + (b*b) + " c = " + c + " disc = " + disc);
// 	console.log("p0 = " + p0 + " v = " + v);
// 	var rsq = (-b + Math.sqrt(disc)) / (2*a);
// 	return Math.sqrt(rsq);
// }
function equidistant(c1, c2, c3) {
	var u = mult(0.5, subtract(c1, c2));
	var p0 = add(c2, u);
	var v = normalize(vec3(-u[1], u[0], 0));
	// return add(p0, v);
	var a = dot(u, u);
	var p0p3 = subtract(p0, c3);
	var t = (-dot(p0p3, p0p3) + a) / (2 * dot(p0p3, v));
	console.log("p0p3 = " + p0p3 + " a = " + a + " t = " + t);
	return add(p0, mult(t, v));
}
