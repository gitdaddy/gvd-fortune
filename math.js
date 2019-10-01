//------------------------------------------------------------
//------------------------------------------------------------
// Classes and auxiliary functions
//------------------------------------------------------------
//------------------------------------------------------------

function getEventY(event)
{
  if (event.yval) return event.yval;
  return event.type === "segment" ? event[0][1] : event[1];
}

function getEventX(event)
{
  return event.type === "segment" ? event[0][0] : event[0];
}

//------------------------------------------------------------
// Segment "class"
//------------------------------------------------------------
function makeSegment(p1, p2, forceOrder = false) {
  var s = [p1, p2];
  // Always store vertex with greatest y value first.
  if (!forceOrder && p1[1] < p2[1]) {
    s = [p2, p1];
    p1.isEndPoint = true;
  } else {
    p2.isEndPoint = true;
  }
  Object.defineProperty(s, "y", {
    configurable: true,
    enumerable: true,
    get: function() {
      throw "segment get y";
      return this[0][1];
    }
  });
  Object.defineProperty(s, "x", {
    configurable: true,
    enumerable: true,
    get: function() {
      throw "segment get x";
      return this[0][0];
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

function convertToVec3(p) {
  if (p.length === 3) return p;
  return vec3(p.x, p.y, 0);
}

// Get the mid point between p1 and p2
function midPoint(p1, p2) {
  if (equal(p1, p2)) return p1;
  return new vec3((p1.x + p2.x)/2.0, (p1.y + p2.y)/2.0, 0);
}

function getPointsRightOfLine(a, b, points) {
  return _.filter(points, function (p) {
    return isRightOfLine(a, b, convertToVec3(p));
  });
}

function getPointsLeftOfLine(a, b, points) {
  return _.filter(points, function (p) {
    return !isRightOfLine(a, b, convertToVec3(p));
  });
}

function dividesRightOfLine(a1, b1, a2, b2) {
  return isRightOfLine(a1, b1, a2) && isRightOfLine(a1, b1, b2)
}

function isRightOfLine(upper, lower, p) {
  var v1 = subtract(upper, lower);
  var v2 = subtract(p, lower);
  var z = cross(v1, v2).z;
  if (z === 0.0) console.log("Co-linear found when using isRightOfLine()");
  return z < 0;
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
  // WATCH VALUE
  var thresh = 1e-3;
  if (a == 0) return [];
  // var disc = Math.sqrt(b*b-4*a*c);
  var disc = b*b-4*a*c;
  if (disc < -thresh) {
    return [];
  }
  if (Math.abs(disc) < thresh) {
    return [(-b)/(2*a)];
  }
  var sdisc = Math.sqrt(disc);
  return [(-b+sdisc)/(2*a), (-b-sdisc)/(2*a)];
}


/*------------------------------------------------------------
------------------------------------------------------------
 Specific intersect functions

------------------------------------------------------------
var circle = {
    radius : 500,
    center : point(1000,1000),
}
var seg = {
    p1 : point(500,500),
    p2 : point(2000,1000),
}

point {x,y}
------------------------------------------------------------ */
function interceptCircleSeg(circle, line){
  var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
  v1 = {};
  v2 = {};
  v1.x = line.p2.x - line.p1.x;
  v1.y = line.p2.y - line.p1.y;
  v2.x = line.p1.x - circle.center.x;
  v2.y = line.p1.y - circle.center.y;
  b = (v1.x * v2.x + v1.y * v2.y);
  c = 2 * (v1.x * v1.x + v1.y * v1.y);
  b *= -2;
  d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
  if(isNaN(d)){ // no intercept
      return [];
  }
  u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
  u2 = (b + d) / c;
  retP1 = {};   // return points
  retP2 = {}
  ret = []; // return array
  if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
      retP1.x = line.p1.x + v1.x * u1;
      retP1.y = line.p1.y + v1.y * u1;
      ret[0] = retP1;
  }
  if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
      retP2.x = line.p1.x + v1.x * u2;
      retP2.y = line.p1.y + v1.y * u2;
      ret[ret.length] = retP2;
  }
  // if the points are too close return the tangent point
  if (ret.length == 2) {
    var diff = dist(new vec3(ret[0].x, ret[0].y,0), new vec3(ret[1].x, ret[1].y,0));
    // WATCH VALUE
    if (diff < 5e-3) return [ret[0]];
  }
  return ret;
}

//             * p4
//           _/
// p1 *----_/---------* p2
//       _/
//      /
//  p3 *
function intersectLines(p1, p2, p3, p4) {
  var x1 = p1[0];
  var x2 = p2[0];
  var x3 = p3[0];
  var x4 = p4[0];
  var y1 = p1[1];
  var y2 = p2[1];
  var y3 = p3[1];
  var y4 = p4[1];
  var denom = (x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
  // tolerance previous tolerance 1e-8
  // originally 1e-6 but more precision has been needed
  if (Math.abs(denom) < 1e-14){
    console.log("intersectLines() denom too small:" + denom);
    return null;
  }
  var x = ((x1*y2-y1*x2)*(x3-x4) - (x1-x2)*(x3*y4-y3*x4))/denom;
  var y = ((x1*y2-y1*x2)*(y3-y4) - (y1-y2)*(x3*y4-y3*x4))/denom;
  return vec3(x, y, 0);
}

function intersectLeftRightLines(leftLines, rightLines) {
  if (g_addDebug) {
    _.forEach(leftLines, function(l) {
      g_debugObjs.push(l);
    });
    _.forEach(rightLines, function(l) {
      g_debugObjs.push(l);
    });
  }
  var rslts = [];
  _.forEach(leftLines, function(l1) {
    _.forEach(rightLines, function(l2) {
        var newInt = intersectLines(l1.p1, l1.p2, l2.p1, l2.p2);
        // intersections can come back as null meaning
        // the lines are nearly parallel
        if (newInt)
          rslts.push(newInt);
    });
  });
  return rslts;
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
// * Note this assumes positive parabolas
function ppIntersect(h1, k1, p1, h2, k2, p2) {
  // Check for degenerate parabolas
  // WATCH VALUE
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
  this.para = createGeneralParabola(p, s);
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

function filterVisiblePoints(site, points) {
  if (!points || points.length === 0) return null;
  if (points.type && points.type === "vec") {
    points = [points];
  }

  if (!site.type || site.type !== "segment") return points;
  // WATCH VALUE
  // Some equi points can have a certain degree of error
  // account for that error using a tolerance vector
  var tolerance = 1.000001;
  // new updated vector = (a-b) * scale + a
  var A = add(mult(subtract(site.a, site.b), tolerance), site.b);
  var B = add(mult(subtract(site.b, site.a), tolerance), site.a);
  var rslt = _.filter(points, function (p) {
    p = convertToVec3(p);
    return fallsInBoundary(A, B, p);
  });
  return rslt;
}

function sharedSegment(s1, s2) {
  if (s1.type === "vec" && s2.type === "segment") {
    return equal(s1, s2.a) || equal(s1, s2.b) ? s2 : null;
  } else if (s2.type === "vec" && s1.type === "segment") {
    return equal(s1.a, s2) || equal(s1.b, s2) ? s1 : null;
  }
  return null;
}

function filterBySiteAssociation(left, node, right, points) {
  // for each associated node
  var s1 = left.site;
  var s2 = node.site;
  var s3 = right.site;
  var sLeft = sharedSegment(s1, s2);
  var sRight = sharedSegment(s2, s3);
  if (sLeft && sRight) return points;
  if (!sLeft && !sRight) return points;

  if (sLeft) {
    if (s2.type === "segment") {
      return equal(s2.b, s1) ? getPointsRightOfLine(sLeft.a, sLeft.b, points)
        : getPointsLeftOfLine(sLeft.a, sLeft.b, points);
    } else {
      return equal(s2, s1.a) ? getPointsRightOfLine(sLeft.a, sLeft.b, points)
      : getPointsLeftOfLine(sLeft.a, sLeft.b, points);
    }
  }
  // sRight otherwise
  if (s2.type === "segment") {
    return equal(s2.b, s3) ? getPointsLeftOfLine(sRight.a, sRight.b, points)
      : getPointsRightOfLine(sRight.a, sRight.b, points);
  } else {
    return equal(s2, s3.a) ? getPointsLeftOfLine(sRight.a, sRight.b, points)
    : getPointsRightOfLine(sRight.a, sRight.b, points);
  }
}

// Test if a point falls into the boundary of the sight of the segment line
function fallsInBoundary(A, B, point) {
  if (A.x === B.x) {
    return point.y < A.y && point.y > B.y;
  }
  var positiveSlope = A.x > B.x ? true : false;
  var AB = subtract(B, A);
  var BA = subtract(A, B);
  var v1Clockwise = new vec3(AB.y, -AB.x, 0); // 90 degrees perpendicular
  var v1CounterClockwise = new vec3(-AB.y, AB.x, 0);
  var v2Clockwise = new vec3(BA.y, -BA.x, 0);
  var v2CounterClockwise = new vec3(-BA.y, BA.x, 0);
  // define the boundary endpoints - add end point values
  var p1a = add(v1Clockwise, A);
  var p2a = add(v1CounterClockwise, A);
  var lineA = _.sortBy([p1a, p2a], 'y');
  var va = subtract(lineA[1], lineA[0]); // vector from lower to upper
  var vap = subtract(point, lineA[0]);
  var z1 = cross(va, vap).z;

  var p1b = add(v2Clockwise, B);
  var p2b = add(v2CounterClockwise, B);
  var lineB = _.sortBy([p1b, p2b], 'y');
  var vb = subtract(lineB[1], lineB[0]); // vector from lower to upper
  var vbp = subtract(point, lineB[0]);
  var z2 = cross(vb, vbp).z;
  // if the point is in segment bounds it must be to the
  if (positiveSlope) {
    return z1 > 0 && z2 < 0;
  } else {
    return z1 < 0 && z2 > 0;
  }
}

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
  }

  var seg, point;
  if (obj1.type == "vec" && obj2.type == "segment") {
    seg = obj2;
    point = obj1;
  } else if (obj1.type == "segment" && obj2.type == "vec") {
    seg = obj1;
    point = obj2;
  } else { // Segment to Segment
    console.error("Unable to get distance from parameter objects");
    return;
  }

  if (fallsInBoundary(seg.a, seg.b, point)) {
    // get the equation of the line from the segment ax + by + c = 0
    // (y1 - y2)x + (x2 - x1)y + (x1y2 - x2y1) = 0
    var a = seg[0].y - seg[1].y;
    var b = seg[1].x - seg[0].x;
    var c = seg[0].x * seg[1].y - seg[1].x * seg[0].y;
    var n = Math.abs(a * point.x + b * point.y + c);
    var dn = Math.sqrt(a*a + b*b)
    return n/dn;
  } else {
    return Math.min(dist(seg[0], point), dist(seg[1], point));
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

function betweenValue(t, a, b) {
  var sorted = [a,b].sort();
  return sorted[0] <= t && t <= sorted[1];
}

//------------------------------------------------------------
// intersectsTargetSegments
// Does one segment intersect another along the length of the segment
//-----
function intersectsTargetSegments(s1, s2){
  // if the intersection is on the line of the target
  var i = intersectLines(s1.a, s1.b , s2.a, s2.b);
  // if the intersection is within the y bounds
  // only works for non-horizontal lines
  if (!i) {
    // most likely the lines are parallel
    return false;
  }
  return betweenValue(i.y, s2.a.y, s2.b.y) && betweenValue(i.x, s2.a.x, s2.b.x)
         || betweenValue(i.y, s1.a.y, s1.b.y) && betweenValue(i.x, s1.a.x, s1.b.x);
}

// Angle between two vectors theta = arccos(dot(v1,v2)/ |v1|* |v2|)
// returns the angle in radians
// function getAngleBetweenTwoVec(v1, v2) {
//   var d = dot(v1, v2);
//   var m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
//   var m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
//   return Math.acos(d/(m1*m2));
// }

function connected(s1, s2) {
  if (equal(s1.a, s2.a) || equal(s1.a, s2.b)) {
    return s1.a;
  } else if (equal(s1.b, s2.a) || equal(s1.b, s2.b)) {
    return s1.b;
  }
  return null;
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
// getSegmentsBisectorAngle
//
// Return the angle of the bisecting line of two segments.
// The bisector is between the angle s to the angle t.
// s,t are arrays of length 2
//------------------------------------------------------------
function getSegmentsBisectorAngle(s, t, debug=false) {
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
  // if the point sites are equal then
  // we must rely on the external segments for an accurate bisector
  if (equal(p1, p2)) {
    console.log("Bisecting equal point sites...");
    // get external segments
    var ss1 = findConnectedSegments(p1);
    var ss2 = findConnectedSegments(p2);

    if (ss1.length !== 2 || ss2.length !== 2) {
      throw "Invalid bisect points - data contains overlapping point sites";
    }

    // find the two segments with the smallest angle from p1 and p2
    var smallestAnglePair = { angle: 1e10 };
    _.forEach(ss1, function(s1){
      _.forEach(ss2, function(s2) {
        // if angle < sp.angle - set the smallest pair
        var beta = getSegmentsBisectorAngle(s1, s2);
        if (beta < smallestAnglePair.angle) {
          smallestAnglePair.angle = beta;
          smallestAnglePair.s1 = s1;
          smallestAnglePair.s2 = s2;
        }
      });
    });
    // get the bisector between the two segments
    var data = smallAngleBisectSegments(smallestAnglePair.s1, smallestAnglePair.s2, p1);
    // debugging only
    if (g_addDebug) g_debugObjs.push(data.line);
    return data.line;
  }

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
// bisectSegments4
// Return up two 4 bisecting lines
// NOTE: this bisects LINES not SEGMENTS.
//------------------------------------------------------------
function bisectSegments4(s1, s2, s3) {
  var l = [];
  var r = [];
  l.push(bisectSegments2(s1, s2));
  r.push(bisectSegments2(s2, s3));
  return {
    left: _.flatten(l),
    right: _.flatten(r)
  };
}

//------------------------------------------------------------
// bisectSegments2
// Return the lines bisecting two segments using large and small angles.
// Possible 2 bisectors
// If the segments are connected then the only true bisector is returned
// NOTE: this bisects LINES not SEGMENTS.
//------------------------------------------------------------
function bisectSegments2(s1, s2) {
  // if connected segments
  var optCon = connected(s1, s2);
  if (optCon){ // || !intersectsTargetSegments(s1, s2)){
    var bisectData = smallAngleBisectSegments(s1, s2, optCon);
    return [bisectData.line];
  }

  var bisectData = smallAngleBisectSegments(s1, s2);
  var s = bisectData.line;
  // the line for the large angle is perpendicular to the
  // small angle bisector
  var sorted = _.sortBy([s.p1, s.p2], 'y');
  var AB = subtract(sorted[0], sorted[1]);
  var v1Clockwise = new vec3(AB.y, -AB.x, 0); // 90 degrees perpendicular
  var v1CounterClockwise = new vec3(-AB.y, AB.x, 0);
  var intersect = bisectData.optPoint ? bisectData.optPoint : intersectLines(s1.a, s1.b, s2.a, s2.b);
  if (!intersect) {
    return [s];
  }
  var l = new Line(add(v1Clockwise, intersect), add(v1CounterClockwise, intersect));
  return [s, l];
}

function parallelTest(s1, s2) {
  var l1 = new Line(s1.a, s1.b);
  var l2 = new Line(s2.a, s2.b);
  // each line has a normalized vector
  // if the vector of each segment is equal then they lines are parallel
  // To reduce floating point error we introduce a precision value
  // used to round the floating point values
  // WATCH VALUE
  var precision = 10;
  var x1 = l1.v.x.toFixed(precision);
  var y1 = l1.v.y.toFixed(precision);
  var x2 = l2.v.x.toFixed(precision);
  var y2 = l2.v.y.toFixed(precision);
  return x1 === x2 && y1 === y2;
}

function getAverage(s1, s2) {
  var p1 = vec3(((s1.a.x + s2.a.x) / 2.0), ((s1.a.y + s2.a.y) / 2.0), 0);
  var p2 = vec3(((s1.b.x + s2.b.x) / 2.0), ((s1.b.y + s2.b.y) / 2.0), 0);
  return new Line(p1, p2);
}

//------------------------------------------------------------
// bisectSegments
// Return the line bisecting two lines. For the smallest angle
// Returns two points [q1,q2] defining
// the line. The vector v=q2-q1 will be oriented in the negative y direction.
// NOTE: this bisects LINES not SEGMENTS.
//------------------------------------------------------------
function smallAngleBisectSegments(s1, s2, optIntersect) {
  if (parallelTest(s1, s2)) {
    console.log("Parallel Sites:" + s1.a.fileId + " and " + s2.a.fileId
     + " - using average");
    return {
      line: getAverage(s1, s2),
      optPoint: null
    };
  }
  // get the closest points
  var d1 = dist(s1.a, s2.a);
  var d2 = dist(s1.a, s2.b);
  var d3 = dist(s1.b, s2.a);
  var d4 = dist(s1.b, s2.b);
  if (d1 < d2 && d1 < d3 && d1 < d4) {
  } else if (d2 < d1 && d2 < d3 && d2 < d4) {
    s2 = makeSegment(s2.b, s2.a, true);
  } else if (d3 < d1 && d3 < d2 && d3 < d4) {
    s1 = makeSegment(s1.b, s1.a, true);
  } else if (d4 < d1 && d4 < d2 && d4 < d3) {
    s1 = makeSegment(s1.b, s1.a, true);
    s2 = makeSegment(s2.b, s2.a, true);
  }

  var beta = getSegmentsBisectorAngle(s1, s2, false);
  var v = new vec3(Math.cos(beta), Math.sin(beta), 0);
  var p = optIntersect ? optIntersect : intersectLines(s1.a, s1.b, s2.a, s2.b);
  if (!p) {
    console.log("Unable to determine intersect between:" + s1.a.fileId + " and " + s2.a.fileId
     + " - using average");
    return {
      line: getAverage(s1, s2),
      optPoint: null
    };
  }
  var l = new Line(p, add(p, v));
  return {
    line: l,
    optPoint: p
  };
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
  var bisector = null;
  if (a.type == 'vec' && b.type == 'vec') {
    // Returns a line
    bisector = bisectPoints(a, b);
  } else if (a.type == 'vec') {
    bisector = bisectPointSegment(a, b);
  } else if (b.type == 'vec') {
    bisector = bisectPointSegment(b, a);
  }
  // } else {
  //   // bisector = bisectSegmentsWithHint(a, b, pointHint);
  // }
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
    intersection = a.intersect(b);
  }
  return intersection;
}

//------------------------------------------------------------
// equidistant
//
// Returns the point equidistant from points/segments c1, c2, and c3.
// Function returns an array of points
//------------------------------------------------------------
function equidistant(left, arc, right) {
  var segments = _.filter([left, arc, right], { type: "segment" });
  var points = _.filter([left, arc, right], { type: "vec" });
  var b1, b2;
  // Bisecting types can be either lines or parabolas - lines are preferred
  if (points.length == 1) {
    if (parallelTest(segments[0], segments[1])) {
      // console.log("parallel sites");
      b1 = getAverage(segments[0], segments[1]);
      b2 = bisect(segments[0], points[0]);
    } else {
      if (points[0] == segments[0].a || points[0] == segments[0].b) {
        b1 = bisect(segments[0], points[0]);
        b2 = bisect(points[0], segments[1]);
      } else if (points[0] == segments[1].a || points[0] == segments[1].b) {
        b1 = bisect(segments[1], points[0]);
        b2 = bisect(points[0], segments[0]);
      } else {
        b1 = bisect(segments[0], points[0]);
        if (g_addDebug) g_debugObjs.push(b1);
        var blines = bisectSegments2(segments[0], segments[1]);
        var ii = [];
        _.forEach(blines, function(line) {
          if (g_addDebug) g_debugObjs.push(line);
          var i = intersect(line, b1);
          ii = _.concat(ii, i);
        });
        return ii;
      }
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
    if (blines.left.length === 0 || blines.right.length === 0) return null;
    return intersectLeftRightLines(blines.left, blines.right);
  } else {
    b1 = bisect(left, arc);
    b2 = bisect(arc, right);
  }

  // debugging only
  // if (g_addDebug) {
  //   g_debugObjs.push(b1);
  //   g_debugObjs.push(b2);
  // }
  // always return an array or nil
  var i = intersect(b1, b2);
  if (!i || i.length === 0) return null;
  if (i.type && i.type === "vec") return [i];
  return i;
}
