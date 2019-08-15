"use strict";

var sweepline = 0.1;

let g_datasets = {};
let g_polygons = [];
let g_queue = {};


var closeEventPoints = [];
var dcel;

// Debug options
var g_debugObjs = [];
var g_addDebug = false;
var g_debugIdLeft = undefined;
var g_debugIdMiddle = undefined;
var g_debugIdRight = undefined;

let showEvents = false;
let showDebugObjs = false;
let fullScreen = false;
let hideInfo = false;

function changeNodeIds() {
  g_debugIdLeft = document.getElementsByName("leftId")[0].valueAsNumber;
  g_debugIdMiddle = document.getElementsByName("middleId")[0].valueAsNumber;
  g_debugIdRight = document.getElementsByName("rightId")[0].valueAsNumber;
}

function setSweepline(d) {
  sweepline = d;
  localStorage.sweepline = d;
}

function incSweepline(inc) {
  setSweepline(sweepline + inc);
}

function keydown(event) {
  var x = event.keyCode;
  var key = event.key;
  var changed = false;
  var inc = 0.01;
  if (x == 40 || key == "j" || key == "J") {
    // Down arrow
    if (event.shiftKey) {
      incSweepline(-inc * 0.1);
    } else if (event.ctrlKey) {
      incSweepline(-inc * 10);
    } else {
      incSweepline(-inc);
    }
    changed = true;
  } else if (x == 38 || key == "k" || key == "K") {
    // Up arrow
    if (event.shiftKey) {
      incSweepline(inc * 0.1);
    } else if (event.ctrlKey) {
      incSweepline(inc * 10);
    } else {
      incSweepline(inc);
    }
    changed = true;
  } else if (key == "d") {
    // Print the sweepline value
    console.log("sweepline = " + sweepline);
  } else if (key == "i") {
    isoEdgeWidth = isoEdgeWidth == 0 ? 1 : 0;
    changed = true;
  } else if (key == 'e') {
    showEvents = !showEvents;
    d3.selectAll(".close-event")
      .attr('visibility', showEvents ? null : 'hidden');
  } else if (key == 'v') {
    showDebugObjs = !showDebugObjs;
    d3.selectAll(".debug-line")
      .attr('visibility', showDebugObjs ? null : 'hidden');
    d3.selectAll(".debug-parabola")
      .attr('visibility', showDebugObjs ? null : 'hidden');
  }
  if (changed) {
    // Prevent scroll
    event.preventDefault();

    var t0 = performance.now();
    render();
    var t1 = performance.now();
    // console.log("Call to render took " + (t1 - t0) + " milliseconds.")

    document.getElementById("sweeplineLabel").innerHTML = sweepline.toFixed(10);
  }
}

function init() {
  if (localStorage.sweepline) {
    sweepline = parseFloat(localStorage.sweepline);
  }
  drawInit();

  document.onkeydown = keydown;
  document.getElementById("gvdsvg").onclick = mouseclick;
  document.getElementById("fullscreenToggle").onclick = toggleFS;
  document.getElementById("hideInfo").onclick = toggleHideInfo;
  document.getElementById("sweeplineLabel").innerHTML = sweepline.toFixed(10);

  createDatasets();
  for (let key in g_datasets) {
    var option = document.createElement("option");
    option.text = key;
    document.getElementById("g_dataset").add(option);
  }

  if (localStorage.g_dataset) {
    document.getElementById("g_dataset").value = localStorage.g_dataset;
  }
  datasetChange(document.getElementById("g_dataset").value);
}

function datasetChange(value) {
  console.log(value);
  localStorage.g_dataset = value;
  clearSurface();

  if (value == 'dataset6') {
    if (g_datasets[value].length == 0) {
      $.get("/data").then(function (json) {
        var polygons = parseInputJSON(json);
        polygons.push(g_boundingBox);
        g_datasets[value] = polygons;
        g_polygons = polygons;
        processNewDataset();
      });
    } else {
      g_polygons = g_datasets[value]; // load the cached data
      processNewDataset();
    }
  } else {
    g_polygons = g_datasets[value];
    processNewDataset();
  }
}

function fortune(reorder) {
  nodeId = 1;
  var eventThresh = 0.000001;
  var queue = createDataQueue(reorder);
  dcel = new DCEL();
  var beachline = new Beachline(dcel);
  closeEventPoints = [];
  if (queue.length < 1) return beachline;
  var nextY = queue[queue.length - 1].y;
  while (queue.length > 0 && nextY > sweepline) {
    var event = queue.pop();
    if (event.isCloseEvent) {
      if (event.live && event.arcNode.closeEvent.live) {
        var destPrev = event.arcNode.prevEdge().dcelEdge.dest;
        var destNext = event.arcNode.nextEdge().dcelEdge.dest;
        // only set if not overridden
        if (!destPrev.overridden) {
          destPrev.point = event.point;
        }
        if (!destNext.overridden) {
          destNext.point = event.point;
        }
        var newEvents = beachline.remove(event.arcNode, event.point, event.y);
        newEvents.forEach(function (ev) {
          if (ev.y < event.y - 0.000001 || Math.abs(ev.y - event.y) < eventThresh) {
            sortedInsertion(queue, ev);
            if (ev.isCloseEvent) {
              closeEventPoints.push(ev);
            }
          }
        });
        // closeEventPoints.push(e.point);
      }
    } else {
      // Site event
      var packet = getEventPacket(event, queue);
      var newEvents = beachline.add(packet);
      newEvents.forEach(function (ev) {
        if (ev.y < event.y - 0.000001 || Math.abs(ev.y - event.y) < eventThresh) {
          sortedInsertion(queue, ev);
          if (ev.isCloseEvent) {
            closeEventPoints.push(ev);
          }
        }
      });
    }
    if (queue.length > 0)
      nextY = queue[queue.length - 1].y;
  }

  var ev = '';
  while (queue.length > 0) {
    var e = queue.pop();
    var at = "(y)@:" + e.y + " ";
    var data;
    if (e.type == "segment") {
      data = at + 'a(' + e.a.x + ',' + e.a.y + ') - b(' + e.b.x + ',' + e.b.y + ')';
    } else if (e.isCloseEvent) {
      var live = e.live && e.arcNode.closeEvent.live ? "(Live)" : "(Dead)";
      data = at + 'Close:' + e.id + " " + live + ' -point(' + e.point.x + ',' + e.point.y + ')';
    } else {
      data = at + 'point(' + e.x + ',' + e.y + ')';
    }
    if (e.isCloseEvent) {
      ev += data;
    } else {
      ev += data + ' r: ' + e.relation;
    }
    ev += '\n';
  }
  document.getElementById("events").innerHTML = ev;
  return beachline;
}

function render(reorder = false) {
  g_debugObjs = [];
  var t0 = performance.now();
  var beachline = fortune(reorder);
  var t1 = performance.now();

  var t = t1 - t0;
  // console.log("Time to process:" + t);

  drawBeachline(beachline, sweepline, showEvents);
  drawCloseEvents(closeEventPoints);
  drawSweepline(sweepline);
  drawSurface(dcel);

  showTree(beachline.root);

  runTests();
}
