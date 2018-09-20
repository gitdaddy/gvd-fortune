// Given a parabola (h, k, p), computes the y value at a given
// x value.
function f(x, h, k, p) {
  return (x-h)*(x-h)/(4*p) + k;
}

// Computes the inverse of f
function f_(y, h, k, p) {
  return quadratic(1/(4*p), -2*h/(4*p), h*h/(4*p)+k-y);
}

//------------------------------------------------------------
// line/parabola intersections
// The line is given by a ray q(t) = q + tv.
// Returns t values.
//------------------------------------------------------------
function lpIntersect(h, k, p, q, v) {
  // v = p1 --> p2
  // var q = p1;
  // var v = subtract(p2, q);
  var a = v.x*v.x/(4*p);
  var b = 2*v.x*(q.x-h)/(4*p) - v.y;
  var c = (q.x*q.x-2*q.x*h+h*h)/(4*p) + k - q.y;
  var tvals = quadratic(a, b, c);
  // console.log("a = " + a);
  // console.log("b = " + b);
  // console.log("c = " + c);
  // console.log("tvals = " + tvals);
  return tvals;
  // var ret = [];
  // tvals.forEach(function(t) {
  //   if (t >= 0) {
  //     ret.push(add(p1, mult(v,t)));
  //   }
  // });
  // return ret;
}

// Returns intersections ordered by x value
// h - x offset
// k - y offset
// p - scale factor (distance from parabola to directrix)
function ppIntersect(h1, k1, p1, h2, k2, p2) {
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

//------------------------------------------------------------
// Parabola class
//------------------------------------------------------------

// h - x offset
// k - y offset
// p - scale factor
// directrix is at k-p
// focus is at k+p
// start drawing from x0 and stop at x1
// y = (x-h)^2/(4p) + k
Parabola = function(focus, h, k, p, theta, offset) {
  this.focus = focus;
  this.h = h;
  this.k = k;
  this.p = p;
  this.theta = theta;
  this.offset = offset;
  this.Rz = rotateZ(degrees(-this.theta));
  this.nRz = rotateZ(degrees(this.theta));
}

// The directrix is assumed to be horizontal and is given as a y-value.
function createParabola(focus, directrix) {
  var h = focus.x;
  var k = (directrix+focus.y)/2;
  var p = (focus.y-directrix)/2;
  return new Parabola(focus, h, k, p, 0, 0);
}

// The directrix is a general line given as an array of two points
// on the line.
function createGeneralParabola(focus, directrix) {
  var a = directrix[0];
  var b = directrix[1];
  // Make sure a and b are ordered such that the focus is located
  // on the left of b-a.
  var v = normalize(subtract(b, a));
  var vxf = cross(v, subtract(focus,a));
  if (vxf.z < 0) {
    v = negate(v);
    [a, b] = [b, a];
    vxf.z = -vxf.z;
  }
  var k = length(vxf) / 2.0;
  var p = k;
  var h = focus.x;
  var theta = Math.atan2(v.y, v.x);
  return new Parabola(focus, h, k, p, theta, 0);
}

Parabola.prototype.intersect = function(para) {
  if (para instanceof Parabola) {
    return ppIntersect(this.h, this.k, this.p, para.h, para.k, para.p);
  }
  return para.intersect(this);
}

Parabola.prototype.transformPoint = function(p) {
  if (this.theta == 0) return p;

  // Don't remove this code. It explains what we're doing below.
  // var M = translate(this.h, 2*this.k, 0);
  // M = mult(M, rotateZ(degrees(-this.theta)));
  // M = mult(M, translate(-this.focus.x, -this.focus.y, 0));
  // p = mult(M, vec4(p));

  // translate, rotate, translate manually for performance.
  // console.log("p="+p);
  // var pp = vec4(p);
  // console.log("pp="+pp);
  // console.log("pp1="+p);
  p = vec4(p);
  // console.log("pp2="+p);
  p.x += -this.focus.x;
  p.y += -this.focus.y;
  // console.log("p="+p);
  p = mult(this.Rz, p);
  p.x += this.h;
  p.y += 2*this.k;
  return p;
}

Parabola.prototype.transformVector = function(v) {
  if (this.theta == 0) return v;

  v = mult(this.Rz, vec4(v));
  // Not sure why w is getting set to 1.
  v.w = 0;
  return v;
}

Parabola.prototype.untransformPoint = function(p) {
  if (this.theta == 0) return p;

  // translate, rotate, translate manually for performance
  p = vec4(p);
  p.x += -this.h;
  p.y += -2*this.k;
  p = mult(this.nRz, p);
  p.x += this.focus.x;
  p.y += this.focus.y;
  return p;
}

// Intersect the positive portion of the ray.
// If there are two intersections, the intersections will
// be returned in order of t value.
// The ray is given in parametric form p(t) = p + tv
Parabola.prototype.intersectRay = function(p, v) {
  p = this.transformPoint(p);
  v = this.transformVector(v);

  var tvals = lpIntersect(this.h, this.k, this.p, p, v);
  // Sort tvals in increasing order
  if (tvals.length == 2 && tvals[1] < tvals[0]) {
    tvals = [tvals[1], tvals[0]];
  }

  pthis = this;
  var ret = [];
  tvals.forEach(function(t) {
    if (t >= 0) {
      var q = add(p, mult(v,t));
      q = pthis.untransformPoint(q);
      ret.push(q);
    }
  });
  return ret;
}

// Intersect all intersections of a line and parabola.
// If there are two intersections, the intersections will
// be returned in order of t value.
// The line is given in parametric form p(t) = p + tv
Parabola.prototype.intersectLine = function(p, v) {
  p = this.transformPoint(p);
  v = this.transformVector(v);

  var tvals = lpIntersect(this.h, this.k, this.p, p, v);
  // Sort tvals in increasing order
  if (tvals.length == 2 && tvals[1] < tvals[0]) {
    tvals = [tvals[1], tvals[0]];
  }

  pthis = this;
  var ret = [];
  tvals.forEach(function(t) {
    var q = add(p, mult(v,t));
    q = pthis.untransformPoint(q);
    ret.push(q);
  });
  return ret;
}

// y = f(x)
Parabola.prototype.f = function(x) {
  return f(x, this.h, this.k, this.p);
}

// Inverse of f. x = f_(y)
Parabola.prototype.f_ = function(y) {
  return f_(y, this.h, this.k, this.p);
}

var paraPointsBuffer = null;
var numParaPoints = 20;
var paraPoints = new Array(numParaPoints);

function abc() {
  return 130;
}

Parabola.prototype.renderSvg = function(id, highlight=false) {
  let line = d3.line()
    .x(function (d) {return d.x;})
    .y(function (d) {return d.y;})
    // .curve(d3.curveLinear)
    .curve(d3.curveCardinal)
  ;
  // let data = [];
  // let xinc = 0.1;
  // for (var x = x0; x < x1; x += xinc) {
  //   data.push({x:x, y:this.f(x)});
  // }
  // data.push({x:x1, y:this.f(x1)});
  let pa = d3.select("#gvd")
  // let pa = d3.selectAll(".beach-parabola")
    .append("path")
    // .datum(data)
    .datum(this.drawPoints)
    .attr("d", line)
    .style("fill","none")
    .style("stroke", siteColorSvg(id))
    .attr("class", "beach-parabola")
    .attr("vector-effect", "non-scaling-stroke")
  ;
}

Parabola.prototype.renderImpl = function(program, x0, x1, id, color=vec4(0,0,1,1), highlight=false) {
  program.use();

  // Construct line segments
  var inc = (x1-x0) / numParaPoints;
  for (var i = 0; i < numParaPoints-1; ++i) {
    var x = x0 + i * inc;
    var y = this.f(x);
    paraPoints[i] = vec4(x, y, 0, 1);
  }
  var y = this.f(x1);
  paraPoints[numParaPoints-1] = vec4(x1, y, 0, 1);

  if (paraPointsBuffer == null) {
    paraPointsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, paraPointsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(paraPoints), gl.STATIC_DRAW);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, paraPointsBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(paraPoints));

  pushMatrix();
  if (this.theta != 0) {
    mvMatrix = mult(mvMatrix, translate(this.focus.x, this.focus.y, 0));
    mvMatrix = mult(mvMatrix, this.nRz);
    mvMatrix = mult(mvMatrix, translate(-this.h, -2*this.k, 0));
  }
  gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));

  gl.uniformMatrix4fv(program.pMatrixLoc, false, flatten(pMatrix));
  gl.uniform4fv(program.colorLoc, flatten(color));

  gl.enableVertexAttribArray(program.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, paraPointsBuffer);
  gl.vertexAttribPointer(program.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.LINE_STRIP, 0, paraPoints.length);

  // highlight
  if (highlight) {
    let d = 0.005;
    mvMatrix = mult(mvMatrix, translate(d, 0, 0));
    gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
    gl.drawArrays(gl.LINE_STRIP, 0, paraPoints.length);

    mvMatrix = mult(mvMatrix, translate(-d*2, 0, 0));
    gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
    gl.drawArrays(gl.LINE_STRIP, 0, paraPoints.length);

    mvMatrix = mult(mvMatrix, translate(d, d, 0));
    gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
    gl.drawArrays(gl.LINE_STRIP, 0, paraPoints.length);

    mvMatrix = mult(mvMatrix, translate(d, -d*2, 0));
    gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));
    gl.drawArrays(gl.LINE_STRIP, 0, paraPoints.length);

  }
  popMatrix();

  if (highlight) {
    this.render(program, -1, 1, id, color, false);
  }
}

Parabola.prototype.render = function(program, x0, x1, id, color=vec4(0,0,1,1), highlight = false) {
  // // SVG
  // this.setDrawBounds(x0, x1);
  // this.setDrawPoints();
  // this.id = id;

  program.use();

  if (x0 > 1 || x1 < -1) return;

  // Optimize the boundaries for a smooth draw
  x0 = Math.max(x0, -1);
  x1 = Math.min(x1, 1);
  if (this.f(x0) > 1) {
    var xvalues = this.f_(1);
    if (xvalues.length > 0) {
      x0 = xvalues.reduce(function(a, b) {
        return Math.max(x0, Math.min(a, b));
      });
      // console.log("changing x0 to " + x0);
    }
  }
  if (this.f(x1) > 1) {
    var xvalues = this.f_(1);
    if (xvalues.length > 0) {
      x1 = xvalues.reduce(function(a, b) {
        return Math.min(x1, Math.max(a, b));
      });
      // console.log("changing x1 to " + x1);
    }
  }

  this.renderImpl(program, x0, x1, id, color, highlight);

  // SVG
  // this.renderSvg(id);
}

Parabola.prototype.renderGeneral = function(
  program, p1, p2, id, color=vec4(0,0,1,1), highlight = false) {

  program.use();

  var x0 = this.transformPoint(p1).x;
  var x1 = 2;

  this.renderImpl(program, x0, x1, id, color, highlight);
}

// Prepares this parabola for drawing
Parabola.prototype.prepDraw = function(id, x0, x1) {
  this.id = id;
  this.setDrawBounds(x0, x1);
  this.setDrawPoints();
}

// Set the minx and maxx for drawing the parabola optimally.
// Starting x0 and x1 values are given, which represent the
// parabola's intersection with its left and right neighbors,
// respectively. These values are updated to cut off the
// parabola if it goes above 1 in y. x0 and x1 will be properties
// of the parabola.
//
// Initial:
//
//  x0
//   \
//    \
//    _\____________________________
//   |  \                           |
//   |   \                          | x1
//   |    \                        /|
//   |     \_                    _/ |
//   |       \__              __/   |
//   |          \___      ___/      |
//   |              \____/          |
//   |                              |
//   |                              |
//   |______________________________|
//
// Update to:
//
//  
//   
//    x0
//    ______________________________
//   |  \                           |
//   |   \                          | x1
//   |    \                        /|
//   |     \_                    _/ |
//   |       \__              __/   |
//   |          \___      ___/      |
//   |              \____/          |
//   |                              |
//   |                              |
//   |______________________________|
Parabola.prototype.setDrawBounds = function(x0, x1) {
  if (x0 > 1 || x1 < -1) {
    this.x0 = -1;
    this.x1 = -1;
  } else {
    // Optimize the boundaries for a smooth draw
    x0 = Math.max(x0, -1);
    x1 = Math.min(x1, 1);
    if (this.f(x0) > 1) {
      var xvalues = this.f_(1);
      if (xvalues.length > 0) {
        x0 = xvalues.reduce(function(a, b) {
          return Math.max(x0, Math.min(a, b));
        });
      }
    }
    if (this.f(x1) > 1) {
      var xvalues = this.f_(1);
      if (xvalues.length > 0) {
        x1 = xvalues.reduce(function(a, b) {
          return Math.min(x1, Math.max(a, b));
        });
      }
    }
    this.x0 = x0;
    this.x1 = x1;
  }
}

// Prepares the parabola for drawing by setting the points
// a linear curve can be interpolated against. After this
// function is called, this.drawPoints will be an array
// containing the points shown by *:
//
//    x0
//    ______________________________
//   |  *                           |
//   |   \                          * x1
//   |    \                        /|
//   |     *_                    _* |
//   |       \__              __/   |
//   |          *___      ___*      |
//   |              *___*          |
//   |                              |
//   |                              |
//   |______________________________|
Parabola.prototype.setDrawPoints = function() {
  let points = [];
  // Hard-coded delta x
  let xinc = 0.01;
  for (var x = this.x0; x < this.x1; x += xinc) {
    points.push({x:x, y:this.f(x)});
  }
  points.push({x:this.x1, y:this.f(this.x1)});
  this.drawPoints = points;
}

