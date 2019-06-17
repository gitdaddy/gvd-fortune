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

function createBeachlineSegment(site, directrix) {
  if (isSegment(site)) {
    return new V(site, directrix);
  }
  return createParabola(site, directrix);
}

// function existSiblingSite(arc, next) {
//   return next && next.isV && equal(next.site.a, arc.site.a)
// }

function shareVClosing(arcNode, sibling) {
  if (!arcNode.isV || !sibling.isV) return false;
  return _.get(arcNode, "site.b.relation") == NODE_RELATION.CLOSING &&
  _.get(sibling, "site.b.relation") == NODE_RELATION.CLOSING &&
   equal(arcNode.site.b, sibling.site.b);
}

//------------------------------------------------------------
// add
//------------------------------------------------------------
Beachline.prototype.add = function (site) {
  var arcNode = new ArcNode(site);
  var directrix = site.y;

  // move the directrix slightly downward for segments
  // so we can still process arc intersections
  if (site.type == "segment") {
    // we need to move the smallest amount possible
     directrix -= 1e-10;
  }

  if (this.root == null) {
    this.root = arcNode;
  } else if (this.root.isArc) {
    this.root = splitArcNode(this.root, arcNode, this.dcel);
  } else {
    var parent = this.root;
    var side, parentSide, child;
    // if node is endpoint information by site
    var rslt = null;
    if (arcNode.isParabola && arcNode.site.isEndPoint) {
      rslt = parent.findParentNodeByEnd(arcNode.site);
      if (rslt) {
        side = rslt.side;
        parentSide = rslt.parentSide;
        parent = rslt.node.parent;
        child = rslt.node;
      }
    }

    if (!rslt) {
      // Do a binary search to find the arc node that the new
      // site intersects with
      var x = parent.intersection(directrix).x;
      side = (site.x < x) ? LEFT_CHILD : RIGHT_CHILD;
      parentSide = side;
      child = parent.getChild(side);
      while (child.isEdge) {
        parent = child;
        x = parent.intersection(directrix).x;
        if (site.x == x) {
          console.log("Site and intersect values equal:" + x + " for intersection: " + parent.id);
        }
        parentSide = side;
        side = (site.x < x) ? LEFT_CHILD : RIGHT_CHILD;
        child = parent.getChild(side);
      }
    }

    var siblingRight = child.nextArc();
    if (arcNode.isV){
      if (arcNode.site.a.y == arcNode.site.b.y) {
        throw "Horizontal segment detected";
      } else if (child.isV && _.get(arcNode, "site.a.relation") == NODE_RELATION.TOP) {
          var vC = subtract(child.site.b, arcNode.site.a);
          var vN = subtract(arcNode.site.b, arcNode.site.a);
          var z0 = cross(vC, vN).z;
        var newChild;
        if (z0 < 0) {
          newChild = topSplitSiblings(child.prevArc(), arcNode, child, dcel);
        } else {
          newChild = topSplitSiblings(child, arcNode, siblingRight, dcel);
        }
        parent.setChild(newChild, side);
      } else if (_.get(arcNode, "site.a.relation") == NODE_RELATION.CHILD_LEFT_HULL) {
        // Set edge information since we are using a left joint split
        var nextEdge = child.nextEdge();
        if (nextEdge)
          nextEdge.dcelEdge.generalEdge = false;
        var newNode = leftJointSplit(child, arcNode, siblingRight, dcel);
        // set the parent since a left joint split may not preserve order
        parent.parent.setChild(newNode, parentSide);
      } else if (_.get(arcNode, "site.a.relation") == NODE_RELATION.CHILD_RIGHT_HULL) {
        // Set edge information since we are using a right joint split
        child.prevEdge().dcelEdge.generalEdge = false;
        // is a arc created by the right hull joint
        var newNode = rightJointSplit(arcNode, child, siblingRight, dcel);
        parent.parent.setChild(newNode, parentSide);
      } else {
        // regular split
        parent.setChild(splitArcNode(child, arcNode, this.dcel), side);
      }
    } else { // is parabola
      if (_.get(arcNode, "site.relation") == NODE_RELATION.CLOSING) {
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
      } else {
        // regular split
        parent.setChild(splitArcNode(child, arcNode, this.dcel), side);
      }
    }
  }

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
        ` id = ${node.id}`;
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
