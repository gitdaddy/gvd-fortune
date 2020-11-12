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
};

///////////////////// Utility Functions ///////////////////////////////////

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

//------------------------------------------------------------
//  createCloseEventFortune
//------------------------------------------------------------
function createCloseEventFortune(arcNode) {
  // debugging only
  if (arcNode.id === g_debugIdMiddle) {
    g_addDebug = true;
  } else {
    g_addDebug = false;
  }

  var e0 = arcNode.prevEdge();
  var e1 = arcNode.nextEdge();
  if (!e0 || !e1) return null;

  var v0 = e0.halfEdge;
  var v1 = e1.halfEdge;

  var optIntersect;
  if (v0.isVec && v1.isVec) {
    optIntersect = rayToRayIntersect(v0.p, v0.v, v1.p, v1.v);
  } else if (v0.isPara && v1.isPara) {
    var left = arcNode.prevArc();
    var right = arcNode.nextArc();

    var pointSites = [];
    var segs = [];

    _.each([left.site, arcNode.site, right.site], s => {
      if (s.type === "vec") {
        pointSites.push(s);
      } else {
        segs.push(s);
      }
    });
    var bisectors = [];
    if (pointSites.length === 2 ) {
      bisectors = [bisect(pointSites[0], pointSites[1])];
    } else if (segs.length === 2) {
      bisectors = bisectSegmentsNew(segs[0], segs[1]);
    } else {
      throw "Invalid intersection";
    }

    var pts = [];
    _.each(bisectors, b => {
      // noise reduction
      var Threshold = 400;
      if ((Math.abs(b.p1[0]) + Math.abs(b.p1[1])) > Threshold) {
        console.log("Applying noise reduction");
        if (segs.length !== 2) throw "invalid bisector";
        b = getAverage(segs[0], segs[1]);
      }

      var i0 = v0.gp.intersectRayWithBound(b.p1, b.v, v0.rightSide, v0.p, true);
      var i1 = v1.gp.intersectRayWithBound(b.p1, b.v, v1.rightSide, v1.p, true);
      if (!i0 || !i1) return null;

      var commonPoints = _.filter(i0, ia => {
        var keep = false;
        _.each(i1, ib => {
          if (fastFloorEqual(ia, ib, 5)) keep = true;
        });
        return keep;
      });

      // debug only
      _.each(commonPoints, i => {
          if (g_addDebug) {
            g_debugObjs.push(i);
          }
          pts.push(i);
      });
    });

    if (pts.length > 1) throw "invalid multiple points";
    if (pts.length === 1)
     optIntersect = pts[0];
  } else if (v0.isVec) {
    var i0 = v1.gp.intersectRayWithBound(v0.p, v0.v, v1.rightSide, v1.p);
    if (i0.length !== 1) return null;
    optIntersect = i0[0];
  } else {
    var i0 = v0.gp.intersectRayWithBound(v1.p, v1.v, v0.rightSide, v0.p);
    if (i0.length !== 1) return null;
    optIntersect = i0[0];
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


function processCloseEvents(closingNodes, directrix) {
  // Create close events
  var closeEvents = [];
  _.forEach(closingNodes, function(node) {
    var e = createCloseEventFortune(node);
    if (e)
      closeEvents.push(e);
  });
  return closeEvents;
}
