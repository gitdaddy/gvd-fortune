// Circle = function() {
// 	this.points = []
// 	this.points.push(vec4(0, 0, 0, 1));
// 	for (var t = 0; t < 360; t+=1) {
// 		var x = Math.cos(radians(t));
// 		var y = Math.sin(radians(t));
// 		this.points.push(vec4(x, y, 0, 1));
// 	}
// 	this.points.push(this.points[1]);

//   this.pointsBuffer = gl.createBuffer();
//   gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer);
//   gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

// 	this.color = vec4(0, 0, 1, 1);
// }

function renderDcel(program, dcel, color) {
  program.use();

  var points = []

  var iter = dcel.edges;
  var result = iter.next();
  var count = 0;
  while (!result.done) {
    count++;
    var edge = result.value;
    if (edge.origin.point && edge.dest.point) {
      var op = edge.origin.point;
      var dp = edge.dest.point;
      points.push(vec4(op[0], op[1], op[2], 1));
      points.push(vec4(dp[0], dp[1], dp[2], 1));
    }
    result = iter.next();
  }

  if (points.length == 0) return;

  var pointsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(program.pMatrixLoc, false, flatten(pMatrix));
  gl.uniform4fv(program.colorLoc, flatten(color));

  gl.enableVertexAttribArray(program.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
  gl.vertexAttribPointer(program.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.LINES, 0, points.length);

  gl.deleteBuffer(pointsBuffer);
}
