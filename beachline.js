//------------------------------------------------------------
// CloseEvent
//------------------------------------------------------------
var CloseEvent = function(y, arcNode, equi) {
  this.yval = y;
  this.y = function() { return this.yval; }
  // Point that is equidistant from the three points
  this.equi = equi;
  this.arcNode = arcNode;
  this.arcNode.closeEvent = this;
  this.isCloseEvent = true;
  this.live = true;
};

//------------------------------------------------------------
// Beachline
//------------------------------------------------------------

// Logic in the remove method depends on these two values
// being 0 and 1.
const LEFT_CHILD = 0;
const RIGHT_CHILD = 1;

var Beachline = function() {
  this.root = null;
}

//------------------------------------------------------------
// Utility function
// toSplit is an arc node. node is also an arc node.
//------------------------------------------------------------
function splitArcNode(toSplit, node) {
  if (toSplit.closeEvent) {
    toSplit.closeEvent.live = false;
  }
  var x = node.site.x();
  var y = createParabola(toSplit.site, node.site.y()).f(x);
  var vertex = vec3(x, y, 0);
  var left = toSplit;
  var right = new ArcNode(toSplit.site);
  return new EdgeNode(left, new EdgeNode(node, right, vertex), vertex);
}

//------------------------------------------------------------
// createCloseEvent
//------------------------------------------------------------
function createCloseEvent(arcNode) {
  if (arcNode == null) return null;

  var left = arcNode.prevArc();
  var right = arcNode.nextArc();
  // if (left != null && right != null &&
  //     left.site.y() < arcNode.site.y() && 
  //     right.site.y() < arcNode.site.y()) {
  // if (left != null && right != null &&
  //     left.site.x() < arcNode.site.x() &&
  //     right.site.x() > arcNode.site.x()) {
  if (left != null && right != null) {// &&
      // (left.site.x() < arcNode.site.x() ||
      //  right.site.x() > arcNode.site.x())) {// &&
      // (left.site.y() < arcNode.site.y() &&
      //  right.site.y() < arcNode.site.y())) {
    // if (left != null && right != null) {
    var equi = equidistant(left.site, arcNode.site, right.site);
    var u = subtract(left.site, arcNode.site);
    var v = subtract(left.site, right.site);
    //console.log("cross " + u);
    //console.log("cross " + cross);
    var cr = cross(u, v);
    // console.log("cross " + cr[2]);
    if (cross(u, v)[2] < 0) {
      var r = length(subtract(arcNode.site, equi));
      // if (arcNode.id() == 5) {
      //   console.log("equi = (" + equi + ") (" + left.site.id + " " +
      //               arcNode.site.id + " " + right.site.id + ") r = " +
      //              (equi.y()-r).toString());
      // }
      return new CloseEvent(equi.y()-r, arcNode, equi);
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
  // if (arcNode.id() == 5) {
  //   console.log(arcNode.id());
  // }
  if (this.root == null) {
    this.root = arcNode;
  } else if (this.root.isArc) {
    this.root = splitArcNode(this.root, arcNode);
  } else {
    // Do a binary search to find the arc node that the new
    // site intersects with
    var directrix = site.y();
    var parent = this.root;
    var x = parent.intersection(directrix).x();
    var side = (site.x() < x) ? LEFT_CHILD : RIGHT_CHILD;
    var child = parent.getChild(side);
    while (child.isEdge) {
      parent = child;
      x = parent.intersection(directrix).x();
      side = (site.x() < x) ? LEFT_CHILD : RIGHT_CHILD;
      child = parent.getChild(side);
    }
    // Child is an arc node. Split it.
    var newNode = splitArcNode(child, arcNode);
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
  
  // console.log("Adding " + closeEvents.length + " events");
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

  // console.log("Update " + newEdge.id());
  newEdge.updateEdge(point);

  // Cancel the close event for this arc and adjoining arcs.
  // Add new close events for adjoining arcs.
  var closeEvents = [];
  var prevArc = newEdge.prevArc();
  if (prevArc.closeEvent) {
    prevArc.closeEvent.live = false;
    // console.log("live = false");
  }
  var e = createCloseEvent(prevArc);
  if (e != null) {
    // console.log("Creating prev close event ");
    // console.log(e);
    closeEvents.push(e);
  }
  var nextArc = newEdge.nextArc();
  if (nextArc.closeEvent) {
    nextArc.closeEvent.live = false;
    // console.log("live = false");
  }
  e = createCloseEvent(nextArc);
  if (e != null) {
    // console.log("Creating next close event ");
    // console.log(e);
    closeEvents.push(e);
  }
  return closeEvents;
}

//------------------------------------------------------------
// render
//------------------------------------------------------------

Beachline.prototype.renderImpl = function(
  program, directrix, node, leftx, rightx, renderEvents) {
  if (node.isArc) {
    color = siteColor(node.id());
    createParabola(node.site, directrix).render(program, leftx, rightx, color);
  } else {
    var color = vec4(0.0, 0.7, 0.7);
    if (renderEvents) {
      circle.render(program, node.avertex, 0.01, false, color);
    }
    var p = node.intersection(directrix);
    this.renderImpl(program, directrix, node.left, leftx, p.x());
    this.renderImpl(program, directrix, node.right, p.x(), rightx);
  }
}

Beachline.prototype.render = function(program, directrix, renderEvents) {
  if (this.root == null) return;
  this.renderImpl(program, directrix, this.root, -1, 1, renderEvents);
}

//------------------------------------------------------------
// toDot
//------------------------------------------------------------

function toDotImpl(directrix, node, leftx, rightx, level) {
  var s = "";
  if (node.isArc) {
  } else {
    var p = node.intersection(directrix);
    s += node.toDot() + " -> " + node.left.toDot() + "\n";
    s += node.toDot() + " -> " + node.right.toDot() + "\n";
    s += toDotImpl(directrix, node.left, leftx, p.x(), level+1);
    s += toDotImpl(directrix, node.right, p.x(), rightx, level+1);
  }
  return s;
}

Beachline.prototype.toDot = function(directrix) {
  var s = "digraph G {";
  if (this.root != null) {
    s += toDotImpl(directrix, this.root, -1, 1, 0);
  }
  s += "}";
  return s;
}

