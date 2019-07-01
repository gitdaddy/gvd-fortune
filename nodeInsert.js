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
function topSplitSiblings(left, right, vertex, dcel) {
  if (!left.isV || !right.isV) {
    throw "invalid top split";
  }

  if (left.closeEvent) {
    left.closeEvent.live = false;
  }
  if (right.closeEvent) {
    right.closeEvent.live = false;
  }

  return new EdgeNode(left, right, vertex, dcel);
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

function nodeInsert(parent, child, arcNode, side, parentSide, dcel) {
  var sRight = child.nextArc();
  if (arcNode.isV) {
    if (arcNode.site.a.y == arcNode.site.b.y) {
      throw "Horizontal segment detected";
    }

    if (_.get(arcNode, "site.a.relation") == NODE_RELATION.TOP) {
      var siblingV;
      if (child.isV) {
        siblingV = child;
      } else {
        if (sRight && sRight.isV && equal(sRight.site.a, arcNode.site.a)) {
          siblingV = child;
        } else {
          siblingV = child.prevArc();
        }
      }

      if (!siblingV || !siblingV.isV || !equal(siblingV.site.a, arcNode.site.a)) {
        // regular split
        parent.setChild(splitArcNode(child, arcNode, this.dcel), side);
        return;
      }

      // Note here the child can be V or a parabola about site.a
      // ABC newNode(D) -> ABDC or ADBC
      var vC = subtract(siblingV.site.b, arcNode.site.a);
      var vN = subtract(arcNode.site.b, arcNode.site.a);
      var z0 = cross(vC, vN).z;
      parent = siblingV.parent;
      var newEdge;
      // parent always will set the left child due to how regular split is performed
      if (z0 < 0) {
        // ADBC
        console.log("ADBC detected");
        var leftNode = siblingV.getPrev();
        // sibling is to the right of arcNode
        newEdge = topSplitSiblings(arcNode, siblingV, arcNode.site.a, dcel);
        parent.setChild(newEdge, LEFT_CHILD);
        // update left parent
        leftNode.parent.updateEdge(arcNode.site.a, dcel);
      } else {
        // ABDC
        newEdge = topSplitSiblings(siblingV, arcNode, arcNode.site.a, dcel);
        parent.setChild(newEdge, LEFT_CHILD);
        // update right parent
        parent.updateEdge(arcNode.site.a, dcel);
      }
    } else if (_.get(arcNode, "site.a.relation") == NODE_RELATION.CHILD_LEFT_HULL) {
      // Set edge information since we are using a left joint split
      var nextEdge = child.nextEdge();
      if (nextEdge)
        nextEdge.dcelEdge.generalEdge = false;
      var newNode = leftJointSplit(child, arcNode, sRight, dcel);
      // set the parent since a left joint split may not preserve order
      parent.parent.setChild(newNode, parentSide);
    } else if (_.get(arcNode, "site.a.relation") == NODE_RELATION.CHILD_RIGHT_HULL) {
      // Set edge information since we are using a right joint split
      child.prevEdge().dcelEdge.generalEdge = false;
      // is a arc created by the right hull joint
      var newNode = rightJointSplit(arcNode, child, sRight, dcel);
      parent.parent.setChild(newNode, parentSide);
    } else {
      // regular split
      parent.setChild(splitArcNode(child, arcNode, this.dcel), side);
    }
    return;
  }

  // is parabola
  if (_.get(arcNode, "site.relation") == NODE_RELATION.CLOSING) {
    var updateEdge = child.prevEdge();
    if (sRight.isV && child.isV && equal(child.site.b, sRight.site.b)) {
      updateEdge = child.nextEdge();
    }
    if (updateEdge){
      updateEdge.dcelEdge.dest.overridden = true;
      updateEdge.dcelEdge.dest.point = arcNode.site;
    }
    if (_.get(child, "site.b.relation") == NODE_RELATION.CLOSING &&
        _.get(sRight, "site.b.relation") == NODE_RELATION.CLOSING &&
        equal(child.site.b, sRight.site.b)) {
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
