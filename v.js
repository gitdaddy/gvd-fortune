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
  this.miny = sweepline;
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

// Prepares this v for drawing
// There are three cases:
//   1. p < x0 < x1
//   2. x0 < p < x1
//   3. x0 < x1 < p
V.prototype.prepDraw = function(nodeid, siteid, x0, x1) {
  this.nodeid = nodeid;
  this.siteid = siteid;
  this.drawPoints = [];

  if (x0 > x1) {
    throw `x0 > x1 in V render: ${x0}, ${x1}`;
    // this.drawPoints = [vec2(0,0), vec2(0,0)];
    // return;
  }
  
  var y0 = this.f(x0)
  var y1 = this.f(x1)
  if (x0 < this.p.x && this.p.x < x1) {
    // case 2
    this.drawPoints.push({x:x0, y:y0});
    this.drawPoints.push({x:this.p.x, y:this.p.y});
    this.drawPoints.push({x:x1, y:y1});
  } else {
    // cases 1 and 3
    this.drawPoints.push({x:x0, y:y0});
    this.drawPoints.push({x:x1, y:y1});
  }
}

