// File handles close event logic

//------------------------------------------------------------
// CloseEvent
//
// y is where the event should occur, while point is where the
// arcs will converge into a Voronoi vertex.
//------------------------------------------------------------
var CloseEvent = function (y, arcNode, leftNode, rightNode, point, radius) {
  this.yval = y;
  // Point that is equidistant from the three points
  this.point = point;
  this.arcNode = arcNode;
  this.leftNode = leftNode;
  this.rightNode = rightNode;
  this.arcNode.closeEvent = this;
  this.isCloseEvent = true;
  this.live = true;
  this.r = radius;
};

Object.defineProperty(CloseEvent.prototype, "y", {
  configurable: true,
  enumerable: true,
  get: function () {
    return this.yval;
  },
});

//------------------------------------------------------------
// createCloseEvent
//------------------------------------------------------------
function createCloseEvent(arcNode, directrix) {
  if (arcNode == null) return null;
  var left = arcNode.prevArc();
  var right = arcNode.nextArc();
  if (left == null || right == null) return null;

  if (arcNode.isV) {
    // for same site nan parabola error
    directrix -= 1e-10;
    if (arcNode.site.a == left.site && arcNode.site.b == right.site
      || arcNode.site.b == left.site && arcNode.site.a == right.site) return null;

    // If siblings reference the same closing node don't let them close until
    // the closing node is processed
    if (shareVClosing(arcNode, left) || shareVClosing(arcNode, right)) return null;

    // can compute up to 6 equi points
    let equi = equidistant(left.site, arcNode.site, right.site);
    if (equi == null || equi.length == 0) return null;
    if (equi.length == 1) equi = equi[0];

    if (equi.length == 2 || equi.length == 3 && equi.type != "vec" || equi.length > 3) {
      // equi = getEquiOfV(equi, left, arcNode, right);
      // TODO find a better solution that doesn't involve the arcs
      // let segV = createBeachlineSegment(arcNode.site, directrix);
      // // get the point that is closest the corresponding arc center point
      // var b1 = arcNode.getHorizontalBounds(directrix);
      // var centerArcX = (b1.x0 + b1.x1) / 2;
      // var centerPoint = vec3(centerArcX, segV.f(centerArcX), 0);
      // equi = _.sortBy(equi, function (e) {
      //   return dist(centerPoint, e);
      // })[0];
      equi = equi[0];
    }
   var r;
   if (left.isV && right.isV) {
    r = Math.min(Math.min(dist(equi, left.site), dist(equi, arcNode.site)), dist(equi, right.site));
   } else {
    var pointSite = _.filter([left.site, arcNode.site, right.site], function(site) {
      return site.type == "vec";
    })[0];
    r = dist(equi, pointSite);
   }
   var newY = equi.y - r;
   if (canClose(left, arcNode, right, equi)){
    return new CloseEvent(newY, arcNode, left, right, equi, r);
   }
  } else if (isSegment(left.site) || isSegment(right.site)) {
    let equi = equidistant(left.site, arcNode.site, right.site);
    if (equi == null || equi.length == 0) return null;
    _.remove(equi, function (e) {
      if (e.type && e.type == "vec")
        return (e.y - dist(e, arcNode.site)) > directrix;
      return false;
    });
    if (equi.length == 0) return null;
    if (equi.length == 1) equi = equi[0];
    if (equi.length == 2) {
      var sorted = _.sortBy(equi, function (p) { return p.x; });
      if (belongsToSegment(arcNode, right)) {
        equi = sorted[0];
      } else if (belongsToSegment(left, arcNode)) {
        equi = sorted[1];
      } else {
        // let bSeg = createBeachlineSegment(arcNode.site, directrix);
        // var b1 = arcNode.getHorizontalBounds(directrix);
        // var centerArcX = (b1.x0 + b1.x1) / 2;
        // var centerPoint = vec3(centerArcX, bSeg.f(centerArcX), 0);
        // equi = _.sortBy(equi, function (e) {
        //   return dist(centerPoint, e);
        // })[0];
        equi = equi[0];
      }
    }

    var r = dist(equi, arcNode.site);
    if (!r) return null;
    if (canClose(left, arcNode, right, equi)) {
      return new CloseEvent(equi.y - r, arcNode, left, right, equi, r);
    }
  } else {
    // All three are points
    var equi = equidistant(left.site, arcNode.site, right.site);
    if (equi == null) return null;
    var u = subtract(left.site, arcNode.site);
    var v = subtract(left.site, right.site);
    // Check if there should be a close event added. In some
    // cases there shouldn't be.
    if (cross(u, v)[2] < 0) {
      let r = length(subtract(arcNode.site, equi));
      let event_y = equi.y - r;
      return new CloseEvent(event_y, arcNode, left, right, equi, r);
    }
  }
  return null;
}

/* Return true or false if the arcNode should be able to close in the designated spot
   Does the shared segment run between p1 and equi/close point?
   Arc node must be a parabola arc for this test
   If the segment divides the start of the parabola and the close point then it cannot close
   true otherwise
   |
    *p1   * a
     \    |
      \   |      * close
       \  |
        \ | /
         \|/
          * b
*/
function canClose(left, arcNode, right, equi) {
  if (arcNode.isV) {
    // if the V is arcing with the top parabola then both sites must coincide
    if (left.isParabola && right.isParabola && equal(arcNode.site.a, left.site)) {
      // the right site should be on the left of the segment
      var v1 = subtract(arcNode.site.a, arcNode.site.b);
      var v2 = subtract(right.site, arcNode.site.b);
      return cross(v1, v2).z > 0;
    } else if (right.isParabola && left.isParabola && equal(arcNode.site.a, right.site)) {
      // the left site should be on the right of the segment
      var v1 = subtract(arcNode.site.a, arcNode.site.b);
      var v2 = subtract(left.site, arcNode.site.b);
      return cross(v1, v2).z < 0;
    }
    return true;
  } else {
    // If the circle created intersects the segment site that is a part
    // of the current, left or right arcs then it cannot be on the gvd
    var r = dist(arcNode.site, equi);
    var leftMostArc = left.prevArc();
    var rightMostArc = right.nextArc();
    if (leftMostArc && left.isParabola && leftMostArc.isV && belongsToSegment(left, leftMostArc)) {
      var int = inteceptCircleSeg({radius:r, center:equi}, {p1:leftMostArc.site.a,p2:leftMostArc.site.b});
      if (int.length == 2) return false;
    }
    if (arcNode.isParabola && left.isV && belongsToSegment(arcNode, left)) {
      var int = inteceptCircleSeg({radius:r, center:equi}, {p1:left.site.a,p2:left.site.b});
      if (int.length == 2) return false;
    }
    if (arcNode.isParabola && right.isV && belongsToSegment(arcNode, right)) {
      var int = inteceptCircleSeg({radius:r, center:equi}, {p1:right.site.a,p2:right.site.b});
      if (int.length == 2) return false;
    }
    if (rightMostArc && right.isParabola && rightMostArc.isV && belongsToSegment(right, rightMostArc)) {
      var int = inteceptCircleSeg({radius:r, center:equi}, {p1:rightMostArc.site.a,p2:rightMostArc.site.b});
      if (int.length == 2) return false;
    }

    // cross product test
    var seg;
    if (left.isV && belongsToSegment(arcNode, left)) {
      seg = left.site;
    } else if (right.isV && belongsToSegment(arcNode, right)) {
      seg = right.site;
    } else {
      return true;
    }
    // let segV = createBeachlineSegment(seg, directrix);
    // // use the outer bounds
    // var b1 = arcNode.getHorizontalBounds(directrix);
    // return b1.x0 < segV.p.x && equi.x < segV.p.x || b1.x1 > segV.p.x && equi.x > segV.p.x;
    return true;
  }
}

function addCloseEvent(events, newEvent) {
  var search = function (event) {
    var tolerance = 0.00001;
    return (Math.abs(newEvent.point.x - event.point.x) < tolerance
      && Math.abs(newEvent.point.y - event.point.y) < tolerance);
  };
  if (newEvent == null) return;
  var existing = _.filter(events, search);
  if (_.isEmpty(existing)) {
    events.push(newEvent);
  } else {
    var idx = _.findIndex(events, search);
    if (idx == -1) return;
    // replace the old event
    events[idx] = newEvent;
  }
}

function processCloseEvents(arcNode, directrix) {
  // Create close events
  var closeEvents = [];
  if (arcNode.isParabola &&
    _.get(arcNode, "site.relation") == NODE_RELATION.CHILD_LEFT_HULL) {
    addCloseEvent(closeEvents, createCloseEvent(arcNode.prevArc(), directrix));
  } else if (arcNode.isParabola &&
      _.get(arcNode, "site.relation") == NODE_RELATION.CHILD_RIGHT_HULL) {
    addCloseEvent(closeEvents, createCloseEvent(arcNode.nextArc(), directrix));
  } else {
    addCloseEvent(closeEvents, createCloseEvent(arcNode.prevArc(), directrix));
    addCloseEvent(closeEvents, createCloseEvent(arcNode.nextArc(), directrix));
  }
  return closeEvents;
}
