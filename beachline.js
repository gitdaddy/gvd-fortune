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
    // If there is a tie use the event with the closest arcNode
    // if (!_.isUndefined(existing[0].arcNode.x0) && !_.isUndefined(newEvent.arcNode.x0)) {
    //   if (Math.abs(newEvent.arcNode.x0 - newEvent.point.x)
    //     < Math.abs(existing[0].arcNode.x0 - newEvent.point.x)) {
    //     var idx = _.findIndex(events, search);
    //     if (idx == -1) return;
    //     // replace the old event
    //     events[idx] = newEvent;
    //   } // otherwise leave the existing event in place
    // }
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

// function to split the top node
//   |     |
// _/|__*  | toSplit
//  \ \ | /
//     \|/
//      |
//      | node
//      *
//------------------------------------------------------------
function topSplitSiblings(left, node, right, dcel) {
  // Set live events to dead events?
  var vertex;
  if (left.isV) {
    if (right.closeEvent) {
      right.closeEvent.live = false;
    }
    vertex = vec3(node.site.x, new V(left.site, node.site.y).f(node.site.x));
    return new EdgeNode(left, node, vertex, dcel);
  } else if (right.isV) {
    if (left.closeEvent) {
      left.closeEvent.live = false;
    }
    vertex = vec3(node.site.x, new V(right.site, node.site.y).f(node.site.x));
    return new EdgeNode(node, right, vertex, dcel);
  } else {
    throw "Cannot split siblings";
  }
}

//------------------------------------------------------------
// Utility function left joint split
//  is an arc node. node is also an arc node.
//   |   /
//   |  *
//    \ | /
//     \|/
//      |
//      | node
//      *
//------------------------------------------------------------
function leftJointSplit(left, node, right, dcel) {
  if (!left.isParabola || !right.isV) {
    throw "invalid left joint split";
  }
  if (left.closeEvent) {
    left.closeEvent.live = false;
  }
  return new EdgeNode(new EdgeNode(left, node, left.site, dcel), right, node.site, dcel);
}

//------------------------------------------------------------
// Utility function right joint split
//  is an arc node. node is also an arc node.
//     \   |
//      *  |
//    \ | /
//     \|/
//      |
//      | node
//      *
//------------------------------------------------------------
function rightJointSplit(left, child, right, dcel) {
  if (!left.isV || !child.isParabola || !right.isV) {
    throw "invalid right joint split";
  }
  if (child.closeEvent) {
    child.closeEvent.live = false;
  }
  return new EdgeNode(new EdgeNode(left, child, child.site, dcel), right, child.site, dcel);
}


//------------------------------------------------------------
// Utility function right joint split
//  is an arc node. node is also an arc node.
//   \  |
//    \ |
//     \| node
//      *
//------------------------------------------------------------
function closePointSplit(left, right, dcel) {
  if (left.isV && right.isParabola) {
    return new EdgeNode(left, right, right.site, dcel);
  } else if (left.isParabola && right.isV) {
    return new EdgeNode(left, right, left.site, dcel);
  } else {
    throw "invalid close joint split";
  }
}

//------------------------------------------------------------
// Utility function
// toSplit is an arc node. node is also an arc node.
//
//  |        | toSplit
//   \      /
//    |    ||
//     \__/ |
//          |
//          | node
//          *
//------------------------------------------------------------
function splitArcNode(toSplit, node, dcel) {
  if (toSplit.closeEvent) {
    toSplit.closeEvent.live = false;
  }
  var x = node.site.x;
  var y;
  if (toSplit.isParabola) {
    y = createParabola(toSplit.site, node.site.y).f(x);
  } else {
    y = new V(toSplit.site, node.site.y).f(x);
  }
  // if y is NAN?
  var vertex = vec3(x, y, 0);
  var left = toSplit;
  var right = new ArcNode(toSplit.site);
  return new EdgeNode(left, new EdgeNode(node, right, vertex, dcel),
    vertex, dcel);
}

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
    directrix -= 0.0001;
    if (arcNode.site.a == left.site && arcNode.site.b == right.site
      || arcNode.site.b == left.site && arcNode.site.a == right.site) return null;
    let equi = equidistant(left.site, arcNode.site, right.site);
    if (equi == null || equi.length == 0) return null;
    let segV = createBeachlineSegment(arcNode.site, directrix);
    if (equi.length == 2) {
      // get the point that is closest the corresponding arc center point
      var b1 = arcNode.getHorizontalBounds(directrix);
      var centerArcX = (b1.x0 + b1.x1) / 2;
      var centerPoint = vec3(centerArcX, segV.f(centerArcX), 0);
      equi = _.sortBy(equi, function (e) {
        return dist(centerPoint, e);
      })[0];
    }
   // if close for 3 Vs get the radius as the arcNode's upper site
   var r;
   if (left.isV && right.isV) {
    r = Math.min(Math.min(dist(equi, left.site), dist(equi, arcNode.site)), dist(equi, right.site));
   } else {
    r = dist(equi, arcNode.site);
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
      // if (arcNode.parent.flipped) {
      //   equi = sorted[1]; // always true? test
    // } else if (belongsToSegment(arcNode, right)) {
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
//
// Site is a vec3
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

    var siblingLeft = child.prevArc();
    var siblingRight = child.nextArc();
    if (arcNode.isV && child.isV &&
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
      // TODO update edge info
      // is this a left hull joint
      var newNode = leftJointSplit(child, arcNode, siblingRight, dcel);
      // set the parent since a left joint split may not preserve order
      parent.parent.setChild(newNode, parentSide);
    } else if (arcNode.isV &&
       _.get(arcNode, "site.a.relation", false) == NODE_RELATION.CHILD_RIGHT_HULL) {
      // TODO update edge info
      // child.nextEdge().dcelEdge.dest.point = arcNode.site;
      // is a arc created by the right hull joint
      var newNode = rightJointSplit(arcNode, child, siblingRight, dcel);
      parent.parent.setChild(newNode, parentSide);
    }
    else if (arcNode.isParabola && _.get(arcNode, "site.relation", false) == NODE_RELATION.CLOSING) {
      var updateEdge = child.prevEdge();
      if (updateEdge.isGeneralSurface) {
        updateEdge = child.nextEdge();
      }
      if (updateEdge)
        updateEdge.dcelEdge.dest.point = arcNode.site;
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
        var gp = createGeneralParabola(point, segment);
        // console.log("origin:" + origin + " - p:" + p);
        // TODO fix
        gp.prepDraw(1, vec3(origin.x, origin.y, 0.0), vec3(p.x, p.y, 0.0));
        generalSurfaces.push(gp);
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
