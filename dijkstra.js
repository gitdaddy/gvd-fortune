"use strict";

let g_currentHighlightedPaths = [];

// the queue of unvisited places
let g_sortedQueue = [];

/*
  IE 11: 12,064
  Firefox 65: 20,614
  Chrome 72: 9,643
  Opera 57: 9,638
  Safari 12: 32,035
  */
const MAX_RECURSION_LEVEL = 9642;


function edgeEqual(e1, e2) {
  return e1.a === e2.a && e1.b === e2.b;
}

function getNextLinks(possibleConnections, optFromEdge) {
  var edges = _.filter(_.values(possibleConnections), e => {
    return e.dest.point && e.origin.point;
  });
  if (!optFromEdge) return edges;
  return _.filter(edges, e => {
    return !edgeEqual(e, optFromEdge);
  });
}

function getDestVertex(originPt, edge) {
  if (!fastFloorEqual(originPt, edge.dest.point)) {
    return edge.dest;
  } else {
    return edge.origin;
  }
}

function sortedInsert(newDest) {
  var idx = _.sortedIndexBy(g_sortedQueue, newDest, 'tCost');

  // insert the new destination in order or on top
  if (idx === -1) {
    g_sortedQueue.push(newDest);
  } else {
    g_sortedQueue.splice(idx, 0, newDest);
  }
}

function shortestPath(gvdVertex) {
  g_sortedQueue = [];
  var nextLinks = getNextLinks(gvdVertex.connectedEdges, null);
  var currentVertex = gvdVertex;

  // initialize the queue
  _.each(nextLinks, edgeLink => {
    var destVertex = getDestVertex(currentVertex.point, edgeLink);
    edgeLink.tCost = dist(destVertex.point, currentVertex.point);
    edgeLink.path = "";
    // edgeLink.path = getEdgeId(edgeLink);
    edgeLink.destVertex = destVertex;
    sortedInsert(edgeLink);
  });

  var destEdge;
  while (g_sortedQueue.length > 0) {
    destEdge = g_sortedQueue.shift();
    currentVertex = destEdge.destVertex;

    // discover new unvisited locations or locations we can access sooner
    nextLinks = getNextLinks(currentVertex.connectedEdges, destEdge);
    _.each(nextLinks, edgeLink => {
      var destVertex = getDestVertex(currentVertex.point, edgeLink);
      var estimatedCost = dist(destVertex.point, currentVertex.point) + destEdge.tCost;
      if (!edgeLink.tCost || estimatedCost < edgeLink.tCost) {
        edgeLink.tCost = estimatedCost;
        edgeLink.path = getEdgeId(destEdge);
        edgeLink.destVertex = destVertex;
        sortedInsert(edgeLink);
      }
    });
  }
}

function highlightPath(oEdge, color) {
  var s = d3.select(`#${getEdgeId(oEdge)}`);
  s.style('stroke', color)
  s.style("stroke-width", g_surfaceHighlightWidth)
  ;
  g_currentHighlightedPaths.push(getEdgeId(oEdge));
  var path = oEdge.path;

  while(!_.isUndefined(path) && path.length != 0) {
    var selected = d3.select(`#${path}`);
    selected.style('stroke', color);
    selected.style("stroke-width", g_surfaceHighlightWidth);
    g_currentHighlightedPaths.push(path);
    selected.each(function(d) {
      path = d.path;
    });
  }
}

function unHighlightPaths() {
  _.each(g_currentHighlightedPaths, function (pId) {
    var selected = d3.select(`#${pId}`);
    selected.style('stroke', (d) => {
      return g_settings.showGVDSeg.value ? 'black' : 'none';
    })
    selected.style("stroke-width", g_gvdSurfaceWidth);
  });
}
