//---------------------------------------------------------------------------
// ArcNode
//---------------------------------------------------------------------------

var nodeId = 0;
var g_edgeVtxId = 1;

let HALF_PI = Math.PI / 2.0;
let THREE_HALFS_PI = 3.0 * Math.PI / 2.0;
let FIVE_HALFS_PI = 5.0 * Math.PI / 2.0;

////////////////// HALF EDGE HELPER FUNCTIONS ///////////////////////////////

function computeHalfEdgeStraightVector(line, side, optTheta = undefined) {
  if (!(line instanceof Line) || side == UNDEFINED_SIDE) throw "Invalid edge param";
  // p1 lower than p2
  var theta;
  if (optTheta) {
    theta = optTheta;
  } else {
    var sortedPoints = _.sortBy([line.p1, line.p2], p => { return p[1]; });
    var pLower = sortedPoints[0];
    var pUpper = sortedPoints[1];
    theta = Math.atan2(pUpper[1]-pLower[1], pUpper[0]-pLower[0]);
  }
  // console.log("Theta:" + theta + " - in degrees: " + degrees(theta));
  var beta = theta + Math.PI; // 180 degrees opposite
  // console.log("Beta:" + beta + " - in degrees: " + degrees(beta));

  // in case the half edge is straight down
  if (theta === HALF_PI || theta === THREE_HALFS_PI) {
    // straight down - there is no going up
    var v = vec3(0, -1.0, 0);
    return v;
  } else if (theta > HALF_PI && theta < THREE_HALFS_PI) {
    // t - left, t + PI - right
    if (side === LEFT_SIDE) {
      return vec3(Math.cos(theta), Math.sin(theta), 0);
    }
    return vec3(Math.cos(beta), Math.sin(beta), 0);
  }
  // else theta is between THREE_FORTHS and HALF PI
  // t - right, t + PI - left
  if (side === LEFT_SIDE) {
    return vec3(Math.cos(beta), Math.sin(beta), 0);
  }
  return vec3(Math.cos(theta), Math.sin(theta), 0);
}

function computeHalfEdgeVector(vertex, prev, next, directrix) {
  var pt, seg;
  if (prev.isV && next.isParabola) {
    pt = next.site;
    seg = prev.site;
  } else if (prev.isParabola && next.isV) {
    pt = prev.site;
    seg = next.site;
  }
  if (pt && seg) { // Point segment bisector
    var b = bisect(pt, seg);
    var pUpper = seg.a;
    var pLower = seg.b;
    var theta = Math.atan2(pUpper[1]-pLower[1], pUpper[0]-pLower[0]);
    theta = theta - HALF_PI;

    if (b instanceof Line) {
      if (pt[1] >= seg.a[1]) { // above or at seg.a
        theta = prev.isV ? theta : theta + Math.PI;
      } else { // below or at seg.b
        theta = prev.isV ? theta + Math.PI : theta;
      }
      var v = vec3(Math.cos(theta), Math.sin(theta), 0);
      return {isVec:true, v: normalize(v), p: vertex};
    }

    var rightSide = prev.isV ? true : false;
    // return {isPara:true, q:q, rightSide: rightSide, p: vertex, gp:b.para, su: pUpper, sl: pLower };
    return {isPara:true, rightSide: rightSide, p: vertex, gp:b.para, su: pUpper, sl: pLower };
  }

  if (prev.isV && next.isV) {
    if (connected(prev.site, next.site)) {
      var b = bisectSegments2(prev.site, next.site);
      if (b.length !== 1) throw "Invalid bisector";
      return {isVec:true, v: b[0].v, p: vertex};
    }

    //////////// disjoint segments
    // if parallel get the v between both sites
    var line, p;
    if (parallelTest(prev.site, next.site)) {
      line = getAverage(prev.site, next.site);
    } else {
      p = intersectLines(prev.site.a, prev.site.b , next.site.a, next.site.b);
      line = new Line(p, vertex);
    }

    if (p) {
      var s1 = prev.site;
      var s2 = next.site;
      // check if p.y is on one of the segments
      var onS1 = s1.a[1] > p[1] && s1.b[1] < p[1];
      var onS2 = s2.a[1] > p[1] && s2.b[1] < p[1];
      if (onS1 || onS2) {
        if (onS2 && onS1) throw "Invalid intercept";
        // has the sweep line passed the intercept point
        if (directrix < p[1]) {
          // away from s
          return {isVec: true, v: line.v, p: vertex};
        } else {
            // towards s
            return {isVec: true, v: negate(line.v), p: vertex};
        }
      }
      // Between s1 and s2
      var belowS1 = s1.a[1] > p[1] && s1.b[1] > p[1];
      var belowS2 = s2.a[1] > p[1] && s2.b[1] > p[1];
      var aboveS1 = s1.a[1] < p[1] && s1.b[1] < p[1];
      var aboveS2 = s2.a[1] < p[1] && s2.b[1] < p[1];
      if (belowS1 && aboveS2 || belowS2 && aboveS1) {
        // var isLeft = s1.a[0] > p[0] && s1.b[0] > p[x];
        // var side = isLeft ? RIGHT_SIDE : LEFT_SIDE;
        // var v = computeHalfEdgeStraightVector(line, side);
        var v = vec3(vertex[0] - p[0], vertex[1] - p[1], 0);
        // Just use theta
        return {isVec: true, v: normalize(v), p: vertex};
      }
    }

    // neither segments project on each other
    var sortedPoints = _.sortBy([line.p1, line.p2], p => { return p[1]; });
    var pLower = sortedPoints[0];
    var pUpper = sortedPoints[1];
    var theta = Math.atan2(pUpper[1]-pLower[1], pUpper[0]-pLower[0]);

    var side = theta > HALF_PI ? RIGHT_SIDE : LEFT_SIDE;
    var v = computeHalfEdgeStraightVector(line, side, theta);
    // Just use theta
    return {isVec: true, v: normalize(v), p: vertex};
  }

  if (prev.isParabola && next.isParabola) {
    var b = bisect(prev.site, next.site);
    var side = prev.site[1] > next.site[1] ? LEFT_SIDE : RIGHT_SIDE;
    var v = computeHalfEdgeStraightVector(b, side);
    return {isVec: true, v: normalize(v), p: vertex};
  }
}

function populateTreeWithHalfEdgeData(node, directrix, once = false) {
  if (!node || node.isArc) return;

  // debugging only
  if (node.nodeId && node.nodeId === g_debugIdMiddle) {
    g_addDebug = true;
  } else {
    g_addDebug = false;
  }

  node.halfEdge = computeHalfEdgeVector(node.dcelEdge.origin.point, node.prevArc(), node.nextArc(), directrix);

  if (!once) {
    populateTreeWithHalfEdgeData(node.left, directrix);
    populateTreeWithHalfEdgeData(node.right, directrix);
  }
}

var ArcNode = function (site) {
  this.site = site;
  this.isArc = true;
  this.isEdge = false;
  this.isParabola = !isSegment(site);
  this.isV = isSegment(site);
  this.side = UNDEFINED_SIDE;
  // define arc boundaries
  this.id = nodeId++;
}

ArcNode.prototype.toString = function () {
  return `Type: arc - ${this.isParabola ? "parabola" : "v"}<br>` +
    `Site: (${this.site.toString()})`
    ;
}

ArcNode.prototype.createDrawElement = function (leftx, rightx, directrix) {
  let element = null;
  if (this.isParabola) {
    let para = createParabola(this.site, directrix, this.id);
    para.prepDraw(this.id, this.site.label, leftx, rightx);
    element = para;
    element.type = "parabola";
  } else if (this.isV) {
    var v = new V(this.site, directrix, this.id);
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
ArcNode.prototype.prevEdge = function () {
  var node = this;
  while (node.parent != null && node.parent.left == node) {
    node = node.parent;
  }
  return node.parent;
}

function belongsToSegment(A, B) {
  if (A == null || B == null) return false;
  if (A.site.type == "segment" && B.site.type == "vec") {
    return A.site.a == B.site || A.site.b == B.site;
  } else if (B.site.type == "segment" && A.site.type == "vec") {
    return B.site.a == A.site || B.site.b == A.site;
  }
  return false;
}

function belongsToSegmentEndpoint(A, B) {
  if (A == null || B == null) return false;
  if (A.site.type == "segment" && B.site.type == "vec") {
    return A.site.b == B.site;
  } else if (B.site.type == "segment" && A.site.type == "vec") {
    return B.site.b == A.site;
  }
  return false;
}

function consolidate(intersections, pivotX) {
  var ret = [];
  // WATCH VALUE
  var thresh = 0.000001;
  var left = _.filter(intersections, function(i) {
    return i[0] < pivotX;
  });
  var right = _.filter(intersections, function(i) {
    return i[0] > pivotX;
  });
  if (left.length === 2) {
    var d = dist(left[0], left[1]);
    if (d < thresh) {
      ret.push(left[0]);
    } else {
      ret.push(left[0]);
      ret.push(left[1]);
    }
  } else if (left.length === 1) {
    ret.push(left[0]);
  }

  if (right.length === 2) {
    var d = dist(right[0], right[1]);
    if (d < thresh) {
      ret.push(right[0]);
    } else {
      ret.push(right[0]);
      ret.push(right[1]);
    }
  } else if (right.length === 1) {
    ret.push(right[0]);
  }
  return ret;
}

//------------------------------------------------------------
// prevArc
// Returns the previous in-order arc arcNode
//------------------------------------------------------------
ArcNode.prototype.prevArc = function () {
  var node = this.prevEdge();
  if (node == null) return null;
  return node.prevArc();
}

//------------------------------------------------------------
// nextEdge
// Returns the next in-order edge node. Find the first
// ancestor to the right.
//------------------------------------------------------------
ArcNode.prototype.nextEdge = function () {
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
ArcNode.prototype.nextArc = function () {
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
var EdgeNode = function (left, right, vertex, dcel) {
  this.isArc = false;
  this.isEdge = true;
  this.left = left;
  this.right = right;
  var neighborEdges = _.filter([left, right], e => { return e.isEdge; });
  this.updateEdge(vertex, dcel, neighborEdges);

  left.parent = this;
  right.parent = this;

  this.toDot = function () {
    return "\"" + this.id + "\"";
  };
  this.nodeId = nodeId++;
}

EdgeNode.prototype.hasId = function (id) {
  return this.id.includes(id.toString());
}

EdgeNode.prototype.toString = function () {
  return `Type: edge<br>`;
}


Object.defineProperty(EdgeNode.prototype, "id", {
  configurable: true,
  enumerable: true,
  get: function () {
    return this.prevArc().id + "-" + this.nextArc().id;
  },
});

Object.defineProperty(EdgeNode.prototype, "connectedToGVD", {
  configurable: true,
  enumerable: true,
  get: function () {
    return this.prevArc().site.label !== this.nextArc().site.label;
  },
});

Object.defineProperty(EdgeNode.prototype, "isGeneralSurface", {
  configurable: true,
  enumerable: true,
  get: function () {
    var left = this.prevArc();
    var right = this.nextArc();
    return left.isParabola && right.isV || left.isV && right.isParabola;
  },
});

EdgeNode.prototype.updateEdge = function (vertex, dcel, optNeighborEdges = [], optEndingEdges = [], optR = undefined) {
  this.dcelEdge = dcel.makeEdge();
  this.dcelEdge.origin.point = vertex;
  this.dcelEdge.origin.optR = optR;
  this.dcelEdge.origin.id = g_edgeVtxId++;
  if (optEndingEdges.length > 0) {

    // All of the nodes share a reference to the connectedEdges array
    if (optEndingEdges[1]) optEndingEdges[1].dest.connectedEdges = optEndingEdges[0].dest.connectedEdges;
    this.dcelEdge.origin.connectedEdges = optEndingEdges[0].dest.connectedEdges;
    var sharedEdges = this.dcelEdge.origin.connectedEdges;
    _.each(optEndingEdges, function (e) {
      sharedEdges[getEdgeId(e)] = e;
      e.dest.point = vertex;
      e.dest.optR = optR;
      e.dest.id = g_edgeVtxId++;
      // set the edges origin with itself
      e.origin.connectedEdges[getEdgeId(e)] = e;
    });
  }
  var next = this.nextArc();
  var prev = this.prevArc();
  this.dcelEdge.a = prev.id;
  this.dcelEdge.siteA = prev.site;
  this.dcelEdge.b = next.id;
  this.dcelEdge.siteB = next.site;
  this.dcelEdge.splitSite = prev.site.label !== next.site.label;
  if (this.dcelEdge.splitSite && optNeighborEdges.length > 0 && optEndingEdges.length === 0) {
    var thisOVertex = this.dcelEdge.origin;
    var thisDVertex = this.dcelEdge.dest;
    var thisEdge = this.dcelEdge;
    _.each(optNeighborEdges, e => {
      var sharedEdges = {};
      sharedEdges[getEdgeId(e.dcelEdge)] = e.dcelEdge;
      sharedEdges[getEdgeId(thisEdge)] = thisEdge;
      var nPtO = e.dcelEdge.origin.point;
      var nPtD = e.dcelEdge.origin.dest;

      if (fastFloorEqual(nPtO, thisOVertex.point)) {
        e.dcelEdge.origin.connectedEdges = sharedEdges;
        thisOVertex.connectedEdges = sharedEdges;
      } else if (fastFloorEqual(nPtD, thisOVertex.point)) {
        e.dcelEdge.dest.connectedEdges = sharedEdges;
        thisOVertex.connectedEdges = sharedEdges;
      } else if (fastFloorEqual(nPtO, thisDVertex.point)) {
        e.dcelEdge.origin.connectedEdges = sharedEdges;
        thisDVertex.connectedEdges = sharedEdges;
      } else if (fastFloorEqual(nPtD, thisDVertex.point)) {
        e.dcelEdge.dest.connectedEdges = sharedEdges;
        thisDVertex.connectedEdges = sharedEdges;
      }
    });
  }
  this.dcelEdge.generalEdge = prev.isParabola && next.isV || prev.isV && next.isParabola;
}

EdgeNode.prototype.prevArc = function () {
  var node = this;
  node = node.left;
  while (!node.isArc) {
    node = node.right;
  }
  return node;
}

EdgeNode.prototype.nextArc = function () {
  var node = this;
  node = node.right;
  while (!node.isArc) {
    node = node.left;
  }
  return node;
}

EdgeNode.prototype.getChild = function (side) {
  if (side == LEFT_SIDE) return this.left;
  return this.right;
}

EdgeNode.prototype.setChild = function (node, side) {
  if (side == LEFT_SIDE) {
    node.side = LEFT_SIDE;
    this.left = node;
  } else {
    node.side = RIGHT_SIDE;
    this.right = node;
  }
  node.parent = this;
}

// Finds the intersection between the left and right arcs.
EdgeNode.prototype.intersection = function (directrix) {
  // This is inefficient. We should be storing sites in edge nodes.
  let leftArcNode = this.prevArc();
  let rightArcNode = this.nextArc();

  // debugging only
  if (leftArcNode.id === g_debugIdLeft && rightArcNode.id === g_debugIdRight) {
    g_addDebug = true;
  } else {
    g_addDebug = false;
  }

  var obj = {};
  if (leftArcNode.isV && rightArcNode.isV) {
    obj = intersectStraightArcs(leftArcNode, rightArcNode, directrix);
  } else if (leftArcNode.isV || rightArcNode.isV) {
    obj = intersectParabolicToStraightArc(leftArcNode, rightArcNode, directrix);
  } else {
    obj = intersectParabolicArcs(leftArcNode, rightArcNode, directrix);
  }
  if (!obj) {
    console.error("Invalid intersection between arc node:" + leftArcNode.id + " and node:" + rightArcNode.id);
    return null;
  }
  this.intersections = obj.results;
  this.selectedIntersection =  obj.results[obj.resultIdx];
  return obj.results[obj.resultIdx];
};

function neighborSites(edge) {
  if (!edge.isEdge) return false;
  var prev = edge.prevArc();
  var next = edge.nextArc();
  if (!prev || !next) return false;

  return belongsToSegment(prev, next);
}

// Does not support horizontal arcs
function intersectStraightArcs(left, right, directrix){
  let pleft = createBeachlineSegment(left.site, directrix, left.id);
  let pright = createBeachlineSegment(right.site, directrix, right.id);
  let intersections = pleft.intersect(pright);
  if (intersections.length == 0 || !intersections[0]) {
    // console.log("number of intersections is 0 between node id: " + left.id + " and node: " + right.id);
    return null;
  }

  if (intersections.length == 1) {
    return {
      results: intersections,
      resultIdx: 0
    };
  }

  if (intersections.length > 2) {
    // get the two intersections that are closest to the x value of the left v
    var x = pleft.p[0];
    var sorted = _.sortBy(intersections, function(i) {
      return Math.abs(x - i[0]);
    });
    intersections = [sorted[0], sorted[1]];
    intersections = _.sortBy(intersections, function (p) { return p[0]; });
  }

  this.intersections = intersections;
  var idx;
  let pcenterx = (intersections[0][0] + intersections[1][0]) / 2;
  let prevy = pleft.f(pcenterx);
  let nexty = pright.f(pcenterx);
  let lower = 1;
  if (prevy < nexty) {
    lower = 0;
  }
  idx = 1 - lower;
  return {
    results: intersections,
    resultIdx: idx
  };
}

// Function supports the intersection of a parabolic arc to any other arc type
function intersectParabolicToStraightArc(left, right, directrix){

  // debugging only
  if (left.id === g_debugIdLeft && right.id === g_debugIdRight) {
    g_addDebug = true;
  } else {
    g_addDebug = false;
  }

  var pleft = createBeachlineSegment(left.site, directrix, left.id);
  var pright = createBeachlineSegment(right.site, directrix, right.id);

  var intersections = pleft.intersect(pright);

  _.remove(intersections, function (i) {
    return _.isUndefined(i);
  });

  if (intersections.length == 0 || !intersections[0]) {
    // use a back-up line since the parabola is probably
    // so narrow that it won't intersect with any ray below p
    var para = left.isParabola ? pleft : pright;
    var V = left.isParabola ? pright : pleft;
    if (belongsToSegment(left, right) && para.p < 1e-5) {
      var backupLine = new Line(vec3(-1, para.focus[1], 0), vec3(1, para.focus[1], 0));
      intersections = V.intersect(backupLine);
    }
    if (intersections.length == 0 || !intersections[0]) {
      console.log("number of intersections is 0 between node id: " + left.id + " and node: " + right.id);
      return null;
    }
  }

  if (intersections.length == 1) {
    return {
      results: intersections,
      resultIdx: 0
    };
  }

  if (intersections.length > 2) {
    var x;
    // debugging only
    if (left.isV && right.isV || left.isParabola && right.isParabola)
      throw "Unexpected ERROR";

    if (left.isV)
      x = pleft.p[0];
    else
      x = pright.p[0];
    // Test get the center intersections
    intersections = consolidate(intersections, x);
    if (intersections.length == 1) {
      return {
        results: intersections,
        resultIdx: 0
      };
    }
  }

  this.intersections = intersections;
  var idx;
  let pcenterx = (intersections[0][0] + intersections[1][0]) / 2;
  let prevy = pleft.f(pcenterx);
  let nexty = pright.f(pcenterx);
  let lower = 1;
  if (prevy < nexty) {
    lower = 0;
  }
  idx = 1 - lower;
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
  // if the point is flipped and is connected to the V
  if (belongsToSegmentEndpoint(left, right)) {
    idx = lower;
  }
  return {
    results: intersections,
    resultIdx: idx
  };
}

// Function supports the intersection of a parabolic arc to any other arc type
function intersectParabolicArcs(left, right, directrix){

  // debugging only
  if (left.id === g_debugIdLeft && right.id === g_debugIdRight) {
    g_addDebug = true;
  } else {
    g_addDebug = false;
  }

  let pleft = createBeachlineSegment(left.site, directrix, left.id);
  let pright = createBeachlineSegment(right.site, directrix, right.id);
  let intersections = pleft.intersect(pright);

  if (intersections.length == 0 || !intersections[0]) {
    throw "error number of intersections is 0 between node id: " + left.id + " and node: " + right.id;
  }

  if (intersections.length == 1) {
    return {
      results: intersections,
      resultIdx: 0
    };
  }

  this.intersections = intersections;
  var idx;
  let pcenterx = (intersections[0][0] + intersections[1][0]) / 2;
  let prevy = pleft.f(pcenterx);
  let nexty = pright.f(pcenterx);
  let lower = 1;
  if (prevy < nexty) {
    lower = 0;
  }
  idx = 1 - lower;

  return {
    results: intersections,
    resultIdx: idx
  };
}


