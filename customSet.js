"use strict";

var g_firstSegPoint = true;

var g_polyLineIdx = 0;

function customClearSites() {
  g_datasetList[g_setIdx].data = [];
  clearSurface();
  clearSites();
  clearBeachLine();
  g_firstSegPoint = true;
  g_polyLineIdx = 0;
}

function customSetClick() {
  var sect = document.getElementById("types");
  var sVal = sect.options[sect.selectedIndex].value;

  // console.log("Selection:" + sVal);

  var mouse = d3.mouse(this);
  var px = mouse[0];
  var py = mouse[1];

  // var p = {x: xToGVD(px), y: yToGVD(py)};
  // console.log("main view clicked at point: " + px + "," + py);
  // console.log("Converted to at point: " + p.x + "," + p.y);

  if (sVal === "none") {
    return;
  } else if (sVal === "points") {
    var poly = new Polygon();
    poly.addPoint(vec3(xToGVD(px), yToGVD(py), 0));
    if (!g_datasetList[g_setIdx].data)
      g_datasetList[g_setIdx].data = [];
    g_datasetList[g_setIdx].data.push(poly);
  } else if (sVal === "segments") {
    if (g_firstSegPoint) {
      var poly = new Polygon();
      poly.addPoint(vec3(xToGVD(px), yToGVD(py), 0));
      if (!g_datasetList[g_setIdx].data)
        g_datasetList[g_setIdx].data = [];
      g_datasetList[g_setIdx].data.push(poly);
      g_firstSegPoint = false;
    } else {
      if (!g_datasetList[g_setIdx].data) return;

      var len = g_datasetList[g_setIdx].data.length;
      var lastPoly = g_datasetList[g_setIdx].data[len - 1];
      lastPoly.addPoint(vec3(xToGVD(px), yToGVD(py), 0));
      lastPoly.createSegment(0, 1);

      g_firstSegPoint = true;
    }
  } else { // polylines
    if (g_polyLineIdx === 0) {
      var poly = new Polygon();
      poly.addPoint(vec3(xToGVD(px), yToGVD(py), 0));
      if (!g_datasetList[g_setIdx].data)
        g_datasetList[g_setIdx].data = [];
      g_datasetList[g_setIdx].data.push(poly);
      g_polyLineIdx++;
    } else {
      if (!g_datasetList[g_setIdx].data) return;

      var len = g_datasetList[g_setIdx].data.length;
      var lastPoly = g_datasetList[g_setIdx].data[len - 1];
      var newPoint = vec3(xToGVD(px), yToGVD(py), 0);

      if (lastPoly.points && lastPoly.points.length > 2) {
        var firstPoint = lastPoly.points[0];
        // if the points are within 1e2 of each other
        var a = firstPoint[0] * 10;
        var b = newPoint[0] * 10;
        var c = firstPoint[1] * 10;
        var d = newPoint[1] * 10;
        var x1 = Math.round(a);
        var x2 = Math.round(b);
        var y1 = Math.round(c);
        var y2 = Math.round(d);
        if (x1 === x2 && y1 === y2) {
          lastPoly.createSegment(0, g_polyLineIdx-1);
          g_polyLineIdx = 0;
          datasetUpdate();
          return;
        }
      }
      lastPoly.addPoint(newPoint);
      lastPoly.createSegment(g_polyLineIdx-1, g_polyLineIdx);
      g_polyLineIdx++;
    }
  }
  datasetUpdate();
}