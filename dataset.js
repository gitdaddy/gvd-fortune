"use strict";

/* Node conditions for jointed sites
  Order of addition: point, s1, s2, s3 ....
  1. TOP node - top point s.a == child s.a
  2. Child node - left or right hull
  3. Closing node - bottom point - not sure if we need to do anything here
*/
var NODE_RELATION = {
  TOP: 1,
  CHILD_LEFT_HULL: 2,
  CHILD_RIGHT_HULL: 3,
  CLOSING: 4,
  NONE: 5
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

function populateDataProps(segments) {
  markSiteRelations(segments);
}

function markSiteRelations(segments) {
  var find = function(s){ return _.isUndefined(s.a.relation) || _.isUndefined(s.b.relation); };
  var cur = _.find(segments, find);
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
    var cur = _.find(segments, find);
  }
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
  let points1 = [
    vec3(0.05, 0.4, 0), // left
    vec3(0.251, 0.41, 0), // TOP
    vec3(0.25, -0.1, 0), // close
    vec3(0.07, -0.09, 0), // left

    vec3(-0.45, 0.31, 0), // top
    vec3(-0.25, 0.21, 0), // right
    vec3(-0.15, -0.05, 0), // lower right
    vec3(-0.55, -0.08, 0), // close
    // vec3(-0.15, -0.95, 0),
    // vec3(0.14, -0.94, 0),
    // vec3(0.74, -0.94, 0),
    // vec3(0.24, -0.94, 0),
    // vec3(0.48, -0.96, 0)
  ];
  let segments1 = [
    makeSegment(points1[0], points1[1]),
    makeSegment(points1[1], points1[2]),
    makeSegment(points1[2], points1[3]),
    makeSegment(points1[3], points1[0]),

    makeSegment(points1[4], points1[5]),
    makeSegment(points1[5], points1[6]),
    makeSegment(points1[6], points1[7]),
    makeSegment(points1[7], points1[4]),
  ];

  let points2 = [
    vec3(-0.572, 0.542, 0), // t1
    vec3(-0.072, 0.31, 0), // cmid
    vec3(0.372, 0.51, 0), // t2

    vec3(0.64,0.28, 0), // right
    vec3(0.14, 0.18, 0), // right2
    vec3(0.5, 0.09, 0), // right3

    vec3(0.23, -0.31, 0), // c2
    vec3(0.01, -0.07, 0), // t3
    vec3(-0.43, -0.45, 0), // c 1

    vec3(-0.5,-0.28, 0), // left3
    vec3(-0.14,0.2, 0), // left2
    vec3(-0.54,0.38, 0), // left
  ];
  let segments2 = [
    makeSegment(points2[0], points2[1]),
    makeSegment(points2[1], points2[2]),
    makeSegment(points2[2], points2[3]),
    makeSegment(points2[3], points2[4]),
    makeSegment(points2[4], points2[5]),
    makeSegment(points2[5], points2[6]),
    makeSegment(points2[6], points2[7]),
    makeSegment(points2[7], points2[8]),
    makeSegment(points2[8], points2[9]),
    makeSegment(points2[9], points2[10]),
    makeSegment(points2[10], points2[11]),
    makeSegment(points2[11], points2[0]),
  ];

  let points3 = [];
  {
    Math.seedrandom('6');
    let numRandom = 8;
    for (var i = 0; i < numRandom; ++i) {
      var p = vec3(Math.random()*2-1, Math.random()*2-1, 0);
      points3.push(p);
    }
  }
  let segments3 = [
    makeSegment(points3[1], points3[2]),
  ];

  let points4 = [
    vec3(-0.26, 0.73, 0),
    vec3(0.62, 0.37, 0),
    vec3(0.73,-0.13, 0),

    vec3(-0.65, -0.15, 0),
    vec3(-0.12,0.13, 0),
    vec3(-0.30, -0.1, 0),
  ];
  let segments4 = [
    makeSegment(points4[0], points4[1]),
    makeSegment(points4[1], points4[2]),
    makeSegment(points4[2], points4[0]),

    makeSegment(points4[3], points4[4]),
    makeSegment(points4[4], points4[5]),
    makeSegment(points4[5], points4[3]),
  ];

  Math.seedrandom('3');
  let numRandom = 100;
  let points5 = [];
  for (var i = 0; i < numRandom; ++i) {
  	var p = vec3(Math.random()*2-1, Math.random()*2-1, 0);
  	points5.push(p);
  }
  let segments5 = [];

  datasets = {
    'dataset1' : { points:points1, segments:segments1 },
    'dataset2' : { points:points2, segments:segments2 },
    'dataset3' : { points:points3, segments:segments3 },
    'dataset4' : { points:points4, segments:segments4 },
    'dataset5' : { points:points5, segments:segments5 },
  };
}
