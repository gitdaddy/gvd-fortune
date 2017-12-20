SweepLine = function() {
	this.points = [ vec4(-1.0, 0.0, 0.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0) ];

  this.pointsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);
}

SweepLine.prototype.render = function(program, y, color=vec4(0,0,1,1)) {
	program.use();

	pushMatrix();
	mvMatrix = mult(mvMatrix, translate(0, y, 0));
  gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
	popMatrix();

  gl.uniformMatrix4fv(program.pMatrixLoc, false, flatten(pMatrix));
  gl.uniform4fv(program.colorLoc, flatten(color));

  gl.enableVertexAttribArray(program.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer);
  gl.vertexAttribPointer(program.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.LINES, 0, this.points.length);
}

