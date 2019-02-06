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
var tolerance = 0.0001;
// line is given as a pair of points through which the line passes.
// The sweepline is assumed to be horizontal and is given as a y-value.
V = function(line, sweepline) {
  var ret = _.sortBy(line, [function(i) { return i.y; }]);
  this.y0 = ret[0];
  this.y1 = ret[1];
  this.p = intersectLines(
    ret[0], ret[1], vec3(-100, sweepline, 0), vec3(100, sweepline, 0));
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
  this.miny = sweepline > Math.min(this.y0.y, this.y1.y) ? sweepline : Math.min(this.y0.y, this.y1.y);
}

// Intersect the V with a parabola.
V.prototype.intersect = function(obj) {
  if (obj instanceof Parabola) {
    ret = [];
    var p = this.p;
    this.vectors.forEach(function(v) {
      ret = ret.concat(obj.intersectRay(p, v));
    });
    // sort by xvalues if x0 < x1 [x0, x1]
    ret = _.sortBy(ret, [function(i) { return i.x; }]);
    return ret;
  } else if (obj instanceof V) {
    // find the side the obj lies on
    // using the sign of the cross product
    var AB = subtract(this.y1, this.y0);
    var AC = subtract(obj.y0, this.y0);
    if (cross(AB, AC).z > 0) {
      // obj is on the left of this
      // var ret = crossIntersect(obj.p, obj.vectors[1], this.p, this.vectors[0]);
      // return [ret];
      return [intersectLines(obj.p, obj.vectors[1], this.p, this.vectors[0])];
    } else {
      // obj is on the right of this
      return [intersectLines(this.p, this.vectors[1], obj.p, obj.vectors[0])];
      // var ret = crossIntersect(this.p, this.vectors[1], obj.p, obj.vectors[0]);
      // return [ret];
    }
  }
  throw "intersection type not implemented";
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

// y = f(x)
V.prototype.f = function(x) {
  var v;
  if (x < this.p.x && Math.abs(x - this.p.x) > tolerance) {
    v = this.vectors[0];
  } else {
    v = this.vectors[1];
  }
  return this.p.y + v.y*(x-this.p.x)/v.x;
}

// Inverse of f. x = f_(y)
V.prototype.f_ = function(y) {
  if (y < this.p.y && Math.abs(y - this.p.y) > tolerance) return [];
  if (y == this.p.y) return [this.p.x];
  var ret = []
  var tY = this.p.y;
  var tX = this.p.x;
  this.vectors.forEach(function(v) {
    var x = tX + v.x*(y-tY)/v.y;
    ret.push(x);
  });
  return ret;
}

// Prepares this v for drawing
// There are three cases:
//   1. p < x0 < x1
//   2. x0 < p < x1
//   3. x0 < x1 < p
V.prototype.prepDraw = function(nodeid, label, x0, x1) {
  this.nodeid = nodeid;
  this.label = label;
  this.drawPoints = [];

  if (x0 > x1) {
    throw `x0 > x1 in V render: ${x0}, ${x1}`;
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

// Point intersection using the cross product TODO fix
// p + tr = q + us - if there exist  some t and u then both lines intersect
// t = (q-p) x s/(rxs)
// u = (p-q) x r/(sxr)
// Note s x r = -r x s
function crossIntersect(p0, p1, q0, q1) {
  var r = normalize(subtract(p1, p0));
  var s = normalize(subtract(q1, q0));
  var crs = cross(r,s).z;
  var vecPQ = subtract(q0, p0);
  var vecQP = subtract(p0, q0);
  if (crs == 0 && cross(vecPQ, r).z == 0) {
    console.log("Intersecting lines colinear");
    return null;
  }
  if (crs == 0 && cross(vecPQ, r).z != 0) {
    console.log("Intersecting lines are parallel");
    return null;
  }
  var sOverRS = divide(s, crs);
  var rOverSR = divide(r, cross(s, r).z);
  var t = cross(vecPQ, sOverRS).z;
  var u = cross(vecQP, rOverSR).z;
  // if r x s != 0 and 0 <= t <= 1 and 0 <= u <= 0
  // then the two lines meet at p + tr = q + us
  if (crs != 0 && inRange(t, 0, 1) && inRange(u, 0, 1)) {
    return add(p0, mult(t, r));
  }
  return null;
}

function divide(point, scalar){
  var tmp = point;
  tmp.x /= scalar;
  tmp.y /= scalar;
  tmp.z /= scalar;
  return tmp;
}

function inRange(v, lower, upper) {
  return lower <= v && v <= upper;
}
