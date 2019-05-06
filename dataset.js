"use strict";

/* Node conditions for jointed sites
  Order of addition: point, s1, s2, s3 ....
  1. TOP node - top point s.a == child s.a
  2. Child node - left or right hull
  3. Closing node - bottom point - not sure if we need to do anything here
*/

var g_id = 0;
var g_label = 0;

var NODE_RELATION = {
  TOP: 1,
  CHILD_LEFT_HULL: 2,
  CHILD_RIGHT_HULL: 3,
  CLOSING: 4,
  NONE: 5
}

var Polygon = function () {
  this.points = [];
  this.segments = [];
  this.label = g_label++;
}

Polygon.prototype.addPoint = function (point) {
  point.id = g_id++;
  point.label = this.label;
  this.points.push(point);
}

Polygon.prototype.createSegment = function (pIdxStart, pIdxEnd) {
  var s = makeSegment(this.points[pIdxStart], this.points[pIdxEnd]);
  s.id = g_id++;
  s.label = this.label;
  this.segments.push(s);
  this.points[pIdxStart].flipped = isFlipped(this.points[pIdxStart], this.segments);
  this.points[pIdxEnd].flipped = isFlipped(this.points[pIdxEnd], this.segments);
}

function getNextSeg(p, segments, segId) {
  var next = _.find(segments, function(s) {
    if (equal(p, s.a) || equal(p, s.b))
      return segId !== s.id;
  });
  if (!next) return;
  if (equal(p, next.a)) {
    return {side: 'a', seg: next};
  } else {
    return {side: 'b', seg: next};
  }
}

function setRelationTop(cur, next) {
  if (!_.isUndefined(cur.a.relation)) return;
  if (next.side == 'a') {
    cur.a.relation = NODE_RELATION.TOP;
    next.seg.a.relation = NODE_RELATION.TOP;
  } else {
    // either a left or right bend
    var v0 = subtract(cur.b, cur.a);
    var v1 = subtract(cur.b, next.seg.a);
    if (cross(v0, v1).z < 0) {
      // right
      cur.a.relation = NODE_RELATION.CHILD_LEFT_HULL;
      next.seg.b.relation = NODE_RELATION.CHILD_LEFT_HULL;
    } else {
      // left
      cur.a.relation = NODE_RELATION.CHILD_RIGHT_HULL;
      next.seg.b.relation = NODE_RELATION.CHILD_RIGHT_HULL;
    }
  }
}

function setRelationBottom(cur, next) {
  if (!_.isUndefined(cur.b.relation)) return;
  if (next.side == 'b') {
    cur.b.relation = NODE_RELATION.CLOSING;
    next.seg.b.relation = NODE_RELATION.CLOSING;
  } else {
    // either a left or right bend
    var v0 = subtract(cur.b, cur.a);
    var v1 = subtract(cur.b, next.seg.b);
    if (cross(v0, v1).z < 0) {
      // right
      cur.b.relation = NODE_RELATION.CHILD_LEFT_HULL;
      next.seg.a.relation = NODE_RELATION.CHILD_LEFT_HULL;
    } else {
      // left
      cur.b.relation = NODE_RELATION.CHILD_RIGHT_HULL;
      next.seg.a.relation = NODE_RELATION.CHILD_RIGHT_HULL;
    }
  }
}

function markSiteRelations(segments) {
  if (segments.length == 0) return;
  var findNext = function(s){ return _.isUndefined(s.a.relation) || _.isUndefined(s.b.relation); };
  var cur = _.find(segments, findNext);
  while(cur) {
    var fromA = getNextSeg(cur.a, segments, cur.id);
    if (!fromA) {
      cur.a.relation = NODE_RELATION.NONE;
    } else {
      setRelationTop(cur, fromA);
    }
    var fromB = getNextSeg(cur.b, segments, cur.id);
    if (!fromB) {
      cur.b.relation = NODE_RELATION.NONE;
    } else {
      setRelationBottom(cur, fromB);
    }
    var cur = _.find(segments, findNext);
  }
}

function parseInputJSON(jsonStr) {
  var data = JSON.parse(jsonStr);
  if (!data)
    console.error("unable to parse data");
  var result = [];
  _.forEach(data.polygons, function(polygon) {
    var poly = new Polygon();
    for(var i = 0; i < polygon.points.length; i++) {
      if (i !== polygon.points.length - 1) {
        var point = new vec3(polygon.points[i].x,  polygon.points[i].y, 0);
        poly.addPoint(point);
        if (i !== 0) {
          // if not the first point in the polygon
          //  poly.createSegment(i-1, i); // TODO Evaluate segments when ready
        }
      } else {
        // last segment in the polygon (end, start)
        // poly.createSegment(i-1, 0);
      }
    }
    result.push(poly);
  });
  return result;
}

function isFlipped(p, segs) {
  var endPoint = false;
  // return true if point is lowest of all segments it is a part of
   segs.forEach(function(s) {
    if (equal(p, s.b)) {
      endPoint = true;
      return;
    }
  });
  return endPoint;
}

function createDatasets() {
  var polygons1 = [];
  var p11 = new Polygon();
  p11.addPoint(vec3(0.05, 0.4, 0));
  p11.addPoint(vec3(0.251, 0.41, 0));
  p11.addPoint(vec3(0.25, -0.1, 0));
  p11.addPoint(vec3(0.07, -0.09, 0));
  p11.createSegment(0,1);
  p11.createSegment(1,2);
  p11.createSegment(2,3);
  p11.createSegment(3,0);
  var p12 = new Polygon();
  p12.addPoint(vec3(-0.45, 0.31, 0));
  p12.addPoint(vec3(-0.11, 0.21, 0));
  p12.addPoint(vec3(-0.15, -0.05, 0));
  p12.addPoint(vec3(-0.55, -0.08, 0));
  p12.createSegment(0,1);
  p12.createSegment(1,2);
  p12.createSegment(2,3);
  p12.createSegment(3,0);
  polygons1.push(p11);
  polygons1.push(p12);

  var polygons2 = [];
  var p21 = new Polygon();
  p21.addPoint(vec3(-0.572, 0.342, 0)); // t1
  p21.addPoint(vec3(0.02, 0.02, 0)); // cmid
  p21.addPoint(vec3(0.372, 0.31, 0)); // t2
  p21.addPoint(vec3(0.64,0.08, 0)); // right
  p21.addPoint(vec3(0.14, -0.02, 0)); // right2
  p21.addPoint(vec3(0.5, -0.11, 0)); // right3
  p21.addPoint(vec3(0.23, -0.51, 0)); // c2
  p21.addPoint(vec3(0.01, -0.27, 0)); // t3
  p21.addPoint(vec3(-0.43, -0.65, 0)); // c 1
  p21.addPoint(vec3(-0.5,-0.48, 0)); // left3
  p21.addPoint(vec3(-0.14, 0.001, 0)); // left2
  p21.addPoint(vec3(-0.54,0.18, 0)); // left
  p21.createSegment(0, 1);
  p21.createSegment(1, 2);
  p21.createSegment(2, 3);
  p21.createSegment(3, 4);
  p21.createSegment(4, 5);
  p21.createSegment(5, 6);
  p21.createSegment(6, 7);
  p21.createSegment(7, 8);
  p21.createSegment(8, 9);
  p21.createSegment(9, 10);
  p21.createSegment(10,11);
  p21.createSegment(11,0);
  polygons2.push(p21);

  var polygons3 = [];
  var p31 = new Polygon();
  Math.seedrandom('6');
  var numRandom1 = 8;
  for (var i = 0; i < numRandom1; ++i) {
    p31.addPoint(vec3(Math.random()*2-1, Math.random()*2-1, 0));
  }
  p31.createSegment(3,4);
  polygons3.push(p31);

  var polygons4 = [];
  var p41 = new Polygon();
  var p42 = new Polygon();

  p41.addPoint(vec3(-0.26, 0.73, 0));
  p41.addPoint(vec3(0.62, 0.37, 0));
  p41.addPoint(vec3(0.1,-0.11, 0));

  p42.addPoint(vec3(-0.65, -0.15, 0));
  p42.addPoint(vec3(-0.12,0.13, 0));
  p42.addPoint(vec3(-0.30, -0.1, 0));
  p41.createSegment(0, 1);
  p41.createSegment(1, 2);
  p41.createSegment(2, 0);
  p42.createSegment(0, 1);
  p42.createSegment(1, 2);
  p42.createSegment(2, 0);
  polygons4.push(p41);
  polygons4.push(p42);

  Math.seedrandom('3');
  var numRandom2 = 100;
  var polygons5 = [];
  for (var i = 0; i < numRandom2; ++i) {
    var p = new Polygon();
  	p.addPoint(vec3(Math.random()*2-1, Math.random()*2-1, 0));
  	polygons5.push(p);
  }

  g_datasets = {
    'dataset1' : polygons1,
    'dataset2' : polygons2,
    'dataset3' : polygons3,
    'dataset4' : polygons4,
    'dataset5' : polygons5,
    'dataset6' : [], // file dataset loaded asynchronously
  };
}
