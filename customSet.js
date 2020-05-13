"use strict";

function customClearSites() {
  g_datasetList[g_setIdx].data = [];
  clearSurface();
  clearSites();
  clearBeachLine();
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
    return; // TODO
  } else { // polylines
    return; // TODO
  }
  datasetUpdate();
}