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

function createBeachlineSegment(site, directrix) {
  if (isSegment(site)) {
    return new V(site, directrix);
  }
  return createParabola(site, directrix);
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

//------------------------------------------------------------
// Beachline
//------------------------------------------------------------

// Logic in the remove method depends on these two values
// being 0 and 1.
const LEFT_CHILD = 0;
const RIGHT_CHILD = 1;

var Beachline = function (dcel) {
  this.root = null;
  this.dcel = dcel;
}
//------------------------------------------------------------
// Utility functions
//

function shareVClosing(arcNode, sibling) {
  if (!arcNode.isV || !sibling.isV) return false;
  return _.get(arcNode, "site.b.relation") == NODE_RELATION.CLOSING &&
  _.get(sibling, "site.b.relation") == NODE_RELATION.CLOSING &&
   equal(arcNode.site.b, sibling.site.b);
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
function canClose(left, arcNode, right, equi, directrix) {
  if (arcNode.isV) {
    let segV = createBeachlineSegment(arcNode.site, directrix);
    siteX = segV.p.x;
    b1 = arcNode.getHorizontalBounds(segV.p.y);
    return b1.x0 < siteX && b1.x1 < siteX && equi.x < siteX || b1.x0 > siteX && b1.x1 > siteX && equi.x > siteX;
  } else {
    var seg;
    if (left.isV && belongsToSegment(arcNode, left)) {
      seg = left.site;
    } else if (right.isV && belongsToSegment(arcNode, right)) {
      seg = right.site;
    } else {
      return true;
    }
    let segV = createBeachlineSegment(seg, directrix);
    // use the outer bounds
    var b1 = arcNode.getHorizontalBounds(directrix);
    return b1.x0 < segV.p.x && equi.x < segV.p.x || b1.x1 > segV.p.x && equi.x > segV.p.x;
  }
}

//------------------------------------------------------------
// createCloseEvent
//------------------------------------------------------------
function createCloseEvent(arcNode, directrix) {
  if (arcNode == null) return null;
  var left = arcNode.prevArc();
  var right = arcNode.nextArc();
  if (left == null || right == null) return null;

  // if (left.id == 8 && arcNode.id == 9 && right.id == 7) {
  if (arcNode.id == 16) {
    g_addDebug = true;
    // debugger;
  } else {
    g_addDebug = false;
  }

  if (arcNode.isV) {
    // for same site nan parabola error
    directrix -= 0.0001;
    if (arcNode.site.a == left.site && arcNode.site.b == right.site
      || arcNode.site.b == left.site && arcNode.site.a == right.site) return null;

    // If siblings reference the same closing node don't let them close until
    // the closing node is processed
    if (shareVClosing(arcNode, left) || shareVClosing(arcNode, right)) return null;

    let equi = equidistant(left.site, arcNode.site, right.site);
    if (equi == null || equi.length == 0) return null;

    if (equi.length == 2) {
      let segV = createBeachlineSegment(arcNode.site, directrix);
      // get the point that is closest the corresponding arc center point
      var b1 = arcNode.getHorizontalBounds(directrix);
      var centerArcX = (b1.x0 + b1.x1) / 2;
      var centerPoint = vec3(centerArcX, segV.f(centerArcX), 0);
      equi = _.sortBy(equi, function (e) {
        return dist(centerPoint, e);
      })[0];
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
   if (canClose(left, arcNode, right, equi, directrix)){
    return new CloseEvent(newY, arcNode, left, right, equi, r);
   }
  } else if (isSegment(left.site) || isSegment(right.site)) {
    let equi = equidistant(left.site, arcNode.site, right.site);
    if (equi == null || equi.length == 0) return null;
    if (equi.length == 2) {
      var sorted = _.sortBy(equi, function (p) { return p.x; });
      if (belongsToSegment(arcNode, right)) {
        equi = sorted[0];
      } else if (belongsToSegment(left, arcNode)) {
        equi = sorted[1];
      } else {
        let bSeg = createBeachlineSegment(arcNode.site, directrix);
        var b1 = arcNode.getHorizontalBounds(directrix);
        var centerArcX = (b1.x0 + b1.x1) / 2;
        var centerPoint = vec3(centerArcX, bSeg.f(centerArcX), 0);
        equi = _.sortBy(equi, function (e) {
          return dist(centerPoint, e);
        })[0];
      }
    }
    let r = dist(equi, arcNode.site);
    if (!r) return null;

    if (canClose(left, arcNode, right, equi, directrix)) {
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

//------------------------------------------------------------
// add
//------------------------------------------------------------
Beachline.prototype.add = function (site) {
  var arcNode = new ArcNode(site);
  var directrix = site.y;
  // move the directrix slightly downward for segments
  if (site.type == "segment") {
    directrix -= 0.0001;
  }

  if (this.root == null) {
    this.root = arcNode;
  } else if (this.root.isArc) {
    this.root = splitArcNode(this.root, arcNode, this.dcel);
  } else {
    // Do a binary search to find the arc node that the new
    // site intersects with
    var parent = this.root;
    var x = parent.intersection(directrix).x;
    var side = (site.x < x) ? LEFT_CHILD : RIGHT_CHILD;
    var parentSide = side;
    var child = parent.getChild(side);
    while (child.isEdge) {
      parent = child;
      x = parent.intersection(directrix).x;
      // if (site.x == x) {
        // console.log("Site and intersect values equal:" + x + " for intersection: " + parent.id);
      // }
      parentSide = side;
      side = (site.x < x) ? LEFT_CHILD : RIGHT_CHILD;
      child = parent.getChild(side);
    }

    // TODO clean this up
    var siblingLeft = child.prevArc();
    var siblingRight = child.nextArc();
    if (arcNode.isV && arcNode.site.a.y == arcNode.site.b.y) {
      // horizontal insert
      horizontalInsert(child, left, arcNode, right, dcel);
    } else if (arcNode.isV && child.isV &&
       _.get(arcNode, "site.a.relation", false) == NODE_RELATION.TOP) {
        var vC = subtract(child.site.b, arcNode.site.a);
        var vN = subtract(arcNode.site.b, arcNode.site.a);
        var z0 = cross(vC, vN).z;
      var newChild;
      if (z0 < 0) {
        newChild = topSplitSiblings(siblingLeft, arcNode, child, dcel);
      } else {
        newChild = topSplitSiblings(child, arcNode, siblingRight, dcel);
      }
      parent.setChild(newChild, side);
    } else if (arcNode.isV &&
       _.get(arcNode, "site.a.relation", false) == NODE_RELATION.CHILD_LEFT_HULL) {
      // Set edge information since we are using a left joint split
      child.nextEdge().dcelEdge.generalEdge = false;
      var newNode = leftJointSplit(child, arcNode, siblingRight, dcel);
      // set the parent since a left joint split may not preserve order
      parent.parent.setChild(newNode, parentSide);
    } else if (arcNode.isV &&
       _.get(arcNode, "site.a.relation", false) == NODE_RELATION.CHILD_RIGHT_HULL) {
      // Set edge information since we are using a right joint split
      child.prevEdge().dcelEdge.generalEdge = false;
      // is a arc created by the right hull joint
      var newNode = rightJointSplit(arcNode, child, siblingRight, dcel);
      parent.parent.setChild(newNode, parentSide);
    }
    else if (arcNode.isParabola && _.get(arcNode, "site.relation", false) == NODE_RELATION.CLOSING) {
      var updateEdge = child.prevEdge();
      if (siblingRight.isV && child.isV && equal(child.site.b, siblingRight.site.b)) {
        updateEdge = child.nextEdge();
      }

      if (updateEdge){
        updateEdge.dcelEdge.dest.overridden = true;
        updateEdge.dcelEdge.dest.point = arcNode.site;
      }
      if (_.get(child, "site.b.relation") == NODE_RELATION.CLOSING &&
          _.get(siblingRight, "site.b.relation") == NODE_RELATION.CLOSING &&
          equal(child.site.b, siblingRight.site.b)) {
        var newNode = closePointSplit(child, arcNode, dcel);
        parent.setChild(newNode, side);
      } else {
        var newNode = closePointSplit(arcNode, child, dcel);
        parent.setChild(newNode, side);
      }
    }
    else {
      // Child is an arc node. Split it.
      parent.setChild(splitArcNode(child, arcNode, this.dcel), side);
    }
  }

  // Create close events
  var closeEvents = [];
  var left = arcNode.prevArc();
  var right = arcNode.nextArc();
  if (arcNode.isParabola &&
    _.get(arcNode, "site.relation", false) == NODE_RELATION.CHILD_LEFT_HULL) {
    addCloseEvent(closeEvents, createCloseEvent(left, directrix));
  } else if (arcNode.isParabola &&
      _.get(arcNode, "site.relation", false) == NODE_RELATION.CHILD_RIGHT_HULL) {
    addCloseEvent(closeEvents, createCloseEvent(right, directrix));
  } else {
    addCloseEvent(closeEvents, createCloseEvent(left, directrix));
    addCloseEvent(closeEvents, createCloseEvent(right, directrix));
  }
  return closeEvents;
}

//------------------------------------------------------------
// remove
//------------------------------------------------------------
Beachline.prototype.remove = function (arcNode, point, directrix) {
  if (!arcNode.isArc) throw "Unexpected edge in remove";

  var parent = arcNode.parent;
  var grandparent = parent.parent;
  var side = (parent.left == arcNode) ? LEFT_CHILD : RIGHT_CHILD;
  var parentSide = (grandparent.left == parent) ? LEFT_CHILD : RIGHT_CHILD;

  // Get newEdge (an EdgeNode) before updating children etc.
  var newEdge = arcNode.nextEdge();
  if (side == LEFT_CHILD) {
    newEdge = arcNode.prevEdge();
  }

  var sibling = parent.getChild(1 - side);
  grandparent.setChild(sibling, parentSide);
  sibling.parent = grandparent;

  newEdge.updateEdge(point, this.dcel);
  arcNode.closeEvent.live = false;

  // Cancel the close event for this arc and adjoining arcs.
  // Add new close events for adjoining arcs.
  var closeEvents = [];
  var prevArc = newEdge.prevArc();
  if (prevArc.closeEvent) {
    prevArc.closeEvent.live = false;
  }
  var e = createCloseEvent(prevArc, directrix);
  if (e != null) {
    closeEvents.push(e);
  }
  var nextArc = newEdge.nextArc();
  if (nextArc.closeEvent) {
    nextArc.closeEvent.live = false;
  }
  var e = createCloseEvent(nextArc, directrix);
  if (e != null) {
    closeEvents.push(e);
  }
  return closeEvents;
}

//------------------------------------------------------------
// render
//------------------------------------------------------------

// Sets points on arc elements ready for drawing using whatever
// method. Also gets events and active surface lines and parabolas.
Beachline.prototype.prepDraw = function (
  directrix, node, leftx, rightx, arcElements, lines, generalSurfaces, events) {
  if (node.isArc) {
    arcElements.push(node.createDrawElement(leftx, rightx, directrix));
  } else {
    // The point where this edge node was born
    var origin = node.dcelEdge.origin.point;
    // The intersection between the edge node's defining arc nodes
    var p = node.intersection(directrix);

    if (p.x < leftx && Math.abs(leftx - p.x) > 0.00001) {
      let msg = `intersection is less than leftx: ${p.x} < ${leftx}.` +
        `id = ${node.id}`;
      console.error(msg);
    }

    if (!Number.isNaN(origin.x) && !Number.isNaN(origin.y)) {
      events.push(origin);
    }

    if (!Number.isNaN(origin.x) && !Number.isNaN(origin.y) &&
      !Number.isNaN(p.x) && !Number.isNaN(p.y)) {
      if (node.isGeneralSurface) {
        var point;
        var segment;
        var next = node.nextArc();
        var prev = node.prevArc();
        if (prev.isV && next.isParabola) {
          segment = prev.site;
          point = next.site;
        } else if (prev.isParabola && next.isV) {
          point = prev.site;
          segment = next.site;
        } else {
          throw "Error edge node marked as general surface but is not between a V and parabola";
        }

        if (!node.flipped || !belongsToSegment(node.prevArc(), node.nextArc())) {
          var gp = createGeneralParabola(point, segment);
          var idStr = next.id.toString() + "-" + prev.id.toString();
          // console.log("ID: " + idStr + " origin:" + origin + " - dest:" + p);
          gp.prepDraw(idStr, origin, p);
          generalSurfaces.push(gp);
        }
      } else {
        lines.push({ x0: origin.x, y0: origin.y, x1: p.x, y1: p.y, id: node.id, connectedToGVD: node.connectedToGVD });
      }
    }

    // check V left
    this.prepDraw(directrix, node.left, leftx, p.x, arcElements, lines, generalSurfaces, events);
    if (p.x < rightx) {
      // We can ignore anything outside our original bounds.
      this.prepDraw(directrix, node.right, p.x, rightx, arcElements, lines, generalSurfaces, events);
    }
  }
}
