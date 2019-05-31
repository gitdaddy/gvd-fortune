//---------------------------------------------------------------------------
// ArcNode
//---------------------------------------------------------------------------

var nodeId = 0;

var ArcNode = function (site) {
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

ArcNode.prototype.getHorizontalBounds = function (directrix) {
  var left = this.prevArc();
  var right = this.nextArc();
  var lI, rI;
  if (left.parent.hasId(this.id)) {
    lI = left.parent.intersection(directrix);
  } else {
    lI = this.parent.intersection(directrix);
  }

  if (right.parent.hasId(this.id)) {
    rI = right.parent.intersection(directrix);
  } else {
    rI = this.parent.intersection(directrix);
  }

  // var rightI = this.parent.intersection(directrix);
  return {x0: lI.x, x1: rI.x};
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

  this.updateEdge(vertex, dcel);

  left.parent = this;
  right.parent = this;

  this.toDot = function () {
    return "\"" + this.id + "\"";
  };
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

Object.defineProperty(EdgeNode.prototype, "flipped", {
  configurable: true,
  get: function () {
    return this.prevArc().site.flipped || this.nextArc().site.flipped;
  },
});

EdgeNode.prototype.updateEdge = function (vertex, dcel) {
  this.dcelEdge = dcel.makeEdge();
  this.dcelEdge.origin.point = vertex;
  var next = this.nextArc();
  var prev = this.prevArc();
  this.dcelEdge.a = prev.id;
  this.dcelEdge.siteA = prev.site;
  this.dcelEdge.b = next.id;
  this.dcelEdge.siteB = next.site;
  this.dcelEdge.splitSite = prev.site.label !== next.site.label;
  this.dcelEdge.generalEdge = prev.isParabola && next.isV || prev.isV && next.isParabola
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
  if (side == LEFT_CHILD) return this.left;
  return this.right;
}

EdgeNode.prototype.setChild = function (node, side) {
  if (side == LEFT_CHILD) {
    this.left = node;
  } else {
    this.right = node;
  }
  node.parent = this;
}

// Finds the intersection between the left and right arcs.
EdgeNode.prototype.intersection = function (directrix) {
  // This is inefficient. We should be storing sites in edge nodes.
  let leftArcNode = this.prevArc();
  let rightArcNode = this.nextArc();
  // if (leftArcNode.id == 2 && rightArcNode.id == 15) {
  //   g_addDebug = true;
  //   // debugger;
  // } else {
  //   g_addDebug = false;
  // }
  var obj = {};
  if (leftArcNode.isV && rightArcNode.isV) {
    obj = intersectStraightArcs(leftArcNode, rightArcNode, directrix);
  } else {
    obj = intersectParabolicArc(leftArcNode, rightArcNode, this.flipped, this.isGeneralSurface, directrix);
  }
  this.intersections = obj.results;
  this.selectedIntersection =  obj.results[obj.resultIdx];
  return obj.results[obj.resultIdx];
};

// Does not support horizontal arcs
function intersectStraightArcs(left, right, directrix){
  let pleft = createBeachlineSegment(left.site, directrix);
  let pright = createBeachlineSegment(right.site, directrix);
  let intersections = pleft.intersect(pright);
  if (intersections.length == 0 || !intersections[0]) {
    throw "error number of intersections is 0 between node id: " + left.id + " and node: " + right.id;
  }

  // _.remove(intersections, function (i){
  //   return i.y < directrix;
  // });

  if (intersections.length == 0) {
    console.error("Error no intersections between: " + left.id + "-" + right.id);
    return null;
  }

  if (intersections.length == 1) {
    return {
      results: intersections,
      resultIdx: 0
    };
  }

  if (intersections.length > 2) {
    console.error("Warning over two intersections for straight arcs");
    return {
      results: intersections,
      resultIdx: 0
    };
  }

  var lowerSite = pleft.y1.y > pright.y1.y ? right.site : left.site;
  var x0 = intersections[0].x;
  var x1 = intersections[1].x;
  var siteOrigin1 = intersectLines(new vec3(x0, 1, 0), new vec3(x0, -1, 0), lowerSite.a, lowerSite.b);
  if (siteOrigin1.y < intersections[0].y){
    return {
      results: intersections,
      resultIdx: 1
    };
  }
  var siteOrigin2 = intersectLines(new vec3(x1, 1, 0), new vec3(x1, -1, 0), lowerSite.a, lowerSite.b);
  if (siteOrigin2.y < intersections[1].y){
    return {
      results: intersections,
      resultIdx: 0
    };
  }

  var v1 = new vec3(x0, directrix, 0);
  var v2 = new vec3(x1, directrix, 0);

  var d1 = dist(siteOrigin1, v1);
  var d2 = dist(siteOrigin2, v2);

  var i0 = dist(intersections[0], v1);
  var i1 = dist(intersections[1], v2);

  // get the intersection that is closest to midpoint between the site and the directrix
  var idx = Math.abs((d1/2.0) - i0) < Math.abs((d2/2.0) - i1) ? 0 : 1;
  return {
    results: intersections,
    resultIdx: idx
  };
}


// Function supports the intersection of a parabolic arc to any other arc type
function intersectParabolicArc(left, right, isFlipped, isGeneral, directrix){
  let pleft = createBeachlineSegment(left.site, directrix);
  let pright = createBeachlineSegment(right.site, directrix);
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

  if (intersections.length > 2) {
    if (left.isV && right.isV) {
      if (intersections.length == 3) {
        console.log("Warning - 3 intersections");
        return {
          result: intersections,
          resultIdx: 0
        };
      }
      // get the two intersections that are closest to
      // the left arcNode site since we are going from left to right
      var x = (left.site.a.x + left.site.b.x) / 2.0;
      var sorted = _.sortBy(intersections, function(i) {
        return Math.abs(x - i.x);
      });
      intersections = [sorted[0], sorted[1]];
    } else {
      var sorted = _.sortBy(intersections, function(i) { i.x });
      // get the two outer intersections
      intersections = [sorted[0], sorted[sorted.length - 1]];
    }
  }

  this.intersections = intersections;
  var idx;
  let pcenterx = (intersections[0].x + intersections[1].x) / 2;
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
  if (isFlipped && isGeneral &&
     belongsToSegmentEndpoint(left, right)) {
    idx = lower;
  }
  return {
    results: intersections,
    resultIdx: idx
  };
}