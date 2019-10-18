"use strict";

let edgeDataset = [];
let highlightColor = "yellow";

// priority queue
let queue = [];

function distance(dcelEdge) {
  var x0 = dcelEdge.origin.point[0];
  var x1 = dcelEdge.dest.point[0];
  var y0 = dcelEdge.origin.point[1];
  var y1 = dcelEdge.dest.point[1];
  var dx = x0 - x1;
  var dy = y0 - y1;
  return Math.sqrt((dx*dx)+(dy*dy));
}

function pathFromVisited(visited, endId) {
  var path = [endId];
  var curId = endId;
  var curIdx = _.findIndex(visited, function (v) {
    return v.id === curId;
  });
  while(curIdx !== -1) {
    var edge = visited.splice(curIdx, 1)[0];
    curId = edge.previousEdge;
    if (!curId) break;
    path.push(curId);
    curIdx = _.findIndex(visited, function (v) {
      return v.id === curId;
    });
  }
  return path;
}

function enqueue(queue, edge, prevId) {
  var sortFunc = function(edge) {
    if (!edge.tCost || edge.tCost === 0) throw "invalid tCost";
    // inverted sort order - largest [....] smallest
    return (1/edge.tCost);
  };

  // if the queue contains the edge already
  // update the tCost if it is less than the
  // current cost
  var existingIdx = _.findIndex(queue, function(e) {
    return e.id === edge.id;
  });
  if (existingIdx !== -1) { // if found
    if (queue[existingIdx].tCost > edge.tCost) {
      queue[existingIdx].tCost = edge.tCost;
      queue[existingIdx].previousEdge = prevId;
      _.sortBy(queue, sortFunc);
    }
    return;
  }

  var idx = _.sortedIndexBy(queue, edge, sortFunc);
  // update the previous edge
  edge.previousEdge = prevId;
  // insert the in order or on top
  if (idx === -1) {
    queue.push(edge);
  } else {
    queue.splice(idx, 0, edge);
  }
}

function dequeue(queue) {
  // return the smallest tCost
  return queue.pop();
}

function setEdgeDataset(lineEdges, parabolicEdges) {
  var elems = parabolicEdges.concat(lineEdges);
  edgeDataset = [];
  _.forEach(elems, function (e) {
    if (!e.origin.point || !e.dest.point) throw "invalid edge detected";
    var obj = {
      x0: e.origin.point[0],
      x1: e.dest.point[0],
      y0: e.origin.point[1],
      y1: e.dest.point[1],
      id: getEdgeId(e),
      cost: distance(e),
      tCost: undefined,
      previousEdge: undefined
    };
    edgeDataset.push(obj);
  });

  console.log("set edges:" + edgeDataset.length);
}

// visit the next edge - return false if we've
// already visited that edge
function visitEdge(visited, unvisited, id) {
  var idx = _.findIndex(unvisited, function (edge) {
    if (edge.id === id) return true;
  });
  // we've already visited this edge
  if (idx === -1) return false;
  // find at idx - remove 1
  var edge = unvisited.splice(idx, 1)[0];
  visited.push(edge);
  return true;
}

function getConnectedEdges(x, y, unvisitedSet) {
  var oEdges = [];
  var dEdges = [];
  // NOTE this assumes the input edge is NOT in the unvisited set
  _.forEach(unvisitedSet, function (edge) {
    if (edge.x0 === x && edge.y0 === y) {
      oEdges.push(edge);
    } else if (edge.x1 === x && edge.y1 === y) {
      dEdges.push(edge);
    }
  });

  return {
    oCons: oEdges,
    dCons: dEdges
  }
}
// edge9275-8920
function onBeginPathAlgorithm() {
  if (!(g_pathStartElem && g_pathEndElem)) {
    console.error("Please select a path start and finish");
    return;
  }
  // console.log(edgeDataset.length);
  var endId = getEdgeId(g_pathEndElem);
  var originX = g_pathStartElem.dest.point[0];
  var originY = g_pathStartElem.dest.point[1];

  queue = [];
  var visited = [];
  var unvisited = [...edgeDataset];

  // set the initial edge tentative cost
  // var startIdx = _.findIndex(unvisited, function (edge) {
  //   if (edge.id === g_pathStartElem.id) return;
  // });
  var curEdge = {
    x0: g_pathStartElem.origin.point[0],
    x1: g_pathStartElem.dest.point[0],
    y0: g_pathStartElem.origin.point[1],
    y1: g_pathStartElem.dest.point[1],
    id: getEdgeId(g_pathStartElem),
    cost: 0,
    tCost: 0,
    previousEdge: undefined
  };
  curEdge.tCost = 0;
  curEdge.endX = originX;
  curEdge.endY = originY;
  // visitEdge(visited, unvisited, curEdge.id);

  while (curEdge.id !== endId) {
    // handle the case where we have no
    // more edges to visit
    if (unvisited.length < 1) throw "exhausted unvisited list";

    var endX = curEdge.endX;
    var endY = curEdge.endY;
    var n = getConnectedEdges(endX, endY, unvisited);
    // evaluate connected neighbors and update the tCost
    // set the previous vertex
    _.forEach(n.oCons, function (oEdge) {
      oEdge.endX = oEdge.x1;
      oEdge.endY = oEdge.y1;
      oEdge.tCost = curEdge.tCost + oEdge.cost;
      enqueue(queue, oEdge, curEdge.id);
    });
    _.forEach(n.dCons, function (dEdge) {
      dEdge.endX = dEdge.x0;
      dEdge.endY = dEdge.y0;
      dEdge.tCost = curEdge.tCost + dEdge.cost;
      enqueue(queue, dEdge, curEdge.id);
    });
    // Visit the unvisited vertex with the smallest tCost
    var smallestCostEdge = dequeue(queue);
    var newVisit = visitEdge(visited, unvisited, smallestCostEdge.id);
    // keep trying to visit new neighbors until we've
    // reached one we haven't visited
    while(!newVisit) {
      if (unvisited.length < 1) throw "exhausted unvisited list";
      smallestCostEdge = dequeue(queue);
      newVisit = visitEdge(visited, unvisited, smallestCostEdge.id);
    }
    curEdge = smallestCostEdge;
  }

  // TODO add logic get the correct path
  var ids = pathFromVisited(visited, endId);
  _.forEach(ids, function(id) {
    var selected = d3.select(`#${id}`);
    selected.style('stroke', highlightColor);
  });
}
