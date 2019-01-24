//------------------------------------------------------------
//------------------------------------------------------------
// Classes and auxiliary functions
//------------------------------------------------------------
//------------------------------------------------------------

//------------------------------------------------------------
// Segment "class"
//------------------------------------------------------------
function makeSegment(p1, p2) {
  var s = [p1, p2];
  // Always store vertex with greatest y value first.
  if (p1.y < p2.y) {
    s = [p2, p1];
  }
  Object.defineProperty(s, "y", {
    configurable: true,
    enumerable: true,
    get: function() {
      return this[0].y;
    }
  });
  Object.defineProperty(s, "x", {
    configurable: true,
    enumerable: true,
    get: function() {
      return this[0].x;
    }
  });
  s.a = s[0];
  s.b = s[1];
  s.type = 'segment';
  return s;
}

function isSegment(s) {
  return (Array.isArray(s) && s.length == 2 && Array.isArray(s[0]));
}

//------------------------------------------------------------
// Line class
//------------------------------------------------------------
Line = function(p1, p2) {
  this.p1 = p1;
  this.p2 = p2;

  // An arbitrary point on the line
  this.p = p1;
  // The direction of the line, normalized
  this.v = normalize(subtract(p2, p1));
}

//------------------------------------------------------------
// PointSegmentBisector class
//
// If the point is in the shadow of the line segment then
// this represents a general parabola. Otherwise it is a
// ray/parabola combination.
//------------------------------------------------------------
PointSegmentBisector = function(p, s) {
  p = vec3(p);
  let v = subtract(s[1], s[0]);
  let v_unit = normalize(v);
  let w = subtract(p, s[0]);
  let d = dot(w, v_unit);
  if (d < length(v)) {
    // In the shadow, so fully parabolic
    this.para = createGeneralParabola(p, s);
  } else {
    throw "PointSegmentBisector not implemented";
  }
}

PointSegmentBisector.prototype.intersectLine = function(line) {
  return this.para.intersectLine(line);
}

//------------------------------------------------------------
//------------------------------------------------------------
// Math functions
//------------------------------------------------------------
//------------------------------------------------------------

//------------------------------------------------------------
// Returns the distance between objects 1 and 2.
//------------------------------------------------------------
function dist(obj1, obj2) {
  // Cover 3 cases
  // 1. Point to Point
  // 2. Point to Segment
    // for point(x0,y0) and line ax + by + c = 0
    // d = abs(a*x0 + b*y0 + c)/ sqrt(a^2 + b^2)
  // 3. Segment to Segment

  if (obj1.type == "vec" && obj2.type == "vec") {
    return length(subtract(vec2(obj1), vec2(obj2)));
  } else if (obj1.type == "vec" && obj2.type == "segment") {
    // get the equation of the line from the segment ax + by + c = 0
    // (y1 - y2)x + (x2 - x1)y + (x1y2 - x2y1) = 0
    var a = obj2[0].y - obj2[1].y;
    var b = obj2[1].x - obj2[0].x;
    var c = obj2[0].x * obj2[1].y - obj2[1].x * obj2[0].y;
    return Math.abs(a * obj1.x + b * obj1.y + c)/Math.sqrt(a*a + b*b);
  } else if (obj1.type == "segment" && obj2.type == "vec") {
    // same as the above condition
    var a = obj1[0].y - obj1[1].y;
    var b = obj1[1].x - obj1[0].x;
    var c = obj1[0].x * obj1[1].y - obj1[1].x * obj1[0].y;
    return Math.abs(a * obj2.x + b * obj2.y + c)/Math.sqrt(a*a + b*b);
  } else { // Segment to Segment
    throw "Segment to Segment distance is not implemented yet";
  }
}

//------------------------------------------------------------
// quadratic
//
// ax^2 + bx + c = 0
//------------------------------------------------------------
function quadratic(a, b, c) {
  if (a == 0) return [];
  // var disc = Math.sqrt(b*b-4*a*c);
  var disc = b*b-4*a*c;
  if (disc < -0.0000001) {
    return [];
  }
  if (Math.abs(disc) < 0.0000001) {
    return [(-b)/(2*a)];
  }
  var sdisc = Math.sqrt(disc);
  return [(-b+sdisc)/(2*a), (-b-sdisc)/(2*a)];
}

//------------------------------------------------------------
// getAngle
// s is an array of length 2
//------------------------------------------------------------
function getAngle(s) {
  var p1 = s[0]; // lower point
  var p2 = s[1]; // upper point
  if (p1[1] == p2[1]) return 0;
  if (p1[1] > p2[1]) {
    // swap
    [p1, p2] = [p2, p1]
  }
  return Math.atan2(p2[1]-p1[1], p2[0]-p1[0]);
}

//------------------------------------------------------------
//------------------------------------------------------------
// Specific intersect functions
//------------------------------------------------------------
//------------------------------------------------------------

//             * p4
//           _/
// p1 *----_/---------* p2
//       _/
//      /
//  p3 *
function intersectLines(p1, p2, p3, p4) {
  var x1 = p1.x;
  var x2 = p2.x;
  var x3 = p3.x;
  var x4 = p4.x;
  var y1 = p1.y;
  var y2 = p2.y;
  var y3 = p3.y;
  var y4 = p4.y;
  var denom = (x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
  if (Math.abs(denom) < 0.000001) return null;
  var x = ((x1*y2-y1*x2)*(x3-x4) - (x1-x2)*(x3*y4-y3*x4))/denom;
  var y = ((x1*y2-y1*x2)*(y3-y4) - (y1-y2)*(x3*y4-y3*x4))/denom;
  return vec3(x, y, 0);
}

//------------------------------------------------------------
//------------------------------------------------------------
// Specific bisect functions
//------------------------------------------------------------
//------------------------------------------------------------

//------------------------------------------------------------
// bisectPointSegment
// Returns the bisector of a point and a segment. The returned
// value will be a PointSegmentBisector.
//------------------------------------------------------------
function bisectPointSegment(p, s) {
  p = vec3(p);
  s0 = vec3(s[0]);
  s1 = vec3(s[1]);
  if ((p[0] == s0[0] && p[1] == s0[1]) ||
      (p[0] == s1[0] && p[1] == s1[1])) {
    // special case: point is a segment endpoint
    let v0 = subtract(s1, s0);
    let v = vec3(v0[1], -v0[0]);
    return new Line(p, add(p, v));
  }
  if (dot(subtract(p, s0), normalize(subtract(s0, s1))) ==
      length(subtract(p, s0))) {
    // special case: line and point are collinear
    let v0 = subtract(s1, s0);
    let v = vec3(v0[1], -v0[0]);
    if (length(subtract(p, s0)) < length(subtract(p, s1))) {
      // if p is closer to s0...
      return bisect(p, s0);
    } else {
      // if p is closer to s1...
      return bisect(p, s1);
    }
  }

  return new PointSegmentBisector(p, s);
}

//------------------------------------------------------------
// getSegmentsBisector
//
// Return the angle of the bisecting line of two segments.
// The bisector is between the angle s to the angle t.
// s,t are arrays of length 2
//------------------------------------------------------------
function getSegmentsBisector(s, t) {
  var stheta = getAngle(s);
  var ttheta = getAngle(t);
  if (ttheta < stheta) {
    ttheta += 2.0 * Math.PI;
  }
  return (stheta + ttheta) / 2.0;
}

//------------------------------------------------------------
// bisectPoints
//
// Return the line bisecting two points. Returns two points [q1,q2] defining
// the line. The vector v=q2-q1 will be oriented in the negative y direction.
//------------------------------------------------------------
function bisectPoints(p1, p2) {
  var v = subtract(p2, p1);
  var q = add(p1, mult(v, 0.5));
  [v.x, v.y] = [-v.y, v.x];
  if (v.y > 0) {
    v = negate(v);
  }
  return new Line(q, add(q, v));
  // return [q, add(q, v)];
}

//------------------------------------------------------------
//------------------------------------------------------------
// General bisect/intersect functions
//------------------------------------------------------------
//------------------------------------------------------------

//------------------------------------------------------------
// bisect
//
// Returns a bisector of a and b. a and b must be either line
// segments or points.
//------------------------------------------------------------
function bisect(a, b) {
  let bisector;
  if (a.type == 'vec' && b.type == 'vec') {
    // Returns a line
    bisector = bisectPoints(a, b);
  } else if (a.type == 'vec') {
    // Returns PointSegmentBisector
    bisector = bisectPointSegment(a, b);
  } else if (b.type == 'vec') {
    bisector = bisectPointSegment(b, a);
  } else {
    // TODO define this function
    bisector = bisectSegments(a, b);
  }
  return bisector;
}

//------------------------------------------------------------
// intersect
//
// Returns the intersecting point between objects a and b.
// a and b must be either lines or parabolas.
//------------------------------------------------------------
function intersect(a, b) {
  let intersection = null;
  if (a instanceof Line && b instanceof Line) {
    // two lines
    intersection = intersectLines(a.p1, a.p2, b.p1, b.p2);
  } else if (a instanceof Line) {
    // line and general parabola
    // Handle for parametric intersections - get the first - check that this is correct
    intersection = b.intersectLine(a)[0];
  } else if (b instanceof Line) {
    // general parabola and line
    // Handle for parametric intersections - get the first - check that this is correct
    intersection = a.intersectLine(b)[0];
  } else {
    // parabola and parabola
    // TODO
    throw "Parabola and parabola intersection not implemented"
  }
  return intersection;
}

//------------------------------------------------------------
// equidistant
//
// Returns the point equidistant from points/segments c1, c2, and c3.
//------------------------------------------------------------
function equidistant(c1, c2, c3) {
  // TODO FIX for when c1 and c2 share the same segment
  // point but are different types
  // Bisecting types can be either lines or parabolas
  let b12 = bisect(c1, c2);
  let b23 = bisect(c2, c3);
  let ret = intersect(b12, b23);
  return ret;
}

//------------------------------------------------------------
// LessThan
//
// Object site comparision for points and segments
//------------------------------------------------------------
// function lessThan(a, b) {
//   var tolerance = 0.01;
//   if (a instanceof Parabola && b instanceof Parabola) {
//     return a.focus.x < b.focus.x && Math.abs(a.focus.x - b.focus.x) > tolerance;
//   } else if (a instanceof Parabola && b instanceof V) {
//     return a.focus.x < b.p.x && Math.abs(a.focus.x - b.p.x) > tolerance;
//   } else if (a instanceof V && b instanceof Parabola) {
//     return a.p.x < b.focus.x && Math.abs(a.p.x - b.focus.x) > tolerance;
//   } else {
//     return a.p.x < b.p.x && Math.abs(a.p.x - b.p.x) > tolerance;
//   }
// }
