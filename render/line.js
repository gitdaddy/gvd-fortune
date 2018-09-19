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

Line = function() {
  this.points = [ vec4(-1.0, 0.0, 0.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0) ];

  this.pointsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);
}

Line.prototype.render = function(program, x1, y1, x2, y2, color=vec4(0,0,1,1),
                                highlight=false) {
  program.use();

  this.points = [ vec4(x1, y1, 0.0, 1.0),
                  vec4(x2, y2, 0.0, 1.0) ];

  pushMatrix();
  // mvMatrix = mult(mvMatrix, rotateZ(theta))
  // mvMatrix = mult(mvMatrix, translate(0, y, 0));
  gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));

  gl.uniformMatrix4fv(program.pMatrixLoc, false, flatten(pMatrix));
  gl.uniform4fv(program.colorLoc, flatten(color));

  gl.enableVertexAttribArray(program.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(this.points));
  gl.vertexAttribPointer(program.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.LINES, 0, this.points.length);

  // highlight
  if (highlight) {
    let d = 0.005;
    mvMatrix = mult(mvMatrix, translate(d, 0, 0));
    gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
    gl.drawArrays(gl.LINES, 0, this.points.length);

    mvMatrix = mult(mvMatrix, translate(-d*2, 0, 0));
    gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
    gl.drawArrays(gl.LINES, 0, this.points.length);

    mvMatrix = mult(mvMatrix, translate(d, d, 0));
    gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
    gl.drawArrays(gl.LINES, 0, this.points.length);

    mvMatrix = mult(mvMatrix, translate(d, -d*2, 0));
    gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
    gl.drawArrays(gl.LINES, 0, this.points.length);

  }
  popMatrix();
}

Line.prototype.render_segment = function(program, p1, p2, color=blue,
                                        highlight=false) {
  // var r = 10;
  // var p = vec4(x,y,0,0);
  // var v = vec4(Math.cos(theta),Math.sin(theta),0,0);
  // var p2 = add(p, mult(v,r));
  this.render(program, p1.x, p1.y, p2.x, p2.y, color, highlight);
}

Line.prototype.render_ray = function(program, x, y, theta, color=blue,
                                    highlight=false) {
  var r = 10;
  var p = vec4(x,y,0,0);
  var v = vec4(Math.cos(theta),Math.sin(theta),0,0);
  var p2 = add(p, mult(v,r));
  this.render(program, x, y, p2.x, p2.y, color, highlight);
}

Line.prototype.render_line = function(program, p, q, color=blue,
                                     highlight=false) {
  var v = normalize(subtract(q, p));
  var p1 = add(p, mult(v, -10));
  var p2 = add(p, mult(v, 10));
  this.render(program, p1.x, p1.y, p2.x, p2.y, color, highlight);
}

