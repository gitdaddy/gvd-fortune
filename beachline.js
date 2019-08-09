
// PACKET TYPE
var PACKET_TYPE = {
  MULTI_CHILD_PARENT: 1,
  PARENT: 2,
  CHILD: 3,
}

//------------------------------------------------------------
// Beachline
//------------------------------------------------------------

// Logic in the remove method depends on these two values
// being 0 and 1.
const LEFT_CHILD = 0;
const RIGHT_CHILD = 1;
const UNDEFINED_SIDE = 2;


var Beachline = function (dcel) {
  this.root = null;
  this.dcel = dcel;
}

//------------------------------------------------------------
// Utility functions
//

function createBeachlineSegment(site, directrix, id) {
  if (isSegment(site)) {
    return new V(site, directrix, id);
  }
  return createParabola(site, directrix, id);
}

function shareVClosing(arcNode, sibling) {
  if (!arcNode.isV || !sibling.isV) return false;
  return _.get(arcNode, "site.b.relation") == NODE_RELATION.CLOSING &&
  _.get(sibling, "site.b.relation") == NODE_RELATION.CLOSING &&
   equal(arcNode.site.b, sibling.site.b);
}

//------------------------------------------------------------
// add
//------------------------------------------------------------
Beachline.prototype.add = function (eventPacket) {
  var arcNode = new ArcNode(eventPacket.site);
  var directrix = eventPacket.site.y;

  // debugging only
  if (arcNode.id === g_debugIdMiddle) {
    g_addDebug = true;
  } else {
    g_addDebug = false;
  }

  if (this.root == null) {
    var subTreeData = generateSubTree(eventPacket, arcNode, this.dcel);
    this.root = subTreeData.root;
    return [];
  }

  if (this.root.isArc) {
    // TODO handle this case
    throw "Root should not be an arc";
  }

  var parent = this.root;
  var side, child;
  // Do a binary search to find the arc node that the new
  // site intersects with
  var x = parent.intersection(directrix).x;
  side = (eventPacket.site.x < x) ? LEFT_CHILD : RIGHT_CHILD;
  child = parent.getChild(side);
  while (child.isEdge) {
    parent = child;
    x = parent.intersection(directrix).x;
    if (eventPacket.site.x == x) {
      console.log("Site and intersect values equal:" + x + " for intersection: " + parent.id);
    }
    side = (eventPacket.site.x < x) ? LEFT_CHILD : RIGHT_CHILD;
    child = parent.getChild(side);
  }

  var subTreeData = generateSubTree(eventPacket, arcNode, dcel, child);
  parent.setChild(subTreeData.root, side);
  return processCloseEvents(subTreeData.closingNodes, directrix);
}

//------------------------------------------------------------
// remove
//------------------------------------------------------------
Beachline.prototype.remove = function (arcNode, point, directrix) {
  if (!arcNode.isArc) throw "Unexpected edge in remove";

  // debugging only
  if (arcNode.id === g_debugIdMiddle) {
    g_addDebug = true;
  } else {
    g_addDebug = false;
  }

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
