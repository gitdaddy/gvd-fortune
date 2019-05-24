// Helper functions for insertion operations

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
// Utility function
// Insert Horizontal segment arc
//
//  |        | toSplit
//   \      /
//    |    |
//     \__/
//
//  *-------------*
//------------------------------------------------------------
function horizontalInsert(child, left, arcNode, right, dcel) {
  // TODO
  throw "horizontal insert not implemented";
}