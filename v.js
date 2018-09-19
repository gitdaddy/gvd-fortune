// //------------------------------------------------------------
// // line/parabola intersections
// // The line is given by a ray q(t) = q + tv.
// // Returns t values.
// //------------------------------------------------------------
// function lvIntersect(h, k, p, q, v) {
//   // v = p1 --> p2
//   // var q = p1;
//   // var v = subtract(p2, q);
//   var a = v.x*v.x/(4*p);
//   var b = 2*v.x*(q.x-h)/(4*p) - v.y;
//   var c = (q.x*q.x-2*q.x*h+h*h)/(4*p) + k - q.y;
//   var tvals = quadratic(a, b, c);
//   // console.log("a = " + a);
//   // console.log("b = " + b);
//   // console.log("c = " + c);
//   // console.log("tvals = " + tvals);
//   return tvals;
//   // var ret = [];
//   // tvals.forEach(function(t) {
//   //   if (t >= 0) {
//   //     ret.push(add(p1, mult(v,t)));
//   //   }
//   // });
//   // return ret;
// }

// // Returns intersections ordered by x value
// // h - x offset
// // k - y offset
// // p - scale factor (distance from parabola to sweepline)
// function ppIntersect(h1, k1, p1, h2, k2, p2) {
//   // Check for degenerate parabolas
//   const EPSILON = 0.00000001;
//   if (Math.abs(p1) < EPSILON) {
//     if (Math.abs(p2) < EPSILON) {
//       // Both parabolas have no width
//       return [];
//     }
//     var x = h1;
//     var y = f(x, h2, k2, p2);
//     return [ vec2(x, y), vec2(x, y) ];
//   } else if (Math.abs(p2) < EPSILON) {
//     var x = h2;
//     var y = f(x, h1, k1, p1);
//     return [ vec2(x, y), vec2(x, y) ];
//   }

//   var a = 0.25*(1/p1 - 1/p2);
//   var b = 0.5*(h2/p2 - h1/p1);
//   var c = 0.25*(h1*h1/p1 - h2*h2/p2) + k1 - k2;
//   var disc = b*b - 4*a*c;
//   var xintersections = [];
//   if (a == 0) {
//     // One solution -- no quadratic term
//     xintersections.push(-c/b);
//   } else if (disc < 0) {
//     // No real solutions
//   } else {
//     // One or two solutions.
//     var x1 = (-b + Math.sqrt(disc))/(2*a);
//     var x2 = (-b - Math.sqrt(disc))/(2*a);
//     if (x1 < x2) {
//       xintersections.push(x1);
//       xintersections.push(x2);
//     } else {
//       xintersections.push(x2);
//       xintersections.push(x1);
//     }
//   }
//   // return xintersections;
//   var ret = [];
//   xintersections.forEach(function(x) {
//     var y = f(x, h1, k1, p1);//(x-h1)*(x-h1)/(4*p1) + k1;
//     ret.push(vec2(x, y));
//   });
//   return ret;
// }

//------------------------------------------------------------
// V class
//
// vleft and vright bisect the line and the sweepline.
//
//            line
//      \      |
//       \     |       ___
//        \   /    ___/
//  vleft  \ | ___/ vright
// _________\|/___________
//               sweepline
//------------------------------------------------------------

// line is given as a pair of points through which the line passes.
// The sweepline is assumed to be horizontal and is given as a y-value.
V = function(line, sweepline) {
  var p1 = line[0];
  var p2 = line[1];
  this.p = intersectLines(
    p1, p2, vec3(-100, sweepline, 0), vec3(100, sweepline, 0));
  this.focus = this.p;
  var theta =
    getSegmentsBisector([vec3(-1, sweepline, 0), vec3(1, sweepline, 0)], line);
  // Get the first positive 90 degree sibling to theta
  while (theta > 0) theta -= Math.PI/2;
  while (theta < 0) theta += Math.PI/2;
  this.thetas = [theta + Math.PI/2, theta];
  var vectors = [];
  this.thetas.forEach(function(theta) {
    vectors.push(vec3(Math.cos(theta), Math.sin(theta), 0));
  });
  this.vectors = vectors;
}

// Intersect the V with a parabola.
V.prototype.intersect = function(para) {
  if (para instanceof Parabola) {
    ret = [];
    var p = this.p;
    this.vectors.forEach(function(v) {
      ret = ret.concat(para.intersectRay(p, v));
    });
    return ret;
  }
  throw "V-V intersection not implemented";
  // return ppIntersect(this.h, this.k, this.p, para.h, para.k, para.p);
}

// Intersect the positive portion of the ray.
// If there are two intersections, the intersections will
// be returned in order of t value.
// The ray is given in parametric form p(t) = p + tv
V.prototype.intersectRay = function(p, v) {
  throw "intersectRay not implemented";
  // p = this.transformPoint(p);
  // v = this.transformVector(v);

  // var tvals = lvIntersect(this.h, this.k, this.p, p, v);
  // // Sort tvals in increasing order
  // if (tvals.length == 2 && tvals[1] < tvals[0]) {
  //   tvals = [tvals[1], tvals[0]];
  // }

  // pthis = this;
  // var ret = [];
  // tvals.forEach(function(t) {
  //   if (t >= 0) {
  //     var q = add(p, mult(v,t));
  //     q = pthis.untransformPoint(q);
  //     ret.push(q);
  //   }
  // });
  // return ret;
}

// Intersect all intersections of a line and parabola.
// If there are two intersections, the intersections will
// be returned in order of t value.
// The line is given in parametric form p(t) = p + tv
V.prototype.intersectLine = function(p, v) {
  throw "intersectLine not implemented";
  // p = this.transformPoint(p);
  // v = this.transformVector(v);

  // var tvals = lvIntersect(this.h, this.k, this.p, p, v);
  // // Sort tvals in increasing order
  // if (tvals.length == 2 && tvals[1] < tvals[0]) {
  //   tvals = [tvals[1], tvals[0]];
  // }

  // pthis = this;
  // var ret = [];
  // tvals.forEach(function(t) {
  //   var q = add(p, mult(v,t));
  //   q = pthis.untransformPoint(q);
  //   ret.push(q);
  // });
  // return ret;
}

// y = f(x)
V.prototype.f = function(x) {
  var v;
  if (x < this.p.x) {
    v = this.vectors[0];
  } else {
    v = this.vectors[1];
  }
  return this.p.y + v.y*(x-this.p.x)/v.x;
}

// Inverse of f. x = f_(y)
V.prototype.f_ = function(y) {
  if (y < this.p.y) return [];
  if (y == this.p.y) return [p];
  var ret = []
  this.vectors.forEach(function(v) {
    var x = this.p.x + v.x*(y-this.p.y)/v.y;
    ret.push(x);
  });
  return ret;
}

// There are three cases:
//   1. p < x0 < x1
//   2. x0 < p < x1
//   3. x0 < x1 < p
V.prototype.render = function(program, x0, x1, color=vec4(0,0,1,1),
                             highlight=false) {
  program.use();

  var line = new Line();

  // left
  var v0 = this.vectors[0];
  // right
  var v1 = this.vectors[1];

  if (x0 > x1) throw "x0 > x1 in V render";
  
  var y0 = this.f(x0)
  var y1 = this.f(x1)
  if (x0 < this.p.x && this.p.x < x1) {
    // case 2
    line.render_segment(program, this.p, vec3(x0, y0, 0), color, highlight);
    line.render_segment(program, this.p, vec3(x1, y1, 0), color, highlight);
  } else {
    // cases 1 and 3
    line.render_segment(program, vec3(x0, y0, 0), vec3(x1, y1, 0), color,
                       highlight);
  }
}
