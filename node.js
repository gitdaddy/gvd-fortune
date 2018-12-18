//---------------------------------------------------------------------------
// ArcNode
//---------------------------------------------------------------------------

var nodeId = 0;

var ArcNode = function(site) {
  this.site = site;
  this.isArc = true;
  this.isEdge = false;
  this.isParabola = !isSegment(site);
  this.isV = isSegment(site);
  if (this.isParabola) {
    this.openPoint = site;
    this.closePoint = site;
  } else {
    this.openPoint = site[0];
    this.closePoint = site[1];
  }
  this.id = nodeId++;
}

ArcNode.prototype.toString = function() {
  return `Type: arc - ${this.isParabola?"parabola":"v"}<br>` +
    `Site: (${this.site.toString()})`
  ;
}

ArcNode.prototype.createDrawElement = function(leftx, rightx, directrix) {
  let element = null;
  if (this.isParabola) {
    let para = createParabola(this.site, directrix);
    para.prepDraw(this.id, this.site.label, leftx, rightx);
    element = para;
    element.type = "parabola";
  } else if (this.isV) {
    var v = new V(this.site, directrix);
    v.prepDraw(this.id, this.site.label, leftx, rightx);
    element = v;
    element.type = "v";
  }
  return element;
}

//------------------------------------------------------------
// prevEdge
// Returns the previous in-order edge arcNode. Find the first
// ancestor to the left.
//------------------------------------------------------------
ArcNode.prototype.prevEdge = function() {
  var node = this;
  while (node.parent != null && node.parent.left == node) {
    node = node.parent;
  }
  return node.parent;
}

//------------------------------------------------------------
// prevArc
// Returns the previous in-order arc arcNode
//------------------------------------------------------------
ArcNode.prototype.prevArc = function() {
  var node = this.prevEdge();
  if (node == null) return null;
  return node.prevArc();
}

//------------------------------------------------------------
// nextEdge
// Returns the next in-order edge node. Find the first
// ancestor to the right.
//------------------------------------------------------------
ArcNode.prototype.nextEdge = function() {
  var node = this;
  while (node.parent != null && node.parent.right == node) {
    node = node.parent;
  }
  return node.parent;
}

//------------------------------------------------------------
// nextArc
// Returns the next in-order arc arcNode.
//------------------------------------------------------------
ArcNode.prototype.nextArc = function() {
  var node = this.nextEdge();
  if (node == null) return null;
  return node.nextArc();
}

//---------------------------------------------------------------------------
// EdgeNode
//---------------------------------------------------------------------------

//------------------------------------------------------------
// EdgeNode
// left and right are the left and right children nodes.
// left is always an ArcNode. Right may be an ArcNode or
// EdgeNode.
//------------------------------------------------------------
var EdgeNode = function(left, right, vertex, dcel) {
  this.isArc = false;
  this.isEdge = true;
  this.left = left;
  this.right = right;

  this.updateEdge(vertex, dcel);

  left.parent = this;
  right.parent = this;

  this.toDot = function() {
    return "\"" + this.id + "\"";
  };
}

EdgeNode.prototype.toString = function() {
  return `Type: edge<br>`;
}

Object.defineProperty(EdgeNode.prototype, "id", {
  configurable: true,
  enumerable: true,
  get: function() {
    return this.prevArc().id + "-" + this.nextArc().id;
  },
});

Object.defineProperty(EdgeNode.prototype, "connectedToGVD", {
  configurable: true,
  enumerable: true,
  get: function() {
    return this.prevArc().site.label !== this.nextArc().site.label;
  },
});

Object.defineProperty(EdgeNode.prototype, "connectedToV", {
  configurable: true,
  enumerable: true,
  get: function() {
    return this.prevArc().site.type == "segment" || this.nextArc().site.type == "segment";
  },
});

EdgeNode.prototype.updateEdge = function(vertex, dcel) {
  this.dcelEdge = dcel.makeEdge();
  this.dcelEdge.origin.point = vertex;
  this.dcelEdge.a = this.prevArc().id;
  this.dcelEdge.b = this.nextArc().id;
  this.dcelEdge.splitSite = this.prevArc().site.label !== this.nextArc().site.label;
}

EdgeNode.prototype.prevArc = function() {
  var node = this;
  node = node.left;
  while (!node.isArc) {
    node = node.right;
  }
  return node;
}

EdgeNode.prototype.nextArc = function() {
  var node = this;
  node = node.right;
  while (!node.isArc) {
    node = node.left;
  }
  return node;
}

EdgeNode.prototype.getChild = function(side) {
  if (side == LEFT_CHILD) return this.left;
  return this.right;
}

EdgeNode.prototype.setChild = function(node, side) {
  if (side == LEFT_CHILD) {
    this.left = node;
  } else {
    this.right = node;
  }
  node.parent = this;
}

EdgeNode.prototype.createBeachlineSegment = function(site, directrix) {
  if (isSegment(site)) {
    return new V(site, directrix);
  }
  return createParabola(site, directrix);
}

// Finds the intersection between the left and right arcs.
EdgeNode.prototype.intersection = function(directrix) {
  // This is inefficient. We should be storing sites in edge nodes.
  let leftArcNode = this.prevArc();
  let rightArcNode = this.nextArc();
  let pleft = this.createBeachlineSegment(leftArcNode.site, directrix);
  let pright = this.createBeachlineSegment(rightArcNode.site, directrix);
  let intersections = pleft.intersect(pright);
  this.intersections = intersections;

  if (_.isUndefined(intersections[0]) || _.isUndefined(intersections[1])) {
    return NaN;
  }

  let pcenterx = (intersections[0].x + intersections[1].x)/2;
  let prevy = pleft.f(pcenterx);
  let nexty = pright.f(pcenterx);
  let lower = 1;
  if (prevy < nexty) {
      lower = 0;
  }
  let arcNodes = [pleft, pright];

  // Handle the case where the V arc for the segment (+)
  // needs to be "above" the parabola for the lower
  // end of the segment (*). The (=) is for the parabola
  // for the upper end of the segment.
  //
  //                   =
  //                   +
  //   =               +               =
  //   =               +               =
  //    =              +              =
  //      +            +            +
  //        +          +          +
  //          +        +        +
  //            +      *      +
  //              **       **
  //                  ***
  //
  //     _____________________________
  //
  if (arcNodes[lower].isV &&
    directrix < arcNodes[lower].site[1].y &&
    arcNodes[lower].site[1] == arcNodes[1-lower].site) {
    console.log(intersections);
    console.log(arcNodes[lower].site);
    console.log(arcNodes[1-lower].site);
    lower = 1-lower;
    this.selectedIntersection = intersections[1-lower];
    return this.selectedIntersection;
  }

  // Parabola to Parabola
  // V to Parabola
  // Parabola to V
  // V to V
  // Edge nodes?
  var result;
  if (leftArcNode.isParabola && rightArcNode.isParabola) {
    result = intersections[1-lower];
  }  else if (leftArcNode.isParabola && rightArcNode.isV) {
    // TODO
    // result = intersectionPV(intersections, rightArcNode, pright, lower);
  } else if (leftArcNode.isV && rightArcNode.isParabola) {
    // TODO
    // result = intersectionPV(intersections, leftArcNode, pleft, lower);
  } else {
    result = intersectionVV(intersections);
  }
  
  this.selectedIntersection = result;
  return this.selectedIntersection;
  
  // Find the center arc
  // let arcNodes = [leftArcNode, rightArcNode];
  // // let arcs = [pleft, pright];
  // let pcenterx = (intersections[0].x + intersections[1].x)/2;
  // let prevy = pleft.f(pcenterx);
  // let nexty = pright.f(pcenterx);
  // let lower = 1;
  // if (prevy < nexty) {
    //   lower = 0;
    // }
    
    // Handle case where V arcs on the left or right of a parabola
    // the V will always intersect first with the lowest intersection
    // if (leftArcNode.isV || rightArcNode.isV)
    // {
      //   if (intersections[0].y < intersections[1].y) {
        //     lower = 1;
        //   } else {
  //     lower = 0;
  //   }
  // }
  
  // Case 1. Nodes arc only on V lower = 0
  // Case 2. Nodes arc between V and P1 or P2
  

  // If the prev arc is lower, take the right intersection.
  // In this case, the previous arc is the center.
  // Otherwise, take the left intersection.
  // In this case, the next arc is the center.
  this.selectedIntersection = intersections[1-lower];
  return this.selectedIntersection;
};
        
// function intersectionPV(intersections, vNode, beachLineSegment, lower) {
//   // Cover the case where part of the V is split
//   // by a parabola
//   var nodeBounds = getNodeBounds(vNode.id);
//   if (nodeBounds.x0 == null || nodeBounds.x1 == null 
//     || nodeBounds.x0 == nodeBounds.x1
//     || Math.abs(intersections[0].y - intersections[1].y) < 0.0000000001) {
//     return intersections[1-lower]; // default
//   }
//   var minY = Math.min(beachLineSegment.f(nodeBounds.x0), beachLineSegment.f(nodeBounds.x1));
//   // return the intersection that min y is closest to
//   var s0 = Math.abs(minY - intersections[0].y);
//   var s1 = Math.abs(minY - intersections[1].y);
//   if (s0 < s1) {
//     return intersections[0];
//   } else {
//     return intersections[1];
//   }
// }

function intersectionVV(intersections) {
  throw "V to V intersections are not yet defined";
}

