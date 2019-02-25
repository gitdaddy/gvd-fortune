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
V = function(line, directrix) {
  lineSegment = _.sortBy(line, [function(i) { return i.y; }]);
  this.y0 = lineSegment[0];
  this.y1 = lineSegment[1];
  this.p = intersectLines(
    lineSegment[0], lineSegment[1], vec3(-100, directrix, 0), vec3(100, directrix, 0));
  this.focus = this.p;
  var theta =
    getSegmentsBisector([vec3(-1, directrix, 0), vec3(1, directrix, 0)], lineSegment);
  // Get the first positive 90 degree sibling to theta
  while (theta > 0) theta -= Math.PI/2;
  while (theta < 0) theta += Math.PI/2;
  this.thetas = [theta + Math.PI/2, theta];
  var vectors = [];
  this.thetas.forEach(function(theta) {
    vectors.push(vec3(Math.cos(theta), Math.sin(theta), 0));
  });
  this.vectors = vectors;
  this.miny = directrix > Math.min(this.y0.y, this.y1.y) ? directrix : Math.min(this.y0.y, this.y1.y);
}

V.prototype.updateNewSweeplineForDemoMode = function() {
  var directrix = Math.min(this.y0.y, this.y1.y) - 0.00001;
  var theta =
    getSegmentsBisector([vec3(-1, directrix, 0), vec3(1, directrix, 0)], makeSegment(this.y0, this.y1));
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
    var tlvy = vec3(this.f_(this.y1.y)[0], this.y1.y, 0);
    var trvy = vec3(this.f_(this.y1.y)[1], this.y1.y, 0);
    var olvy = vec3(obj.f_(obj.y1.y)[0], obj.y1.y, 0);
    var orvy = vec3(obj.f_(obj.y1.y)[1], obj.y1.y, 0);

    var itlol = intersectLines(this.p, tlvy, obj.p, olvy);
    var itlor = intersectLines(this.p, tlvy, obj.p, orvy);
    var itrol = intersectLines(this.p, trvy, obj.p, olvy);
    var itror = intersectLines(this.p, trvy, obj.p, orvy);

    var miny = this.p.y;
    var validPoints = _.filter([itlol, itlor, itrol, itror], function (p) {
      if (p != null) {
        return p.y > miny;
      }
    });
    if (this.y1.y == obj.y1.y) {
      // possibly return up to 4 points
      return _.sortBy(validPoints, function (p) { return p.x; });
    }
    // Otherwise use the target intersections 'around' the lowest segment
    var targetX = this.y1.y > obj.y1.y ? obj.p.x : this.p.x;
    // only get the two most valid points that are closest to the midpoint
    var ret = _.sortBy(validPoints, function (p) {
      return Math.abs(p.x - targetX);
    });
    ret = ret.length > 2 ? [ret[0], ret[1]] : ret;
    return _.sortBy(ret, function (p) { return p.x; });
  }
  throw "intersection type not implemented";
}

// Intersect the positive portion of the ray.
// If there are two intersections, the intersections will
// be returned in order of t value.
// The ray is given in parametric form p(t) = p + tv
V.prototype.intersectRay = function(p, v) {
  throw "intersectRay not implemented";
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
  // To debug the v
  // var y0 = this.f(-1)
  // var y1 = this.f(1)
  // if (-1 < this.p.x && this.p.x < 1) {
  //   // case 2
  //   this.drawPoints.push({x:-1, y:y0});
  //   this.drawPoints.push({x:this.p.x, y:this.p.y});
  //   this.drawPoints.push({x:1, y:y1});
  // } else {
  //   // cases 1 and 3
  //   this.drawPoints.push({x:-1, y:y0});
  //   this.drawPoints.push({x:1, y:y1});
  // }
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
