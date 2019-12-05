"use strict";

let g_currentHighlightedPaths = [];

// function setSortedDatasets(allEdges){
//   // var dataset = [];
//   _.forEach(allEdges, function (e) {
//     if (!e.origin.point || !e.dest.point) throw "invalid edge detected";
//     var obj = {
//       originEdges: e.origin.connectedEdges,
//       destEdges: e.dest.connectedEdges,
//       // x0: e.origin.point[0],
//       // x1: e.dest.point[0],
//       // y0: e.origin.point[1],
//       // y1: e.dest.point[1],
//       id: getEdgeId(e),
//       cost: distance(e),
//       tCost: undefined,
//     };
//     g_edgeDataset.push(obj);
//   });
//   // must be a reference to
//   // g_edgex0SortedDataset = _.sortBy(dataset, 'x0');
//   // g_edgex1SortedDataset = _.sortBy(dataset, 'x1');
// }

// function distance(dcelEdge) {
//   // TODO curved edge distance?
//   var x0 = dcelEdge.origin.point[0];
//   var x1 = dcelEdge.dest.point[0];
//   var y0 = dcelEdge.origin.point[1];
//   var y1 = dcelEdge.dest.point[1];
//   var dx = x0 - x1;
//   var dy = y0 - y1;
//   return Math.sqrt((dx*dx)+(dy*dy));
// }

// only return the edges of the unvisited neighbors
// function getConnectedEdges(x, y, optStartId) {
//   var idx0Start = _.sortedIndexBy(g_edgex0SortedDataset, {x0: x}, 'x0');
//   var idx0End = _.sortedLastIndexBy(g_edgex0SortedDataset, {x0: x}, 'x0');

//   var x0Indexes = [];
//   for (var i = idx0Start; i <= idx0End; i++) {
//     if (!g_edgex0SortedDataset[i]) {
//       // end of the line
//       // console.error("Invalid index");
//     } else {
//       if (g_edgex0SortedDataset[i].y0 === y) {
//         if (g_edgex0SortedDataset[i].visited ||
//             (optStartId && g_edgex0SortedDataset[i].id === optStartId));
//         else
//           x0Indexes.push(i);
//       }
//     }
//   }

//   var idx1Start = _.sortedIndexBy(g_edgex1SortedDataset, {x1: x}, 'x1');
//   var idx1End = _.sortedLastIndexBy(g_edgex1SortedDataset, {x1: x}, 'x1');

//   var x1Indexes = [];
//   for (var i = idx1Start; i <= idx1End; i++) {
//     if (!g_edgex1SortedDataset[i]) {
//       // end of the line
//       // console.error("Invalid index");
//     } else {
//     if (g_edgex1SortedDataset[i].y1 === y) {
//         if (g_edgex1SortedDataset[i].visited ||
//           (optStartId && g_edgex1SortedDataset[i].id === optStartId));
//         else
//           x1Indexes.push(i);
//       }
//     }
//   }

//   return {
//     oSortedIndexes: x0Indexes,
//     dSortedIndexes: x1Indexes
//   };
// }

// function clearPaths() {
//   _.forEach(g_pathIds, function(id) {
//     var selected = d3.select(`#${id}`);
//     selected.style('stroke', 'black');
//   });
// }



// function edgeEqual(e1, e2) {
//   return e1.a === e2.a && e1.b === e2.b;
// }

function getNextLinks(possibleConnections, optIdx) {
  if (!optIdx) return possibleConnections;
  return _.filter(possibleConnections, function (e) {
    // return !edgeEqual(e, optIdx);
    return e.nodeIdx !== optIdx;
  });
}

function getDestVertex(originPt, edge) {
  // TODO performance perhaps use ids instead
  if (!fastFloorEqual(originPt, edge.dest.point)) {
    return edge.dest;
  } else {
    return edge.origin;
  }
}

function buildNode(pt, cost, path, connectedNodes) {
  return { point: pt,
          tCost: cost,
          path: path,
          connectedNodes: connectedNodes
  };
}

function insertNode(nodes, pt) {
  var foundIdx = _.findIndex(nodes, function (vertex) {
    return fastFloorEqual(pt, vertex.point);
  });
  if (foundIdx === -1) {
    nodes.push(buildNode(pt, undefined, [], []));
    return { idx: nodes.length-1, new: true };
  }
  return { idx: foundIdx, new: false };
}

function insertConnectedNode(array, idx, sharedCostPath) {
  if (!_.find(array, {nodeIdx: idx, costPath: sharedCostPath})) {
    array.push({nodeIdx: idx, costPath: sharedCostPath});
  }
}

function getMergedVertices(vertexItr) {
  // TODO set the information in the links
  var rslt = [];
  var vecRslt = vertexItr.next();
  while (!vecRslt.done) {
    if (vecRslt.value.point && vecRslt.value.edge.splitSite) {
      var insertData = insertNode(rslt, vecRslt.value.point);

      _.each(vecRslt.value.connectedEdges, edge => {
        var v = getDestVertex(vecRslt.value.point, edge);
        var connIdx = insertNode(rslt, v.point).idx;
        var sharedCostPath = getEdgeId(edge);
        insertConnectedNode(rslt[connIdx].connectedNodes, insertData.idx, sharedCostPath);
        insertConnectedNode(rslt[insertData.idx].connectedNodes, connIdx, sharedCostPath);
      });

      // if (insertData.new) {
      //   // if the inserted
      //   _.each(vecRslt.value.connectedEdges, edge => {
      //     var v = getDestVertex(vecRslt.value.point, edge);
      //     var connIdx = insertNode(v.point, rslt).idx;
      //     var sharedCostPath = getEdgeId(edge);
      //     rslt[connIdx].connectedNodes.push({nodeIdx: insertData.idx, costPath: sharedCostPath});
      //     rslt[insertData.idx].connectedNodes.push({nodeIdx: connIdx, costPath: sharedCostPath});
      //   });
      // } else {
      //   // console.error("Found non-unique node");
      //   // rslt[foundIdx].connectedEdges = _.concat(rslt[foundIdx].connectedEdges, vecRslt.value.connectedEdges);

      // }
    }
    vecRslt = vertexItr.next();
  }
  return rslt;
}

// single point implementation
// ({x,y,tc, path:[id1,id2,id3...]})
function shortestPath(gvdVertex, comingFromIdx = null) {
  // get closest links
  // visit each closest line if the total cost is less than the current cost
  // update the path to the current node
  // var linkedIdxs = getConnectedEdges(point.x, point.y);
  var nextLinks = getNextLinks(gvdVertex.connectedNodes, comingFromIdx);
  var currentPoint = gvdVertex;

  // loop for linear vertex with degree 2
  if (nextLinks.length === 1) {
    while(nextLinks.length === 1) {
      // mark the next vertex in line with a path
      // nextLinks = getNextLinks(gvdVertex.connectedEdges, optIncomingEdge);
      // var destVertex = getDestVertex(currentPoint.point, nextLinks[0]);
      var destNode = g_gvdVertices[nextLinks[0].nodeIdx];
      var newCost = dist(destNode.point, currentPoint.point) + currentPoint.tCost;
      // if we should take it
      if (!destNode.tCost || newCost < destNode.tCost) {
        // take the route
        destNode.tCost = newCost;
        destNode.path = _.concat(currentPoint.path, [nextLinks[0].costPath]);
        currentPoint = destNode;
      } else {
        // end
        return;
      }
      nextLinks = getNextLinks(currentPoint.connectedNodes, nextLinks[0].nodeIdx);
    }
  }

  // recursive approach for branching vertex with degree > 2
  _.each(nextLinks, edgeLink => {
    // var destVertex = getDestVertex(currentPoint.point, edgeLink);
    // var newCost = dist(destVertex.point, currentPoint.point) + currentPoint.tCost;
    var destNode = g_gvdVertices[edgeLink.nodeIdx];
    var newCost = dist(destNode.point, currentPoint.point) + currentPoint.tCost;
    // if we should take it
    if (!destNode.tCost || newCost < destNode.tCost) {
      // take the route
      destNode.tCost = newCost;
      destNode.path = _.concat(currentPoint.path, [edgeLink.costPath]);
      shortestPath(destNode, edgeLink.nodeIdx);
    }
  });
}

function highlightPath(path, color) {
  _.each(path, function (pId) {
    var selected = d3.select(`#${pId}`);
    selected.style('stroke', color)
    selected.style("stroke-width", 10)
    ;

    g_currentHighlightedPaths.push(pId);
  });
}

function unHighlightPaths() {
  _.each(g_currentHighlightedPaths, function (pId) {
    var selected = d3.select(`#${pId}`);
    selected.style('stroke', (d) => {
      return g_settings.showGVDSeg.value ? 'black' : 'none';
    })
    selected.style("stroke-width", 4)
    ;

  });
}

function onNodeHighlight(path) {
  // var linkedIdxs = getConnectedEdges(pt.x, pt.y);
  // var paths = [];
  // _.each(linkedIdxs.oSortedIndexes, function (idx) {
  //   var edge = g_edgex0SortedDataset[idx];
  //   if (!edge.tCost || !edge.path)
  //     console.log("No path information available");
  //   else
  //     paths.push({route: edge.path, cost: edge.tCost});
  // });

  // _.each(linkedIdxs.dSortedIndexes, function (idx) {
  //   var edge = g_edgex1SortedDataset[idx];
  //   if (!edge.tCost || !edge.path)
  //    console.log("No path information available");
  //   else
  //     paths.push({route: edge.path, cost: edge.tCost});
  // });

  // paths = _.sortBy(paths, 'cost');
  // // TODO perhaps highlight the second or third routes
  // if (paths.length > 0)
  //   highlightPath(paths[0].route, "blue");
}


// OLD
// var nextPts = [];
  // _.each(linkedIdxs.oSortedIndexes, function (idx) {
  //   // var edge = g_edgex0SortedDataset[idx];
  //   var newCost = point.tc + g_edgex0SortedDataset[idx].cost;
  //   var newPath = _.concat(point.path, [g_edgex0SortedDataset[idx].id]); //[getEdgeId(edge)]);
  //   var old = g_edgex0SortedDataset[idx].tCost;
  //   if (old && old < newCost); // do nothing
  //   else {
  //     g_edgex0SortedDataset[idx].tCost = newCost;
  //     // g_edgex0SortedDataset[idx].path = point.path;
  //     g_edgex0SortedDataset[idx].path = newPath;
  //     nextPts.push({x: g_edgex0SortedDataset[idx].x1,
  //       y: g_edgex0SortedDataset[idx].y1,
  //       tc: newCost,
  //       path: newPath});
  //   }
  // });

  // _.each(linkedIdxs.dSortedIndexes, function (idx) {
  //   // var edge = g_edgex1SortedDataset[idx];
  //   var newCost = point.tc + g_edgex1SortedDataset[idx].cost;
  //   var newPath = _.concat(point.path, [g_edgex1SortedDataset[idx].id]);
  //   var old = g_edgex1SortedDataset[idx].tCost;
  //   if (old && old < newCost); // do nothing
  //   else {
  //     g_edgex1SortedDataset[idx].tCost = newCost;
  //     // g_edgex1SortedDataset[idx].path = point.path;
  //     g_edgex1SortedDataset[idx].path = newPath;
  //     nextPts.push({x: g_edgex1SortedDataset[idx].x0,
  //       y: g_edgex1SortedDataset[idx].y0,
  //       tc: newCost,
  //       path: newPath});
  //   }
  // });

  // nextPts = _.sortBy(nextPts, "tc");
  // // visit the next points by distance
  // _.each(nextPts, function(pt) {
  //   shortestPath(pt);
  // });