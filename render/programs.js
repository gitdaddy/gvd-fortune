var LineProgram = function() {
  this.program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(this.program);
	this.use();

  this.vertexLoc = gl.getAttribLocation(this.program, "vPosition");
  // this.colorLoc = gl.getAttribLocation(this.program, "vColor");

  this.mvMatrixLoc = gl.getUniformLocation(this.program, "mvMatrix");
  this.pMatrixLoc = gl.getUniformLocation(this.program, "pMatrix");
  this.colorLoc = gl.getUniformLocation(this.program, "color");
}

LineProgram.prototype.use = function() {
	gl.useProgram(this.program);
}
