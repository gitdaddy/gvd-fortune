"use strict";

let edgeDataset = [];
// let sortedX0 = [];
// let sortedX1 = [];
// let sortedY0 = [];
// let sortedY1 = [];

/**
 * Performs a binary search on the host array. This method can either be
 * injected into Array.prototype or called with a specified scope like this:
 * binaryIndexOf.call(someArray, searchElement);
 *
 * @param {*} searchElement The item to search for within the array.
 * @return {Number} The index of the element which defaults to -1 when not found.
 */
// function binaryIndexOf(searchElement, array) {

//     var minIndex = 0;
//     var maxIndex = array.length - 1;
//     var currentIndex;
//     var currentElement;

//     while (minIndex <= maxIndex) {
//         currentIndex = (minIndex + maxIndex) / 2 | 0;
//         currentElement = array[currentIndex];

//         if (currentElement < searchElement) {
//             minIndex = currentIndex + 1;
//         }
//         else if (currentElement > searchElement) {
//             maxIndex = currentIndex - 1;
//         }
//         else {
//             return currentIndex;
//         }
//     }

//     return -1;
// }

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
      id: getEdgeId(e)
    };
    edgeDataset.push(obj);
  });
  // sortedX0 = _.sortBy(edgeDataset, 'x0');
  // sortedX1 = _.sortBy(edgeDataset, 'x1');
  // sortedY0 = _.sortBy(edgeDataset, 'y0');
  // sortedY1 = _.sortBy(edgeDataset, 'y1');

  console.log("set edges:" + edgeDataset.length);
}

function getConnectedEdges(x, y, id) {
  return _.filter(edgeDataset, function (edge) {
    if (edge.id === id) return false;
    return edge.x0 === x && edge.y0 === y || edge.x1 === x && edge.y1 === y;
  });
}

function onBeginPathAlgorithm() {
  if (!(g_pathStartElem && g_pathEndElem)) {
    console.error("Please select a path start and finish");
    return;
  }
  // console.log(edgeDataset.length);
  var originX = g_pathStartElem.origin.point[0];
  var originY = g_pathStartElem.origin.point[1];
  var destX = g_pathEndElem.dest.point[0];
  var destY = g_pathEndElem.dest.point[1];

  // testing only
  var co = getConnectedEdges(originX, originY, getEdgeId(g_pathStartElem));
  var cd = getConnectedEdges(destX, destY, getEdgeId(g_pathEndElem));

  console.log("origin connected edges:" + co.length);
  console.log("dest connected edges:" + cd.length);
}
