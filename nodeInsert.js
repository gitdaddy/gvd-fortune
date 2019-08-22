// Helper functions for insertion operations

// function to create an edge node
function createNewEdge(left, right, vertex, dcel) {
  if (left.closeEvent) {
    left.closeEvent.live = false;
  }
  if (right.closeEvent) {
    right.closeEvent.live = false;
  }

  return new EdgeNode(left, right, vertex, dcel);
}

// If used needs rework to match adjustment vals
// function shallowSite(site) {
//   if (!site.type || site.type !== "segment") return false;
//   // WATCH VALUE
//   return Math.abs(site.a.y - site.b.y) < 1e-4;
// }

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
    throw 'invalid close joint split';
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
function splitArcNode(toSplit, node, dcel, optNodesToClose) {
  if (toSplit.closeEvent) {
    toSplit.closeEvent.live = false;
  }
  var vertex;
  if (node.isV) {
    vertex = node.site.a;
  } else {
    var x = node.site.x;
    var y;
    if (toSplit.isParabola) {
      y = createParabola(toSplit.site, node.site.y, toSplit.id).f(x);
    } else {
      y = new V(toSplit.site, node.site.y, toSplit.id).f(x);
    }
    vertex = vec3(x, y, 0);
  }
  var left = toSplit;
  var right = new ArcNode(toSplit.site);
  if (optNodesToClose) {
    optNodesToClose.push(left);
    optNodesToClose.push(right);
  }
  return new EdgeNode(
      left, new EdgeNode(node, right, vertex, dcel), vertex, dcel);
}

function insertEdge(toSplit, edge, vertex, dcel, optNodesToClose) {
  if (toSplit.closeEvent) {
    toSplit.closeEvent.live = false;
  }

  var left = toSplit;
  var right = new ArcNode(toSplit.site);

  if (optNodesToClose) {
    optNodesToClose.push(left);
    optNodesToClose.push(right);
  }
  return new EdgeNode(
      left, new EdgeNode(edge, right, vertex, dcel), vertex, dcel);
}

// Child is guaranteed to be the parabola arc
function VRegularInsert(arcNode, childArcNode, dcel, nodesToClose) {
  if (_.get(childArcNode, 'site.a.relation') == NODE_RELATION.CHILD_LEFT_HULL) {
    // // Set edge information since we are using a left joint split
    var nextEdge = arcNode.nextEdge();
    if (nextEdge) nextEdge.dcelEdge.generalEdge = false;
    return createNewEdge(arcNode, childArcNode, childArcNode.site.a, dcel);
    // set the parent since a left joint split may not preserve order
  } else if (
      _.get(childArcNode, 'site.a.relation') ==
      NODE_RELATION.CHILD_RIGHT_HULL) {
    // // Set edge information since we are using a right joint split
    var prevEdge = arcNode.prevEdge();
    if (prevEdge) prevEdge.dcelEdge.generalEdge = false;
    // is a arc created by the right hull joint
    return createNewEdge(childArcNode, arcNode, childArcNode.site.a, dcel);
  } else {
    // regular split nodes to close?
    return splitArcNode(arcNode, childArcNode, dcel, nodesToClose);
  }
}

function ParaInsert(child, arcNode, dcel, nodesToClose) {
  var newChild;
  if (_.get(arcNode, 'site.relation') == NODE_RELATION.CLOSING) {
    var sRight = child.nextArc();
    var updateEdge = child.prevEdge();
    if (sRight.isV && child.isV && equal(child.site.b, sRight.site.b)) {
      updateEdge = child.nextEdge();
    }
    if (updateEdge) {
      updateEdge.dcelEdge.dest.overridden = true;
      updateEdge.dcelEdge.dest.point = arcNode.site;
    }
    nodesToClose.push(child);
    if (_.get(child, 'site.b.relation') == NODE_RELATION.CLOSING &&
        _.get(sRight, 'site.b.relation') == NODE_RELATION.CLOSING &&
        equal(child.site.b, sRight.site.b)) {
      nodesToClose.push(child.nextArc());
      newChild = closePointSplit(child, arcNode, dcel);
    } else {
      nodesToClose.push(child.prevArc());
      newChild = closePointSplit(arcNode, child, dcel);
    }
  } else {
    // regular split
    newChild = splitArcNode(child, arcNode, dcel);
    // nodesToClose.push(arcNode);
    nodesToClose.push(arcNode.nextArc());
    nodesToClose.push(arcNode.prevArc());
  }
  return newChild;
}

function generateSubTree(eventPacket, arcNode, dcel, optChild) {
  var tree;
  var nodesToClose = [];
  var removeNode = undefined;
  var removePoint = undefined;
  if (eventPacket.type === PACKET_TYPE.MULTI_CHILD_PARENT) {
    leftArcNode = new ArcNode(eventPacket.leftChild);
    rightArcNode = new ArcNode(eventPacket.rightChild);
    var newEdge = createNewEdge(
        leftArcNode, rightArcNode, arcNode.site, dcel);
    if (optChild) {
      tree = splitArcNode(optChild, arcNode, dcel, nodesToClose);
      var parent = arcNode.parent;
      var childEdge =
          insertEdge(arcNode, newEdge, arcNode.site, dcel, nodesToClose);
      parent.setChild(childEdge, LEFT_CHILD);
    }
    else {
      tree = insertEdge(arcNode, newEdge, arcNode.site, dcel);
    }
  } else if (eventPacket.type === PACKET_TYPE.PARENT) {
    if (!optChild) throw 'Invalid insert operation';
    var ls = optChild.prevArc();
    var rs = optChild.nextArc();
    childArcNode = new ArcNode(eventPacket.child);
    tree = splitArcNode(optChild, arcNode, dcel, nodesToClose);
    var parent = arcNode.parent;
    var newEdge = VRegularInsert(arcNode, childArcNode, dcel, nodesToClose);
    parent.setChild(newEdge, LEFT_CHILD);

    // if (shallowSite(optChild.site)) {
    //   if (optChild.site.a.x > optChild.site.b.x) {
    //     removeNode = optChild;
    //     removePoint = getIntercept(ls, removeNode, arcNode.site.y);
    //     var edge = ls.parent;
    //     edge.dcelEdge.dest = removePoint;
    //     edge.dcelEdge.dest.overridden = true;
    //     edge.dcelEdge.dest.point = removePoint;
    //   } else {
    //     removeNode = parent.nextArc();
    //     removePoint = getIntercept(removeNode, rs, arcNode.site.y);
    //     var edge = rs.parent;
    //     edge.dcelEdge.dest = removePoint;
    //     edge.dcelEdge.dest.overridden = true;
    //     edge.dcelEdge.dest.point = removePoint;
    //   }

    //   _.remove(nodesToClose, function(node) {
    //     return node.id === removeNode.id;
    //   });
    // }
  } else {
    if (optChild) {
      tree = ParaInsert(optChild, arcNode, dcel, nodesToClose);
    } else {
      tree = arcNode;
    }
  }

  return {root: tree, closingNodes: nodesToClose, optRemoveNode: removeNode, optRemovePoint: removePoint};
}
