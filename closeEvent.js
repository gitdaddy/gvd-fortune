// File handles close event logic

let g_eventId = 0;

//------------------------------------------------------------
// CloseEvent
//
// y is where the event should occur, while point is where the
// arcs will converge into a Voronoi vertex.
//------------------------------------------------------------
var CloseEvent = function (y, arcNode, point, radius, minR) {
  this.yval = y;
  // Point that is equidistant from the three points
  this.point = point;
  this.arcNode = arcNode;
  this.arcNode.closeEvent = this;
  this.isCloseEvent = true;
  this.live = true;
  this.r = radius;
  this.minR = minR;
  this.id = g_eventId++;
  // this.id = leftNode.id + "-" + arcNode.id + "-" + rightNode.id;
};

///////////////////// Utility Functions ///////////////////////////////////

function validDiff(diff, id) {
  // WATCH VALUE
  var MAX_DIFF = 1e-2;
  if (diff > MAX_DIFF){
    // console.log("Max diff exceeded when closing node:" + id + " value:" + diff);
    return false;
  }
  return true;
}

function getDiff(left, node, right, p, directrix) {
  if (!p) {
    console.error("Diff point invalid");
    return 1e10;
  }

  var radius = getRadius(p, left, node, right);
  var newY = p[1] - radius;
  var newYErrorMargin = p[1] - (radius + 1e-13);
  // rule out points too far above the directrix
  if (newY > directrix && newYErrorMargin > directrix) return 1e10;

  // Option: or test that left and right intersection
  var i0 = getIntercept(left, node, newY);
  var i1 = getIntercept(node, right, newY);
  if (!i0 || !i1) return 1e10;

  // left right test
  if (node.isV) {
    var s = node.site;
    if (!isRightOfLine(s.a, s.b, i0) && isRightOfLine(s.a, s.b, i1))
      return 1e10;
  }

  var diff0X = Math.abs(i0[0] - p[0]);
  var diff0Y = Math.abs(i0[1] - p[1]);
  var d1 = diff0X + diff0Y;
  var diff1X = Math.abs(i1[0] - p[0]);
  var diff1Y = Math.abs(i1[1] - p[1]);
  var d2 = diff1X + diff1Y;
  return d1 > d2 ? d1 : d2;
}

function getRadius(point, left, node, right) {
  // given a point and nodes return the radius
  if (left.isV && node.isV && right.isV) {
    return Math.min(Math.min(dist(point, left.site), dist(point, node.site)), dist(point, right.site));
   } else {
    var pointSite = _.filter([left.site, node.site, right.site], function(site) {
      return site.type == "vec";
    })[0];
    return dist(point, pointSite);
   }
}

function getIntercept(left, right, directrix) {
  var obj = {};
  if (left.isV && right.isV) {
    obj = intersectStraightArcs(left, right, directrix);
  } else if (left.isV || right.isV) {
    obj = intersectParabolicToStraightArc(left, right, directrix);
  } else {
    obj = intersectParabolicArcs(left, right, directrix);
  }
  if (!obj) return null;
  return obj.results[obj.resultIdx];
}

// return the most viable close points out of a list of close points
// based on arc size @ point
function chooseClosePoint(left, node, right, points, directrix) {
  if (_.isEmpty(points)) return null;
  if (points.length === 1) return points[0];
  var leastDiff = 10000;
  // length test - the length of node's arc should be close to 0
  // for the correct point
  var validPoints = _.sortBy(points, function (p) {
    var diff = getDiff(left, node, right, p, directrix);
    if (diff < leastDiff)
     leastDiff = diff;
    return diff;
  });
  if (!validDiff(leastDiff)) return null;
  return validPoints[0];
}

//------------------------------------------------------------
//  createCloseEventFortune
//------------------------------------------------------------
function createCloseEventFortune(arcNode) {
  var e0 = arcNode.prevEdge();
  var e1 = arcNode.nextEdge();
  if (!e0 || !e1) return null;

  var v0 = e0.halfEdge;
  var v1 = e1.halfEdge;

  var optIntersect;
  if (v0.isVec && v1.isVec) {
    optIntersect = rayToRayIntersect(v0.p, v0.v, v1.p, v1.v);
  } else if (v0.isParabola && v1.isParabola) {
    console.log("TODO");
  } else if (v0.isVec) {
    console.log("TODO");
  } else {
    console.log("TODO");
  }

  if (!optIntersect) return null;

  // var radius = getRadius(optIntersect, left, arcNode, right);
  var radius = dist(optIntersect, arcNode.site);
  if (_.isUndefined(radius)) throw "invalid radius";


  var left = arcNode.prevArc();
  var right = arcNode.nextArc();

  // minR
  var minR = Math.min(minSiteDist(left.site, arcNode.site), minSiteDist(arcNode.site, right.site));
  minR = Math.min(minR, radius);
  return new CloseEvent(optIntersect[1] - radius, arcNode, optIntersect, radius, minR);
}

//------------------------------------------------------------
// createCloseEvent
//------------------------------------------------------------
function createCloseEvent(arcNode, directrix) {
  if (arcNode == null) return null;

  // for testing only until finished
  // return createCloseEventFortune(arcNode);

  var left = arcNode.prevArc();
  var right = arcNode.nextArc();
  if (left == null || right == null) return null;
  var closePoint;

  // debugging only
  if (left.id === g_debugIdLeft && right.id === g_debugIdRight) {
    g_addDebug = true;
  } else {
    g_addDebug = false;
  }

  if (arcNode.isParabola && left.isParabola && right.isParabola) {
    // All three are points
    var equi = equidistant(left.site, arcNode.site, right.site);
    if (!equi) {
      // console.log("Equi point null between 3 point sites");
      return null;
    }
    closePoint = equi[0];
    if (closePoint == null) return null;
    var u = subtract(left.site, arcNode.site);
    var v = subtract(left.site, right.site);
    // Check if there should be a close event added. In some
    // cases there shouldn't be.
    if (cross(u, v)[2] < 0) {
      let r = length(subtract(arcNode.site, closePoint));
      let event_y = closePoint[1] - r;
      var minR = Math.min(minSiteDist(left.site, arcNode.site), minSiteDist(arcNode.site, right.site));
      minR = Math.min(minR, radius);
      return new CloseEvent(event_y, arcNode, closePoint, r, minR);
    }
    return null;
  }

  // if (arcNode.isV) {
  //   if (arcNode.site.a == left.site && arcNode.site.b == right.site
  //     || arcNode.site.b == left.site && arcNode.site.a == right.site) return null;
  //   // If siblings reference the same closing node don't let them close until
  //   // the closing node is processed
  //   if (shareVClosing(arcNode, left) || shareVClosing(arcNode, right)) return null;
  // }

  // can compute up to 6 equi points
  var points = equidistant(left.site, arcNode.site, right.site);

  // debugging only
  if (g_addDebug) {
    _.forEach(points, function(p) {
      g_debugObjs.push(p);
    });
  }

  // guilty by association
  _.forEach([left, arcNode, right], function(node) {
    points = node.isV ? filterVisiblePoints(node.site, points) : points;
  });

  if (points == null || points.length == 0) return null;

  // filter by site association
  points = filterBySiteAssociation(left, arcNode, right, points);

  if (points == null || points.length == 0) return null;
  if (points.length == 1) {
    closePoint = points[0];
    var diff = getDiff(left, arcNode, right, closePoint, directrix);
    if (!validDiff(diff)) return null;
  } else {
    var p = chooseClosePoint(left, arcNode, right, points, directrix);
    if (!p) return null;
    closePoint = p;
  }

  var radius = getRadius(closePoint, left, arcNode, right);
  if (_.isUndefined(radius)) throw "invalid radius";

  var minR = Math.min(minSiteDist(left.site, arcNode.site), minSiteDist(arcNode.site, right.site));
  minR = Math.min(minR, radius);
  return new CloseEvent(closePoint[1] - radius, arcNode, closePoint, radius, minR);
}


function processCloseEvents(closingNodes, directrix) {
  // Create close events
  var closeEvents = [];
  _.forEach(closingNodes, function(node) {
    var e = createCloseEvent(node, directrix);
    if (e)
      closeEvents.push(e);
  });
  return closeEvents;
}
