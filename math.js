//------------------------------------------------------------
//------------------------------------------------------------
// Classes and auxiliary functions
//------------------------------------------------------------
//------------------------------------------------------------

//------------------------------------------------------------
// Segment "class"
//------------------------------------------------------------
function makeSegment(p1, p2, forceOrder = false) {
  var s = [p1, p2];
  // Always store vertex with greatest y value first.
  if (!forceOrder && p1.y < p2.y) {
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

// Get the mid point between p1 and p2
function midPoint(p1, p2) {
  if (equal(p1, p2)) return p1;
  return new vec3((p1.x + p2.x)/2.0, (p1.y + p2.y)/2.0, 0);
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
// quadratic
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
  // tolerance meet with denom of 3.19...e-8 - varify this is correct
  if (Math.abs(denom) < 0.00000001) return null;
  var x = ((x1*y2-y1*x2)*(x3-x4) - (x1-x2)*(x3*y4-y3*x4))/denom;
  var y = ((x1*y2-y1*x2)*(y3-y4) - (y1-y2)*(x3*y4-y3*x4))/denom;
  return vec3(x, y, 0);
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
  var a = v.x * v.x / (4 * p);
  var b = 2 * v.x * (q.x - h) / (4 * p) - v.y;
  var c = (q.x * q.x - 2 * q.x * h + h * h) / (4 * p) + k - q.y;
  var tvals = quadratic(a, b, c);
  return tvals;
}

// Returns intersections ordered by x value
// h - x offset
// k - y offset
// p - scale factor (distance from parabola to directrix)
// * Note this assumes positive parabolas?
function ppIntersect(h1, k1, p1, h2, k2, p2) {
  // Check for degenerate parabolas
  const EPSILON = 0.00000001;
  if (Math.abs(p1) < EPSILON) {
    if (Math.abs(p2) < EPSILON) {
      // Both parabolas have no width
      return [];
    }
    var x = h1;
    var y = parabola_f(x, h2, k2, p2);
    return [vec2(x, y), vec2(x, y)];
  } else if (Math.abs(p2) < EPSILON) {
    var x = h2;
    var y = parabola_f(x, h1, k1, p1);
    return [vec2(x, y), vec2(x, y)];
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
  xintersections.forEach(function (x) {
    var y = parabola_f(x, h1, k1, p1);//(x-h1)*(x-h1)/(4*p1) + k1;
    ret.push(vec2(x, y));
  });
  return ret;
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
  // let v = subtract(s[1], s[0]);
  // let v_unit = normalize(v);
  // let w = subtract(p, s[0]);
  // let d = dot(w, v_unit);
  // if (d < length(v)) {
  //   // In the shadow, so fully parabolic
  //   this.para = createGeneralParabola(p, s);
  //   this.para.prepDraw(100, add(p, vec3(-1, -1, 0)), add(p, vec3(1,1,0)));
  // }
  // else {
  //   throw "PointSegmentBisector not implemented";
  // }
  this.para = createGeneralParabola(p, s);
  this.para.prepDraw(100, add(p, vec3(-1, -1, 0)), add(p, vec3(1,1,0)));
}

PointSegmentBisector.prototype.intersect = function(obj) {
  if (obj instanceof Line) {
    return this.para.intersectRay(obj.p, obj.v);
  } else if (obj instanceof PointSegmentBisector) {
    // return this.para.intersectPara(obj.para);
    throw "General parabola to other parabolas is not implemented";
  }
  throw "PointSegmentBisector intersection with obj not implemented";
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
  if (obj1 == null || obj2 == null) return null;

  if (obj1.type == "vec" && obj2.type == "vec") {
    if (equal(obj1, obj2)) return 0;
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
    console.error("Unable to get distance from parameter objects");
    return;
  }
}

/*------------------------------------------------------------
 dividesPoints
 Does vector v run between p1 and p2?
     *p2   |*v
      \    |
       \   |      * p1
        \  |
         \ | /
          \|/
           *origin
------------------------------------------------------------*/
function dividesPoints(v, origin, p1, p2) {
  var v1 = subtract(p1, origin);
  var v2 = subtract(p2, origin);
  var c0 = cross(v, v1);
  var c1 = cross(v, v2);
 //  console.log("Node id:" + arcNode.id + " c0.z:" + c0.z + "  -c1.z:" + c1.z);
  return c0.z < 0 && c1.z > 0 || c0.z > 0 && c1.z < 0;
}

//------------------------------------------------------------
// getAngle
// s is an array of length 2
//------------------------------------------------------------
function getAngle(s, consider_order=true) {
  var p1 = s[0]; // lower point
  var p2 = s[1]; // upper point
  if (p1[1] == p2[1]) return 0;
  if (consider_order && p1[1] > p2[1]) {
    // swap
    [p1, p2] = [p2, p1]
  }
  return Math.atan2(p2[1]-p1[1], p2[0]-p1[0]);
}

// Angle between two vectors theta = arccos(dot(v1,v2)/ |v1|* |v2|)
// returns the angle in radians
function getAngleBetweenTwoVec(v1, v2) {
  var d = dot(v1, v2);
  var m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  var m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  return Math.acos(d/(m1*m2));
}

// only return true if the point belongs on the quadrant
// with the larger angle
function chooseLargestAngle(s1, s2, pointHint) {
  var sUpper, sLower;
  if (s1.a.y < s2.a.y) {
    sUpper = s2;
    sLower = s1;
  } else {
    sUpper = s1;
    sLower = s2;
  }

  var sUAB = subtract(sUpper.b, sUpper.a);
  var sUBA = subtract(sUpper.a, sUpper.b);
  var sLAB = subtract(sLower.b, sLower.a);
  var sLBA = subtract(sLower.a, sLower.b);
  var BC = subtract(pointHint, sLower.b);

  var lowerAngle = getAngleBetweenTwoVec(sUAB, sLAB);
  var upperAngle = getAngleBetweenTwoVec(sUBA, sLAB);

  var cLUA = cross(sLBA, sUBA).z;
  var cLUB = cross(sLBA, sUAB).z;
  var cLC = cross(sLBA, BC).z;

  if (upperAngle > lowerAngle) {
    return (cLC*cLUA > 0);
  } else {
    // lower angle is the largest
    return (cLC*cLUB > 0);
  }
}

function connected(s1, s2) {
  return equal(s1.a, s2.a) || equal(s1.a, s2.b) ||
  equal(s1.b, s2.a) || equal(s1.b, s2.b);
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
    // Get both bisecting sides clockwise and counter clockwise
    let v1 = vec3(v0.y, -v0.x);
    let v2 = vec3(-v0.y, v0.x);
    return new Line(add(v1, p), add(v2, p));
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
function getSegmentsBisector(s, t, debug=false) {
  var stheta = getAngle(s, false);
  var ttheta = getAngle(t, false);
  if (stheta < 0) stheta += Math.PI*2;
  if (ttheta < 0) ttheta += Math.PI*2;
  if (debug) {
    console.log("stheta = " + (stheta*180/Math.PI));
    console.log("ttheta = " + (ttheta*180/Math.PI));
  }
  if (ttheta < stheta) {
    ttheta += 2.0 * Math.PI;
  }
  var beta = (stheta + ttheta) / 2.0;
  if (debug) {
    console.log("beta = " + (beta*180/Math.PI));
  }
  return beta;
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
  if (v.y > 0) {
    v = negate(v);
  }
  // Get both bisecting sides clockwise and counter clockwise
  // Testing multiple of 2 for better intersection detection effect
  let v1 = vec3(v.y*2, -v.x*2);
  let v2 = vec3(-v.y*2, v.x*2);
  return new Line(add(v1, q), add(v2, q));
}

//------------------------------------------------------------
// bisectSegments3
// Return up two 4 bisecting lines
// NOTE: this bisects LINES not SEGMENTS.
//------------------------------------------------------------
function bisectSegments4(s1, s2, s3) {
  var lines = [];

  // if fully connected segments
  if (connected(s1, s2) && connected(s2, s3)){
    lines.push(bisectSegments(s1, s2));
    lines.push(bisectSegments(s2, s3));
    return lines;
  } else if (connected(s1, s3) && connected(s2, s3)) {
    lines.push(bisectSegments(s1, s3));
    lines.push(bisectSegments(s2, s3));
    return lines;
  } else if (connected(s1, s3) && connected(s1, s2)) {
    lines.push(bisectSegments(s1, s3));
    lines.push(bisectSegments(s1, s2));
    return lines;
  }

  if (connected(s1, s2)){
    var r1 = bisectSegments(s1, s2);
    lines.push(r1);
    var r2 = bisectSegments2(s1, s3);
    lines.push(r2.b1);
    if (r2.b2)
      lines.push(r2.b2);
    return lines;
  } else if (connected(s1, s3)){
    var r1 = bisectSegments(s1, s3);
    lines.push(r1);
    var r2 = bisectSegments2(s1, s2);
    lines.push(r2.b1);
    if (r2.b2)
      lines.push(r2.b2);
    return lines;
  } else if (connected(s2, s3)) {
    var r1 = bisectSegments(s2, s3);
    lines.push(r1);
    var r2 = bisectSegments2(s1, s2);
    lines.push(r2.b1);
    if (r2.b2)
      lines.push(r2.b2);
    return lines;
  }
  var r1 = bisectSegments2(s1, s2);
  lines.push(r1.b1);
  if (r1.b2)
    lines.push(r1.b2);
  var r2 = bisectSegments2(s2, s3);
  lines.push(r2.b1);
  if (r2.b2)
    lines.push(r2.b2);
  return lines;
}

//------------------------------------------------------------
// bisectSegments2
// Return the lines bisecting two lines. Possible 2 bisectors
// NOTE: this bisects LINES not SEGMENTS.
//------------------------------------------------------------
function bisectSegments2(s1, s2) {
  // get the closest points
  var d1 = dist(s1.a, s2.a);
  var d2 = dist(s1.a, s2.b);
  var d3 = dist(s1.b, s2.a);
  var d4 = dist(s1.b, s2.b);

  if (d1 < d2 && d1 < d3 && d1 < d4) {
    // TODO is this correct?
    // s1Prime = s1;
    s2Prime = s2;
    s1Prime = makeSegment(s1.b, s1.a, true);
    // s2Prime = makeSegment(s2.b, s2.a, true);
  } else if (d2 < d1 && d2 < d3 && d2 < d4) {
    s1Prime = s1;
    s2Prime = s2;
    s2 = makeSegment(s2.b, s2.a, true);
  } else if (d3 < d1 && d3 < d2 && d3 < d4) {
    s1Prime = s1;
    s2Prime = s2;
    s1 = makeSegment(s1.b, s1.a, true);
  } else {
    // TODO is this correct?
    // s1Prime = s1;
    s2Prime = s2;
    s1 = makeSegment(s1.b, s1.a, true);
    s1Prime = s1;
    s2 = makeSegment(s2.b, s2.a, true);
  }
  var beta1 = getSegmentsBisector(s1, s2, false);
  var v1 = new vec3(Math.cos(beta1), Math.sin(beta1), 0);
  var p1 = intersectLines(s1.a, s1.b, s2.a, s2.b);
  var l1 = new Line(p1, add(p1, v1));
  var beta2 = getSegmentsBisector(s1Prime, s2Prime, false);
  var v2 = new vec3(Math.cos(beta2), Math.sin(beta2), 0);
  var l2 = new Line(p1, add(p1, v2));
  return {b1:l1, b2:l2};
}

//------------------------------------------------------------
// bisectSegments
// Return the line bisecting two lines. Returns two points [q1,q2] defining
// the line. The vector v=q2-q1 will be oriented in the negative y direction.
// NOTE: this bisects LINES not SEGMENTS.
//------------------------------------------------------------
function bisectSegments(s1, s2, pointHint) {
  // get the closest points
  var d1 = dist(s1.a, s2.a);
  var d2 = dist(s1.a, s2.b);
  var d3 = dist(s1.b, s2.a);
  var d4 = dist(s1.b, s2.b);
  if (d1 < d2 && d1 < d3 && d1 < d4) {
  } else if (d2 < d1 && d2 < d3 && d2 < d4) {
    var useLargeAngle = false;
    if (pointHint && !connected(s1, s2)){
      useLargeAngle = chooseLargestAngle(s1, s2, pointHint);
    }
    if (!useLargeAngle)
      s2 = makeSegment(s2.b, s2.a, true);
  } else if (d3 < d1 && d3 < d2 && d3 < d4) {
    var useLargeAngle = false;
    if (pointHint && !connected(s1, s2)){
      useLargeAngle = chooseLargestAngle(s1, s2, pointHint);
    }
    if (!useLargeAngle)
      s1 = makeSegment(s1.b, s1.a, true);
  } else if (d4 < d1 && d4 < d2 && d4 < d3) {
    s1 = makeSegment(s1.b, s1.a, true);
    s2 = makeSegment(s2.b, s2.a, true);
  }

  var beta = getSegmentsBisector(s1, s2, false);
  var v = new vec3(Math.cos(beta), Math.sin(beta), 0);
  var p = intersectLines(s1.a, s1.b, s2.a, s2.b);
  var l = new Line(p, add(p, v));
  return l;
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
function bisect(a, b, pointHint = null) {
  let bisector;
  if (a.type == 'vec' && b.type == 'vec') {
    // Returns a line
    bisector = bisectPoints(a, b);
  } else if (a.type == 'vec') {
    bisector = bisectPointSegment(a, b);
  } else if (b.type == 'vec') {
    bisector = bisectPointSegment(b, a);
  } else {
    bisector = bisectSegments(a, b, pointHint);
  }
  return bisector;
}

//------------------------------------------------------------
// intersect
//
// Returns the intersecting point(s) between objects a and b.
// a and b must be either lines or parabolas.
//------------------------------------------------------------
function intersect(a, b) {
  let intersection = null;
  if (a instanceof Line && b instanceof Line) {
    // two lines
    intersection = intersectLines(a.p1, a.p2, b.p1, b.p2);
  } else if (a instanceof Line) {
    // line and general parabola
    intersection = b.intersect(a);
  } else if (b instanceof Line) {
    // general parabola and line
    intersection = a.intersect(b);
  } else {
    // Handle for parametric intersections - get the first - check that this is correct
    intersection = a.intersect(b);
  }
  return intersection;
}

//------------------------------------------------------------
// equidistant
//
// Returns the point equidistant from points/segments c1, c2, and c3.
// Function potentially return multiple points
//------------------------------------------------------------
function equidistant(left, arc, right) {
  var segments = _.filter([left, arc, right], { type: "segment" });
  var points = _.filter([left, arc, right], { type: "vec" });
  var b1, b2;
  // Bisecting types can be either lines or parabolas - lines are preferred
  if (points.length == 1) {
    // b1 = bisect(segments[0], points[0]);
    // b2 = bisect(points[0], segments[1]);
    if (points[0] == segments[0].a || points[0] == segments[0].b) {
      b1 = bisect(segments[0], points[0]);
      b2 = bisect(points[0], segments[1]);
    } else if (points[0] == segments[1].a || points[0] == segments[1].b) {
      b1 = bisect(segments[1], points[0]);
      b2 = bisect(points[0], segments[0]);
    } else {
      b1 = bisect(segments[0], points[0]);
      b2 = bisect(segments[0], segments[1], points[0]);
    }
  } else if (segments.length == 1) {
    if (points[0] == segments[0].a || points[0] == segments[0].b) {
      b1 = bisect(segments[0], points[0]);
      b2 = bisect(points[0], points[1]);
    } else if (points[1] == segments[0].a || points[1] == segments[0].b) {
      b1 = bisect(segments[0], points[1]);
      b2 = bisect(points[0], points[1]);
    } else {
      b1 = bisect(segments[0], points[0]);
      b2 = bisect(points[0], points[1]);
    }
  } else if (segments.length == 3) {
    var blines = bisectSegments4(left, arc, right);
    if (blines.length < 2) return null;
    var rslt = [];
    // compute n choose 2 intersections for n lines (2-4) lines
    if (blines.length == 2) {
      if (g_addDebug) {
        g_debugObjs.push(blines[0]);
        g_debugObjs.push(blines[1]);
      }
      return [intersect(blines[0], blines[1])];
    } else if (blines.length == 3) {
      // (ab, ac, bc)
      var ab = intersect(blines[0], blines[1]);
      if (ab)
        rslt.push(ab);
      var ac = intersect(blines[0], blines[2]);
      if (ac)
        rslt.push(ac);
      var bc = intersect(blines[1], blines[2]);
      if (bc)
        rslt.push(bc);
      if (g_addDebug) {
        g_debugObjs.push(blines[0]);
        g_debugObjs.push(blines[1]);
        g_debugObjs.push(blines[2]);
      }
    } else if (blines.length == 4) {
      // (ab, ac, ad, bc, bd, cd)
      var ab = intersect(blines[0], blines[1]);
      if (ab)
        rslt.push(ab);
      var ac = intersect(blines[0], blines[2]);
      if (ac)
      rslt.push(ac);
      var ad = intersect(blines[0], blines[3]);
      if (ad)
        rslt.push(ad);
      var bc = intersect(blines[1], blines[2]);
      if (bc)
        rslt.push(bc);
      var bd = intersect(blines[1], blines[3]);
      if (bd)
        rslt.push(bd);
      var cd = intersect(blines[2], blines[3]);
      if (cd)
        rslt.push(cd);
      if (g_addDebug) {
        g_debugObjs.push(blines[0]);
        g_debugObjs.push(blines[1]);
        g_debugObjs.push(blines[2]);
        g_debugObjs.push(blines[3]);
      }
    }
    return rslt;
  } else {
    b1 = bisect(left, arc);
    b2 = bisect(arc, right);
  }

  if (g_addDebug) {
    g_debugObjs.push(b1);
    g_debugObjs.push(b2);
  }
  return intersect(b1, b2);
}
