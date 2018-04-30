// Given a parabola (h, k, p), computes the y value at a given
// x value.
function f(x, h, k, p) {
  return (x-h)*(x-h)/(4*p) + k;
}

// Returns intersections ordered by x value
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

//   \             /
//    \     *     /
//     \  left   /
//      \       /           /
//       --__--x    *      /
//              \ right   /
//               \       /
//                --__--
//
// ------------------------------------- directrix
//
//
//   \             /
//    \     *     /
//     \  left   /
//      \       /
//      x--__--
//      |  *  |
//      |right|
//       \___/ 
// ------------------------------------- directrix
//
//
//   \             /
//    \     *     /
//     \  right  /
//      \       /
//       --__-x
//      |  *  |
//      |left |
//       \___/ 
// ------------------------------------- directrix
function siteSiteDirectrixIntersection(left, right, directrix) {
  var pleft = createParabola(left, directrix);
  var pright = createParabola(right, directrix);
  return pleft.intersect(pright)[0];
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

var paraPointsBuffer = null;
var numParaPoints = 20;
var paraPoints = new Array(numParaPoints);

Parabola.prototype.render = function(program, x0, x1, color=vec4(0,0,1,1)) {
  program.use();

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

  gl.uniformMatrix4fv(program.mvMatrixLoc, false, flatten(mvMatrix));

  gl.uniformMatrix4fv(program.pMatrixLoc, false, flatten(pMatrix));
  gl.uniform4fv(program.colorLoc, flatten(color));

  gl.enableVertexAttribArray(program.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, paraPointsBuffer);
  gl.vertexAttribPointer(program.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.LINE_STRIP, 0, paraPoints.length);

  // gl.deleteBuffer(paraPointsBuffer);
}

