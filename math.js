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
  let v = subtract(s[1], s[0]);
  let v_unit = normalize(v);
  let w = subtract(p, s[0]);
  let d = dot(w, v_unit);
  if (d < length(v)) {
    // In the shadow, so fully parabolic
    this.para = createGeneralParabola(p, s);
  } else {
    throw "PointSegmentBisector not implemented"
  }
}

PointSegmentBisector.prototype.intersectLine = function(line) {
  return this.para.intersectLine(line);
}

//------------------------------------------------------------
// bisectPointSegment
// Returns the bisector of a point and a segment. The returned
// value will be a PointSegmentBisector.
//------------------------------------------------------------
function bisectPointSegment(p, s) {
  return new PointSegmentBisector(p, s);
}

//------------------------------------------------------------
//------------------------------------------------------------
// General functions
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
  // Assume they're both lines for now
  if (a instanceof Line && b instanceof Line) {
    intersection = intersectLines(a.p1, a.p2, b.p1, b.p2);
  } else if (a instanceof Line) {
    // b is a general parabola
    intersection = b.intersectLine(a);
  } else if (b instanceof Line) {
    // a is a general parabola
    intersection = a.intersectLine(b);
  }
  return intersection;
  // let bisector;
  // if (a.type == 'vec' && b.type == 'vec') {
  //   // Returns a line
  //   bisector = bisectPoints(a, b);
  // } else if (a.type == 'vec') {
  //   // Returns PointSegmentBisector
  //   bisector = bisectPointSegment(a, b);
  // } else if (b.type == 'vec') {
  //   bisector = bisectPointSegment(b, a);
  // } else {
  //   bisector = bisectSegments(a, b);
  // }
  // return bisector;
}

// s is an array of length 2
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

// Return the angle of the bisecting line of two segments.
// The bisector is between the angle s to the angle t.
// s,t are arrays of length 2
function getSegmentsBisector(s, t) {
  var stheta = getAngle(s);
  var ttheta = getAngle(t);
  if (ttheta < stheta) {
    ttheta += 2.0 * Math.PI;
  }
  return (stheta + ttheta) / 2.0;
}

// Return the line bisecting two points. Returns two points [q1,q2] defining
// the line. The vector v=q2-q1 will be oriented in the negative y direction.
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

// ax^2 + bx + c = 0
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

// Returns the point equidistant from points/segments c1, c2, and c3.
function equidistant(c1, c2, c3) {
  // put the objects in order of segment -> point
  // let objects = [c1, c2, c3];
  // objects.sort((a,b) => (isSegment(b) && ~isSegment(a)) ? -1 : 0);

  let b12 = bisect(c1, c2);
  let b23 = bisect(c2, c3);
  return intersect(b12, b23);
  
  // // TODO handle segment case
  // if (isSegment(c1)) c1 = c1[0];
  // if (isSegment(c2)) c2 = c2[0];
  // if (isSegment(c3)) c3 = c3[0];
  return equidistant_ppp(c1, c2, c3);
}

// Three points.
function equidistant_ppp(c1, c2, c3) {
  //                   p0       u
  //       c1 *         *<--------------* c2
  //                    |\
  //                    | \
  //                  v |  \
  //                    |    \ p0p3
  //                    |     \
  //                    v      \
  //                             \
  //                              v
  //                              * c3
  //

  var u = mult(0.5, subtract(c1, c2));
  var p0 = add(c2, u);
  var v = normalize(vec3(-u[1], u[0], 0));
  var a = dot(u, u);
  var p0p3 = subtract(p0, c3);
  var t = (-dot(p0p3, p0p3) + a) / (2 * dot(p0p3, v));
  return vec3(add(p0, mult(t, v)));
}
