"use strict";

var g_sweepline = {x1: -1, x2:1, y: -1};
var g_eventThresh = 1e-6;

let g_queue = {};

// let g_addTime = 0;

let g_setIdx = 0;

let g_datasetList = [
  {label:"Build Your Own", sanitize: true, customSet:true},
  {label:"Maze Dataset", sanitize: true, filePath: "./data/maze/files.txt"},
  {label:"100 Random Lines", num:100, filePath: "./data/random_100/files.txt"},
  {label:"500 Random Lines", num:500, filePath: "./data/random_500/files.txt"},
  {label:"1000 Random Lines", num:1000, filePath: "./data/random_1000/files.txt"},
  {label:"Sydney city dataset", sanitize: true, isMap: true, filePath:"./data/maps/Sydney_2_512.map"},
  {label:"Berlin city dataset", sanitize: true, isMap: true, filePath:"./data/maps/Berlin_0_256.map"},
  {label:"Boston city dataset", sanitize: true, isMap: true, filePath:"./data/maps/Boston_0_256.map"},
  {label:"Moscow city dataset", sanitize: true, isMap: true, filePath:"./data/maps/Moscow_1_256.map"},
  {label:"Holes-64", sanitize: true, filePath: "./data/holes/h_64/files.txt"},
  {label:"Holes-128", sanitize: true, filePath: "./data/holes/h_128/files.txt"},
  {label:"Holes-256", sanitize: true, filePath: "./data/holes/h_256/files.txt"},
  {label:"Holes-512", sanitize: true, filePath: "./data/holes/h_512/files.txt"},
  {label:"Holes-1024", sanitize: true, filePath: "./data/holes/h_1024/files.txt"},
  {label:"Holes-2048", sanitize: true, filePath: "./data/holes/h_2048/files.txt"},
  {label:"Holes-4096", sanitize: true, filePath: "./data/holes/h_4096/files.txt"},
  {label:"Holes-8192", sanitize: true, filePath: "./data/holes/h_8192/files.txt"},
  {label:"Holes-16384", sanitize: true, filePath: "./data/holes/h_16384/files.txt"},
  // {label:"Holes-32768", sanitize: true, filePath: "./data/holes/h_32768/files.txt"},
  {label:"RPG 64", filePath: "./data/rpg_64/files.txt"},
  {label:"RPG 128", filePath: "./data/rpg_128/files.txt"},
  {label:"RPG 256", filePath: "./data/rpg_256/files.txt"},
  {label:"RPG 512", filePath: "./data/rpg_512/files.txt"},
  {label:"RPG 1024", filePath: "./data/rpg_1024/files.txt"},
  {label:"RPG 2048", filePath: "./data/rpg_2048/files.txt"},
  {label:"RPG 4096", filePath: "./data/rpg_4096/files.txt"},
  {label:"RPG 8192", filePath: "./data/rpg_8192/files.txt"},
  {label:"RPG 16384", filePath: "./data/rpg_16384/files.txt"},
  // {label:"RPG 32768", filePath: "./data/rpg_32768/files.txt"},
  {label:"Data Testing", filePath: "./data/test/files.txt"}
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
  // Enable_C: {label: "Enable C++", value: false},
  showEvents: {label: "Show Events", value: true},
  showSweepline: {label: "Show Sweepline", value: true},
  showGVDVer: {label: "Show GVD vertices", value: true},
  showGVDSeg: {label: "Show GVD segments", value: true},
  showObjVer: {label: "Show object vertices", value: true},
  showObjSeg: {label: "Show object segments", value: true},
  showMedial: {label: "Show Medial Axis", value: false},
  showDebugObjs: {label: "Show Debug Input", value: false}, // debugging only
  showTree: {label: "Show Beach Line Tree", value: false},
  showBeachLine: {label: "Show Beach Line", value: true},
  setMinPathDiameter: {label: "Set Min Path Diameter", value: false, num: undefined},
  // showOverview: {label: "Show Overview", value: false}
};

let g_treeId = "#treeTagId";

// debugging only
function updateDebugVars() {
  if (g_settings.showDebugObjs) {
    var p = document.getElementsByName("xIncVal")[0].valueAsNumber;
    g_xInc = _.isNaN(p) ? g_xInc : p;
    var i = document.getElementsByName("incVal")[0].valueAsNumber;
    g_sInc = _.isNaN(i) ? g_sInc : i;

    g_debugIdLeft = document.getElementsByName("leftId")[0].valueAsNumber;
    localStorage.g_debugIdLeft = g_debugIdLeft;
    g_debugIdMiddle = document.getElementsByName("middleId")[0].valueAsNumber;
    localStorage.g_debugIdMiddle = g_debugIdMiddle;
    g_debugIdRight = document.getElementsByName("rightId")[0].valueAsNumber;
    localStorage.g_debugIdRight = g_debugIdRight;

    if (g_pathStartElemId) {
      d3.select('#' + getEdgeVertexId(g_pathStartElemId)).style("fill", g_edgeColors[3]);
      g_pathStartElemId = undefined;
    }
  }

  if (g_settings.setMinPathDiameter) {
    // min cross section
    var minC = document.getElementsByName("minCrossSection")[0].valueAsNumber;
    g_settings.setMinPathDiameter.num = minC;
    localStorage.minC = minC;
  }
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
    render();
  }
}

function init() {
  var s = getLocalSettings();
  if (s) {
    _.assign(g_settings, s);
  }

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

  if (localStorage.setIdx) {
    g_setIdx = parseInt(localStorage.setIdx);
  }
  document.getElementById("dataset-select").selectedIndex = g_setIdx;
  datasetChange(g_setIdx);
}

function datasetChange(idx) {
  g_setIdx = idx;

  if (g_datasetList[g_setIdx].customSet) {
    resetView();
    clearSurface();
    clearSites();
    clearBeachLine();
    enforceSettings();
    // d3.select("#spinner")
    // .style('visibility', 'hidden');
  } else if (!g_datasetList[g_setIdx].data) {
    processNewDataset();
  } else {
    datasetUpdate();
  }

  localStorage.setIdx = g_setIdx;
}

function datasetUpdate() {
  var segments = [];
  var points = [];
  g_datasetList[g_setIdx].data.forEach(function(poly) {
    segments = segments.concat(poly.segments);
    points = points.concat(poly.points);
  });

  drawSites(points);
  drawSegments(segments);

  render();
  // updateOverview();
}

function fortune(reorder) {
  nodeId = 1;
  g_medialAxisEndingEdges = [];
  var queue = createDataQueue(reorder);
  dcel = new DCEL();
  var beachline = new Beachline(dcel);
  closeEventPoints = [];
  if (queue.length < 1) return beachline;
  var nextY = getEventY(queue[queue.length - 1]);

  // g_addTime = 0;
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
        var newEvents = beachline.remove(event.arcNode, event.point, curY, endingEdges, event.minR);
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

  // Processing metrics
  // console.log("Time in loop:" + loopTime.toFixed(6) + "(ms)");
  // console.log("Time adding:" + g_addTime.toFixed(6) + "(ms)");

  return beachline;
}

function moveSweepline(y) {
  setSweepline(y);
  render();
}

function render(reorder = false) {

  clearSurface();

  if (g_datasetList[g_setIdx].data) {
    g_debugObjs = [];
    var t0 = performance.now();
    reorder = reorder || g_datasetList[g_setIdx].customSet;
    var beachline = fortune(reorder);
    var t1 = performance.now();
    var processTime = t1 - t0;
    console.log("Process Time:" + processTime.toFixed(6) + "(ms)");

    var t2 = performance.now();
    drawBeachline(beachline, g_sweepline.y);
    drawCloseEvents(closeEventPoints);
    drawSurface(dcel);
    var t3 = performance.now();
    var drawTime = t3 - t2;
    console.log("Draw Time:" + drawTime.toFixed(6) + "(ms)");

    if (g_settings.showTree.value){
      showTree(beachline.root);
    }
  }

  drawSweepline(g_sweepline);
  enforceSettings();
  // runTests();
}


function snap() {
  console.log('Taking SVG snapshot');
  let XMLS = new XMLSerializer();
  let svgtext = XMLS.serializeToString(document.getElementById('mainView'));

  // console.log(svgtext);
  let textarea = document.getElementById("snapshot-output");
  // textarea.innerHTML = svgtext;
  textarea.value = svgtext;

  textarea.select();
  document.execCommand('copy');

  // const el = document.createElement('textarea');
  // el.value = svgtext;
  // document.body.appendChild(el);
  // el.select();
  // document.execCommand('copy');
  // document.body.removeChild(el);
}
