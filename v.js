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
  this.y1 = lineSegment[1];
  this.y0 = lineSegment[0];
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

function getJoint(ay0, ay1, by0, by1) {
  if (equal(ay0, by0)) return {point: ay0, relation: ay0.relation};
  if (equal(ay1, by0)) return {point: ay1, relation: ay1.relation};
  if (equal(ay0, by1)) return {point: ay0, relation: ay0.relation};
  if (equal(ay1, by1)) return {point: ay1, relation: ay1.relation};
  return null;
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

    if (this.y0.label == obj.y0.label) {
      var y0_y1 = subtract(this.y1, this.y0);
      var y0_Oy0 = subtract(obj.y0, this.y0);
      var y0_Oy1 = subtract(obj.y1, this.y0);
      // z area between this and obj
      var zArea = cross(y0_y1, y0_Oy0).z + cross(y0_y1, y0_Oy1).z;
      if (zArea == 0) {
        // collinear
        console.log("collinear v-v arc!");
        return [this.p];
      }
      // choose this v left or right based on zArea
      var b = bisectSegments(makeSegment(this.y0, this.y1), makeSegment(obj.y0, obj.y1));
        // debugObjs.push(b);

      if (zArea < 0) {
        // segment right - should this always be used or should obj be used?
        return [intersectLines(this.p, vec3(this.f_(this.y1.y)[1], this.y1.y, 0), b.p1, b.p2)];
      } else {
        // segment left
        return [intersectLines(this.p, vec3(this.f_(this.y1.y)[0], this.y1.y, 0), b.p1, b.p2)];
      }
    } else {
      // The lower V should never have to worry about intersecting with the
      // the upper V's 'hidden' arc
      var upperV = this.y1.y > obj.y1.y ? this : obj;
      var lowerV = this.y1.y > obj.y1.y ? obj : this;
      // the lower V must be to one side of the upper V
      // use the zArea to determine which side
      var y0_y1 = subtract(upperV.y1, upperV.y0);
      var y0_Ly0 = subtract(lowerV.y0, upperV.y0);
      var y0_Ly1 = subtract(lowerV.y1, upperV.y0);
      // z area between this and obj
      var zArea = cross(y0_y1, y0_Ly0).z + cross(y0_y1, y0_Ly1).z;
      var p1,p2v0,p2v1,p3,p4;
      p1 = lowerV.p;
      p2v0 = vec3(lowerV.f_(lowerV.y1.y)[0], lowerV.y1.y, 0);
      p2v1 = vec3(lowerV.f_(lowerV.y1.y)[1], lowerV.y1.y, 0);
      p3 = upperV.p;
      if (zArea < 0) {
        // right of upper
        p4 = vec3(upperV.f_(upperV.y1.y)[1], upperV.y1.y, 0);
      } else {
        // left of upper
        p4 = vec3(upperV.f_(upperV.y1.y)[0], upperV.y1.y, 0);
      }
      return _.sortBy([intersectLines(p1, p2v0, p3, p4), intersectLines(p1, p2v1, p3, p4)], 'x');
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
