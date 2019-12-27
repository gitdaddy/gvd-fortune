"use strict";

let g_currentHighlightedPaths = [];

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

// THIS will only work if EVERY vertex is set
// with the correct connected edges
// single point implementation
function shortestPath(gvdVertex, rLevel = 0, optFromEdge = null) {
  // don't go past the max recursion level
  if (rLevel >= MAX_RECURSION_LEVEL) {
    console.log("Shortest path: max recursion level reached");
    return;
  }

  // debugging
  // if (rLevel % 10 === 0) {
  //   console.log("recursion level:" + rLevel);
  // }


  // get closest links
  // visit each closest line if the total cost is less than the current cost
  // update the path to the current node
  var nextLinks = getNextLinks(gvdVertex.connectedEdges, optFromEdge);
  var currentPoint = gvdVertex;

  // loop for linear vertex with degree 2
  if (nextLinks.length === 1) {
    while(nextLinks.length === 1) {
      // mark the next vertex in line with a path
      // nextLinks = getNextLinks(gvdVertex.connectedEdges, optIncomingEdge);
      var destVertex = getDestVertex(currentPoint.point, nextLinks[0]);
      // cost to travel the edge plus the total cost
      var costSoFar = optFromEdge && optFromEdge.tCost ? optFromEdge.tCost : 0;
      var newCost = dist(destVertex.point, currentPoint.point) + costSoFar;
      // if we should take it
      if (!nextLinks[0].tCost || newCost < nextLinks[0].tCost) {
        // take the route
        nextLinks[0].tCost = newCost;
        nextLinks[0].path = optFromEdge ? getEdgeId(optFromEdge) : "";
        // var pathSoFar = optFromEdge ? optFromEdge.path : [];
        // nextLinks[0].path = _.concat(pathSoFar, [getEdgeId(nextLinks[0])]);
        currentPoint = destVertex;
      } else {
        // path already has a shorter route
        return;
      }
      optFromEdge = nextLinks[0];
      nextLinks = getNextLinks(currentPoint.connectedEdges, nextLinks[0]);
    }
  }

  // recursive approach for branching vertex with degree > 2
  _.each(nextLinks, edgeLink => {
    var destVertex = getDestVertex(currentPoint.point, edgeLink);
    var costSoFar = optFromEdge && optFromEdge.tCost ? optFromEdge.tCost : 0;
    var newCost = dist(destVertex.point, currentPoint.point) + costSoFar;
    // if we should take it
    if (!edgeLink.tCost || newCost < edgeLink.tCost) {
      // take the route
      edgeLink.tCost = newCost;
      edgeLink.path = optFromEdge ? getEdgeId(optFromEdge) : "";

      // var pathSoFar = optFromEdge ? optFromEdge.path : [];
      // edgeLink.path = _.concat(pathSoFar, [getEdgeId(edgeLink)]);
      // console.log("recursion level:" + rLevel);
      rLevel++;
      shortestPath(destVertex, rLevel, edgeLink);
    }
  });
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
