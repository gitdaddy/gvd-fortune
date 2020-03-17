"use strict";

var g_sweepline = {x1: -1, x2:1, y: -1};
var g_eventThresh = 1e-6;

let g_polygons = [];
let g_queue = {};

let g_datasetList = [
  {label:"Maze Dataset", filePath: "./data/maze/_files.txt"},
  // {label:"Maze Dataset", filePath: "./gvd2.0/test_output/_files.txt"},
  {label:"100 Random", num:100, filePath: "./data/random_100/_files.txt"},
  {label:"200 Random", num:200, filePath: "./data/random_200/_files.txt"},
  {label:"500 Random", num:500, filePath: "./data/random_500/_files.txt"},
  {label:"1000 Random", num:1000, filePath: "./data/random_1000/_files.txt"},
  // {label:"Sydney city dataset", isMap: true, filename:"Sydney_2_512.map"}, // TODO add more versions
  // {label:"Berlin city dataset", isMap: true, filename:"Berlin_0_256.map"},
  // {label:"Boston city dataset", isMap: true, filename:"Boston_0_256.map"},
  // {label:"Moscow city dataset", isMap: true, filename:"Moscow_1_256.map"},
  // {label:"Denver city dataset", isMap: true, filename:"Denver_0_256.map"}, // TODO FIX
  // {label:"Milan city dataset", isMap: true, filename:"Milan_0_256.map"}, // TODO FIX
  // {label:"NewYork city dataset", isMap: true, filename:"NewYork_1_256.map"}, // TODO FIX
  // {label:"Paris city dataset", isMap: true, filename:"Paris_0_256.map"}, // TODO FIX
  // {label:"Shanghai city dataset", isMap: true, filename:"Shanghai_2_256.map"},
  {label:"Holes-64", filePath: "./data/holes/h_64/_files.txt"},
  {label:"Holes-128", filePath: "./data/holes/h_128/_files.txt"},
  {label:"Holes-256", filePath: "./data/holes/h_256/_files.txt"},
  {label:"Holes-512", filePath: "./data/holes/h_512/_files.txt"},
  {label:"Holes-1024", filePath: "./data/holes/h_1024/_files.txt"},
  {label:"Holes-2048", filePath: "./data/holes/h_2048/_files.txt"},
  {label:"Holes-4096", filePath: "./data/holes/h_4096/_files.txt"},
  {label:"Holes-8192", filePath: "./data/holes/h_8192/_files.txt"},
  {label:"Holes-16384", filePath: "./data/holes/h_16384/_files.txt"},
  {label:"Holes-32768", filePath: "./data/holes/h_32768/_files.txt"},
  {label:"Data Testing", filePath: "./data/test/_files.txt"}
 ];

let closeEventPoints = [];
let dcel;

// Debug options
let g_debugObjs = [];
let g_addDebug = false;
let g_debugIdLeft = undefined;
let g_debugIdMiddle = undefined;
let g_debugIdRight = undefined;

let g_sInc = 0.01;
let g_xInc = 0.001;

let g_settings = {
  Enable_C: {label: "Enable C++", value: false},
  showEvents: {label: "Show Events", value: true},
  showGVDVer: {label: "Show GVD vertices", value: true},
  showGVDSeg: {label: "Show GVD segments", value: true},
  showObjVer: {label: "Show object vertices", value: true},
  showObjSeg: {label: "Show object segments", value: true},
  showMedial: {label: "Show Medial Axis", value: false},
  showDebugObjs: {label: "Show Debug Input", value: false}, // debugging only
  showTree: {label: "Show Tree", value: false},
  showBeachLine: {label: "Show beachline", value: true},
  showOverview: {label: "Show Overview", value: false}
};

let g_treeId = "#treeTagId";

// debugging only
function updateDebugVars() {
  var p = document.getElementsByName("xIncVal")[0].valueAsNumber;
  g_xInc = _.isNaN(p) ? g_xInc : p;
  var i = document.getElementsByName("incVal")[0].valueAsNumber;
  g_sInc = _.isNaN(i) ? g_sInc : i;
  // g_debugIdLeft = document.getElementsByName("leftId")[0].valueAsNumber;
  // localStorage.g_debugIdLeft = g_debugIdLeft;
  // g_debugIdMiddle = document.getElementsByName("middleId")[0].valueAsNumber;
  // localStorage.g_debugIdMiddle = g_debugIdMiddle;
  // g_debugIdRight = document.getElementsByName("rightId")[0].valueAsNumber;
  // localStorage.g_debugIdRight = g_debugIdRight;
}

function setSweepline(d) {
  g_sweepline.y = d;
  localStorage.sweepline = d;
}

function incSweepline(inc) {
  g_sweepline.y += inc;
  setSweepline(g_sweepline.y);
}

function updateSweepline() {
  var elem = document.getElementById("sweeplineInput");
  moveSweepline(parseFloat(elem.value));
}

// template to call the server
// function callServer() {
//   var query = '/holes';
//   $.get(query)
// }

function keydown(event) {
  var x = event.keyCode;
  var key = event.key;
  var changed = false;
  var inc = 0.01;
  if (x == 40 || key == "j" || key == "J") {
    // Down arrow
    if (event.shiftKey) {
      incSweepline(-inc * g_sInc);
    } else if (event.ctrlKey) {
      incSweepline(-inc * 10);
    } else {
      incSweepline(-inc);
    }
    changed = true;
  } else if (x == 38 || key == "k" || key == "K") {
    // Up arrow
    if (event.shiftKey) {
      incSweepline(inc * g_sInc);
    } else if (event.ctrlKey) {
      incSweepline(inc * 10);
    } else {
      incSweepline(inc);
    }
    changed = true;
  }
  if (changed) {
    // Prevent scroll
    event.preventDefault();
    document.getElementById("sweeplineInput").value = g_sweepline.y.toFixed(10);

    if (g_settings.Enable_C.value)
      sweeplineUpdate_C_addon(localStorage.setIdx);
    else
      render();
  }
}

function init() {
  setExampleDataset();
  if (localStorage.sweepline && !_.isNaN(localStorage.sweepline)
  && localStorage.sweepline !== "NaN") {
    g_sweepline.y = parseFloat(localStorage.sweepline);
  }

  // debugging only
  document.getElementsByName("xIncVal")[0].valueAsNumber = g_xInc;
  document.getElementsByName("incVal")[0].valueAsNumber = g_sInc;

  drawInit(g_sweepline, g_settings);

  document.onkeydown = keydown;
  document.getElementById("sweeplineInput").value = g_sweepline.y.toFixed(10);

  _.forEach(g_datasetList, function (p) {
    var option = document.createElement("option");
    option.text = p.label;
    document.getElementById("dataset-select").add(option);
  });

  var idx = 15;
  // if (localStorage.setIdx) {
  //   var idx = localStorage.setIdx;
  // }
  document.getElementById("dataset-select").selectedIndex = idx;
  if (g_settings.Enable_C.value)
    datasetChange_C_addon(idx);
  else
    datasetChange(idx);
}

function datasetChange_C_addon(idx) {
  localStorage.setIdx = idx;
  var query = '/data_new/?value=' + g_datasetList[idx].filePath + "&sweepline=" + g_sweepline.y.toFixed(10);
  $.get(query).then(function (json) {
    if (json.err && json.err.length > 0) {
      console.error("Server error: " + json.err);
      return;
    }

    if (json.msg && json.msg.length > 0) {
      console.log("Server message: " + json.msg);
    }

    var sites = JSON.parse(json.sites);
    var edges = JSON.parse(json.edges);
    var beachline = JSON.parse(json.beachline);
    var closeEvents = JSON.parse(json.closeEvents);

    renderData(sites, edges, beachline, closeEvents);
  });
}

function sweeplineUpdate_C_addon(idx) {
  localStorage.setIdx = idx;
  drawSweepline(g_sweepline);
  var query = '/line_change/?value=' + g_datasetList[idx].filePath + "&sweepline=" + g_sweepline.y.toFixed(10);
  $.get(query).then(function (json) {
    if (json.err && json.err.length > 0) {
      console.error("Server error: " + json.err);
      return;
    }

    if (json.msg && json.msg.length > 0) {
      console.log("Server message: " + json.msg);
    }
    // var sites = JSON.parse(json.sites);
    var edges = JSON.parse(json.edges);
    var beachline = JSON.parse(json.beachline);
    var closeEvents = JSON.parse(json.closeEvents);
    renderData([], edges, beachline, closeEvents);
    enforceSettings();
  });
}

function datasetChange(idx) {
  localStorage.setIdx = idx;
  if (!g_datasetList[idx].data) {
    if (g_datasetList[idx].isMap) {
      var query = '/map/?value=' + './data/maps/' + g_datasetList[idx].filename;
      $.get(query).then(function (json) {
        var polygons = parseInputMap(json);
        g_datasetList[idx].data = polygons;
        g_polygons = polygons;
        processNewDataset();
      });
    } else {
      var query = '/data/?value=' + g_datasetList[idx].filePath;
      $.get(query).then(function (json) {
        var polygons = parseInputJSON(json);
        g_datasetList[idx].data = polygons;
        g_polygons = polygons;
        processNewDataset();
      });
    }
  } else {
    g_polygons = g_datasetList[idx].data; // load the cached data
    processNewDataset();
  }
}

function fortune(reorder) {
  nodeId = 1;
  var queue = createDataQueue(reorder);
  dcel = new DCEL();
  var beachline = new Beachline(dcel);
  closeEventPoints = [];
  if (queue.length < 1) return beachline;
  var nextY = getEventY(queue[queue.length - 1]);

  var tStart = performance.now();
  while (queue.length > 0 && nextY > g_sweepline.y) {
    var event = queue.pop();
    if (event.isCloseEvent) {
      if (event.live && event.arcNode.closeEvent.live) {

        // only set if not overridden // TODO Performance
        var prevEdge = event.arcNode.prevEdge();
        var nextEdge = event.arcNode.nextEdge();

        var endingEdges = [];
        if (!prevEdge.dcelEdge.dest.overridden && !neighborSites(prevEdge)) {
          endingEdges.push(prevEdge.dcelEdge);
        }
        if (!nextEdge.dcelEdge.dest.overridden && !neighborSites(nextEdge)) {
          endingEdges.push(nextEdge.dcelEdge);
        }

        var curY = getEventY(event);
        var newEvents = beachline.remove(event.arcNode, event.point, curY, endingEdges);
        newEvents.forEach(function (ev) {
            var newY = getEventY(ev);
            if (newY < curY - g_eventThresh || Math.abs(newY - curY) < g_eventThresh) {
            sortedInsertion(queue, ev);
            if (ev.isCloseEvent) {
              closeEventPoints.push(ev);
            }
          }
        });
      }
    } else {
      // Site event
      var packet = getEventPacket(event, queue);
      var newEvents = beachline.add(packet);
      var curY = getEventY(event);
      newEvents.forEach(function (ev) {
        var newY = getEventY(ev);
        if (newY < curY - g_eventThresh || Math.abs(newY - curY) < g_eventThresh) {
          sortedInsertion(queue, ev);
          if (ev.isCloseEvent) {
            closeEventPoints.push(ev);
          }
        }
      });
    }
    if (queue.length > 0)
      nextY = getEventY(queue[queue.length - 1]);
  }
  var tEnd = performance.now();
  var loopTime = tEnd - tStart;

  // Processing metrics
  console.log("Time in loop:" + loopTime.toFixed(6) + "(ms)");

  // debugging only
  // var ev = '';
  // while (queue.length > 0) {
  //   var e = queue.pop();
  //   var yval = e.type === "segment" ? e[0][1] : e[1];
  //   var at = "(y)@:" + yval + " ";
  //   var data;
  //   if (e.type == "segment") {
  //     data = at + 'a(' + e[0][0] + ',' + e[0][1] + ') - b(' + e[1][0] + ',' + e[1][1] + ')';
  //   } else if (e.isCloseEvent) {
  //     var live = e.live && e.arcNode.closeEvent.live ? "(Live)" : "(Dead)";
  //     data = at + 'Close:' + e.id + " " + live + ' -point(' + e.point[0] + ',' + e.point[1] + ')';
  //   } else {
  //     data = at + 'point(' + e[0] + ',' + yval + ')';
  //   }
  //   if (e.isCloseEvent) {
  //     ev += data;
  //   } else {
  //     ev += data;
  //     // ev += data + ' r: ' + e.relation;
  //   }
  //   ev += '\n';
  // }
  // document.getElementById("events").innerHTML = ev;
  return beachline;
}

function moveSweepline(y) {
  setSweepline(y);
  if (g_settings.Enable_C.value)
  sweeplineUpdate_C_addon(localStorage.setIdx);
  else
    render();
}

function render(reorder = false) {
  clearSurface();
  g_debugObjs = [];
  var t0 = performance.now();
  var beachline = fortune(reorder);
  var t1 = performance.now();
  var processTime = t1 - t0;
  console.log("Process Time:" + processTime.toFixed(6) + "(ms)");

  var t2 = performance.now();
  drawBeachline(beachline, g_sweepline.y);
  // drawCloseEvents(closeEventPoints);
  drawSweepline(g_sweepline);
  drawSurface(dcel);
  var t3 = performance.now();
  var drawTime = t3 - t2;
  console.log("Draw Time:" + drawTime.toFixed(6) + "(ms)");

  if (g_settings.showTree.value){
    showTree(beachline.root);
  }

  enforceSettings();
  // runTests();
}
