//------------------------------------------------------------
// CloseEvent
//------------------------------------------------------------
var CloseEvent = function(y, arcNode, leftNode, rightNode, point) {
  this.yval = y;
  // Point that is equidistant from the three points
  this.point = point;
  this.arcNode = arcNode;
  this.leftNode = leftNode;
  this.rightNode = rightNode;
  this.arcNode.closeEvent = this;
  this.isCloseEvent = true;
  this.live = true;
  if (this.arcNode.isArc) {
    this.r = length(subtract(vec2(point),vec2(this.arcNode.site)));
  }
};

Object.defineProperty(CloseEvent.prototype, "y", {
  configurable: true,
  enumerable: true,
  get: function() {
    return this.yval;
  },
});

//------------------------------------------------------------
// Beachline
//------------------------------------------------------------

// Logic in the remove method depends on these two values
// being 0 and 1.
const LEFT_CHILD = 0;
const RIGHT_CHILD = 1;

var Beachline = function(dcel) {
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
    // console.log(`splitting ${toSplit} y=${y}`);
  }
  var vertex = vec3(x, y, 0);
  var left = toSplit;
  var right = new ArcNode(toSplit.site);
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
    if (isSegment(left.site) && !isSegment(right.site)) {
      // bline is the bisector between the start point of the
      // segment and the right site
      var bline = getPointsBisector(left.site[0], right.site);
      var gp = createGeneralParabola(right.site, left.site);
      var pints = gp.intersectLine(bline[0], subtract(bline[1], bline[0]));
      if (pints.length == 0) {
        throw "Intersections from bisector and generalized parabola " +
          "unexpectedly empty";
      }
      if (pints.length > 1) {
        console.log(pints);
        console.log(arcNode.id);
        throw "Unexpectedly more than one intersection from bisector " +
          "and general parabola";
      }
      // intersection is the "equi" point -- equidistant from the three
      // sites.
      var intersection = pints[0];
      // Get the intersection between the bisector and the segment
      var segBisectorTheta = 
        getSegmentsBisector([vec3(0, 0, 0), vec3(1, 0, 0)], left.site);
      // console.log(intersection);
      var sbline = [
        intersection, add(intersection, vec4(Math.cos(segBisectorTheta),
                                             Math.sin(segBisectorTheta)))];
      var eventPoint = intersectLines(
        left.site[0], left.site[1], sbline[0], sbline[1]);
      // TODO watch out if intersection we want is the second intersection
      return new CloseEvent(eventPoint.y, arcNode, left, right, intersection);
    } else if (isSegment(right.site)) {
      // TODO segment on right!
    } else if (isSegment(arcNode.site)) {
      // return new CloseEvent(arcNode.site[1].y, arcNode, intersection);
    } else {
      var equi = equidistant(left.closePoint,
                             arcNode.closePoint,
                             right.closePoint);
      var u = subtract(left.closePoint, arcNode.closePoint);
      var v = subtract(left.closePoint, right.closePoint);
      var cr = cross(u, v);
      if (cross(u, v)[2] < 0) {
        var r = length(subtract(arcNode.closePoint, equi));
        return new CloseEvent(equi.y-r, arcNode, left, right, equi);
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
Beachline.prototype.add = function(site) {
  var arcNode = new ArcNode(site);
  // // SEGMENT
  // if (isSegment(site)) {
  //   return [];
  // }
  if (this.root == null) {
    this.root = arcNode;
  } else if (this.root.isArc) {
    this.root = splitArcNode(this.root, arcNode, this.dcel);
  } else {
    // Do a binary search to find the arc node that the new
    // site intersects with
    var directrix = site.y;
    var parent = this.root;
    var x = parent.intersection(directrix).x;
    var side = (site.x < x) ? LEFT_CHILD : RIGHT_CHILD;
    var child = parent.getChild(side);
    while (child.isEdge) {
      parent = child;
      x = parent.intersection(directrix).x;
      side = (site.x < x) ? LEFT_CHILD : RIGHT_CHILD;
      child = parent.getChild(side);
    }
    // Child is an arc node. Split it.
    var newNode = splitArcNode(child, arcNode, this.dcel);
    parent.setChild(newNode, side);
  }

  // Create close events
  var closeEvents = [];
  var e = createCloseEvent(arcNode.prevArc());
  if (e != null) {
    closeEvents.push(e);
  }
  e = createCloseEvent(arcNode.nextArc());
  if (e != null) {
    closeEvents.push(e);
  }
  
  return closeEvents;
}

//------------------------------------------------------------
// remove
//------------------------------------------------------------
Beachline.prototype.remove = function(arcNode, point) {
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

  var sibling = parent.getChild(1-side);
  grandparent.setChild(sibling, parentSide);
  sibling.parent = grandparent;

  newEdge.updateEdge(point, this.dcel);

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
// method. Also gets events and active surface lines.
Beachline.prototype.prepDraw = function(
  directrix, node, leftx, rightx, arcElements, lines, events) {

  let highlight = false;

  if (node.isArc) {
    arcElements.push(node.createDrawElement(leftx, rightx, directrix));
  } else {
    // The point where this edge node was born
    var v = node.dcelEdge.origin.point;
    // The intersection between the edge node's defining arc nodes
    var p = node.intersection(directrix);

    if (p.x < leftx) {
      let msg = `intersection is less than leftx: ${p.x} < ${leftx}.` +
        `id = ${node.id}`;
      console.error(msg);
    }

    if (!Number.isNaN(v.x) && !Number.isNaN(v.y)) {
      events.push(v);
    }

    if (!Number.isNaN(v.x) && !Number.isNaN(v.y) &&
        !Number.isNaN(p.x) && !Number.isNaN(p.y)) {
      lines.push({x0:v.x, y0:v.y, x1:p.x, y1:p.y, id:node.id});
    }
    
    this.prepDraw(directrix, node.left, leftx, p.x, arcElements, lines, events);
    if (p.x < rightx) {
      // We can ignore anything outside our original bounds.
      this.prepDraw(directrix, node.right, p.x, rightx, arcElements, lines, events);
    }
  }
}
