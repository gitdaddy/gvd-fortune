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

// Return the line bisecting two points. v will be oriented
// in the negative y direction.
function getPointsBisector(p1, p2) {
  var v = subtract(p2, p1);
  var q = add(p1, mult(v, 0.5));
  [v.x, v.y] = [-v.y, v.x];
  if (v.y > 0) {
    v = negate(v);
  }
  return v;
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
  return s;
}

function isSegment(s) {
  return (Array.isArray(s) && s.length == 2 && Array.isArray(s[0]));
}

// Returns the point equidistant from points c1, c2, and c3
function equidistant(c1, c2, c3) {
  // // TODO handle segment case
  // if (isSegment(c1)) c1 = c1[0];
  // if (isSegment(c2)) c2 = c2[0];
  // if (isSegment(c3)) c3 = c3[0];
  var u = mult(0.5, subtract(c1, c2));
  var p0 = add(c2, u);
  var v = normalize(vec3(-u[1], u[0], 0));
  var a = dot(u, u);
  var p0p3 = subtract(p0, c3);
  var t = (-dot(p0p3, p0p3) + a) / (2 * dot(p0p3, v));
  return vec3(add(p0, mult(t, v)));
}
