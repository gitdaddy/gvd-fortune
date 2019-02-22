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

function parseEquiPoints(closePoints, arcNode) {
  var sorted = _.sortBy(closePoints, function (p) { return p.x; });
  if (arcNode.isParabola) {
    if (belongsToSegment(arcNode, arcNode.nextArc())) {
      return sorted[0];
    } else if (belongsToSegment(arcNode.prevArc(), arcNode)) {
      return sorted[1];
    }
    return arcNode.isLeftChild ? sorted[0] : sorted[1];
  } else { // arcNode is a V
    // if (_.isUndefined(arcNode.isLeftChild)) {
    //   console.error("found arcNode with undefined property that should be defined");
    //   return null;
    // }
    // Test that this is correct
    var centerArcX = (arcNode.x0 + arcNode.x1) / 2;
    return Math.abs(sorted[0].x - centerArcX) < Math.abs(sorted[1].x - centerArcX) ?
      sorted[0] : sorted[1];

    // if (arcNode.isLeftChild) {
    //   var centerArcX = (arcNode.x0 + arcNode.x1) / 2;
    //   // if both points lie to the left of the left child get the closest
    //   if (sorted[0].x < centerArcX && sorted[1].x < centerArcX) {
    //     return Math.abs(sorted[0].x - centerArcX) < Math.abs(sorted[1].x - centerArcX) ?
    //       sorted[0] : sorted[1];
    //   }
    //   return sorted[0];
    // } else if (sorted[0].x > centerArcX && sorted[1].x > centerArcX) {
    //   return Math.abs(sorted[0].x - centerArcX) < Math.abs(sorted[1].x - centerArcX) ?
    //     sorted[0] : sorted[1];
    // }
    return sorted[1];
  }
}

// Set all node bounds x0 and x1 for all arc nodes
// in the beachline
function updateArcBounds(node, leftx, rightx, directrix) {
  if (node.isArc) {
    // set bounds
    node.x0 = leftx;
    node.x1 = rightx;
    return;
  }
  // else node is an edge node
  // The intersection between the edge node's defining arc nodes
  var p = node.intersection(directrix);

  if (Number.isNaN(p) || _.isUndefined(p)) return;

  if (p.x < leftx && Math.abs(leftx - p.x) > 0.0001) {
    let msg = `bound intersection is less than leftx: ${p.x} < ${leftx}.` +
      `id = ${node.id}`;
    console.error(msg);
  }

  // check left then right
  updateArcBounds(node.left, leftx, p.x, directrix);
  updateArcBounds(node.right, p.x, rightx, directrix);
}

function addCloseEvent(events, newEvent) {
  var search = function (event) {
    var tolerance = 0.0001;
    return (Math.abs(newEvent.point.x - event.point.x) < tolerance
      && Math.abs(newEvent.point.y - event.point.y) < tolerance);
  };
  if (newEvent == null) return;
  var existing = _.filter(events, search);
  if (_.isEmpty(existing)) {
    events.push(newEvent);
  } else {
    // If there is a tie use the event with the closest arcNode
    if (!_.isUndefined(existing[0].arcNode.x0) && !_.isUndefined(newEvent.arcNode.x0)) {
      if (Math.abs(newEvent.arcNode.x0 - newEvent.point.x)
        < Math.abs(existing[0].arcNode.x0 - newEvent.point.x)) {
        var idx = _.findIndex(events, search);
        if (idx == -1) return;
        // replace the old event
        events[idx] = newEvent;
      } // otherwise leave the existing event in place
    }
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
  var vertex = vec3(x, y, 0);
  var left = toSplit;
  var right = new ArcNode(toSplit.site);
  left.isLeftChild = true;
  right.isLeftChild = false;
  node.isLeftChild = true;
  return new EdgeNode(left, new EdgeNode(node, right, vertex, dcel),
    vertex, dcel);
}

//------------------------------------------------------------
// createCloseEvent
//------------------------------------------------------------
function createCloseEvent(arcNode) {
  if (arcNode == null) return null;
  var left = arcNode.prevArc();
  var right = arcNode.nextArc();
  if (left != null && right != null) {
    if (isSegment(left.site) || isSegment(right.site)) {
      let equi = equidistant(left.site, arcNode.site, right.site);
      if (equi == null) return null;
      if (equi.length == 2) {
        equi = parseEquiPoints(equi, arcNode);
      }
      let r = dist(equi, arcNode.site);
      return new CloseEvent(equi.y - r, arcNode, left, right, equi, r);
    } else if (isSegment(arcNode.site)) {
      if (arcNode.site.a == left.site && arcNode.site.b == right.site
        || arcNode.site.b == left.site && arcNode.site.a == right.site) return null;
      let equi = equidistant(left.site, right.site, arcNode.site);
      if (equi == null) return null;
      if (equi.length == 2) {
        equi = parseEquiPoints(equi, arcNode);
      }

      // // get x0 and x1 for the arc node
      if (_.isUndefined(arcNode.x0) || _.isUndefined(arcNode.x1)
        || _.isUndefined(left.x0) || _.isUndefined(left.x1)
        || _.isUndefined(right.x0) || _.isUndefined(right.x1)) {
        throw "Error - Arc Node with undefined bounds";
      }

      var centerArcX = (arcNode.x0 + arcNode.x1) / 2;
      var centerLeftX = (left.x0 + left.x1) / 2;
      var centerRightX = (right.x0 + right.x1) / 2;

      // if the equidistant point lies between the center and the left or the center and the right
      if (centerArcX > equi.x && equi.x > centerLeftX
        || centerArcX < equi.x && equi.x < centerRightX) {
        // radius between point and segment
        let r = dist(equi, arcNode.site);
        return new CloseEvent(equi.y - r, arcNode, left, right, equi, r);
      }
    } else {
      // All three are points
      var equi = equidistant(left.site,
        arcNode.site,
        right.site);
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
    arcNode.x0 = -1;
    arcNode.x1 = 1;
    this.root = arcNode;
  } else if (this.root.isArc) {
    this.root = splitArcNode(this.root, arcNode, this.dcel);
  } else {
    // Do a binary search to find the arc node that the new
    // site intersects with
    var parent = this.root;
    var x = parent.intersection(directrix).x;
    var side = (site.x < x) ? LEFT_CHILD : RIGHT_CHILD;
    var child = parent.getChild(side);
    while (child.isEdge) {
      parent = child;
      x = parent.intersection(directrix).x;
      // // what if x and site.x are equal?
      side = (site.x < x) ? LEFT_CHILD : RIGHT_CHILD;
      child = parent.getChild(side);
    }
    // Child is an arc node. Split it.
    parent.setChild(splitArcNode(child, arcNode, this.dcel), side);
    // TEST - assumes the sweepline is moving down in a negative direction
    updateArcBounds(this.root, -10000, 10000, directrix - 0.0001);
  }

  // Create close events
  var closeEvents = [];
  addCloseEvent(closeEvents, createCloseEvent(arcNode.prevArc()));
  addCloseEvent(closeEvents, createCloseEvent(arcNode.nextArc()));
  return closeEvents;
}

//------------------------------------------------------------
// remove
//------------------------------------------------------------
Beachline.prototype.remove = function (arcNode, point) {
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
  // updateArcBounds(this.root, -1, 1, directrix); // NEED THIS HERE?
  // Cancel the close event for this arc and adjoining arcs.
  // Add new close events for adjoining arcs.
  var closeEvents = [];
  var prevArc = newEdge.prevArc();
  if (prevArc.closeEvent) {
    prevArc.closeEvent.live = false;
  }
  var e = createCloseEvent(prevArc);
  if (e != null) {
    closeEvents.push(e);
  }
  var nextArc = newEdge.nextArc();
  if (nextArc.closeEvent) {
    nextArc.closeEvent.live = false;
  }
  e = createCloseEvent(nextArc);
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
    var v = node.dcelEdge.origin.point;
    // The intersection between the edge node's defining arc nodes
    var p = node.intersection(directrix);

    if (p.x < leftx && Math.abs(leftx - p.x) > 0.00001) {
      let msg = `intersection is less than leftx: ${p.x} < ${leftx}.` +
        `id = ${node.id}`;
      console.error(msg);
    }

    if (!Number.isNaN(v.x) && !Number.isNaN(v.y)) {
      events.push(v);
    }

    if (!Number.isNaN(v.x) && !Number.isNaN(v.y) &&
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
        gp.prepDraw(-10000, vec3(v.x, v.y, 0.0), vec3(p.x, p.y, 0.0));
        generalSurfaces.push(gp);
      } else {
        lines.push({ x0: v.x, y0: v.y, x1: p.x, y1: p.y, id: node.id, connectedToGVD: node.connectedToGVD });
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
