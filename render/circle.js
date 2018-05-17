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
