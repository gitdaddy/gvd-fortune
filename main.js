"use strict";

var g_sweepline = {x1: -1, x2:1, y: -1};
var g_eventThresh = 1e-6;

let g_datasets = {
  'dataset1' : [], // file dataset loaded asynchronously
  'dataset2' : [],
  'dataset3' : [],
  'dataset4' : [],
  'dataset5' : [],
  'dataset6' : [],
  'dataset7' : [],
  'dataset8' : [],
  'dataset9' : [],
  'dataset10' : [],
  'dataset11' : [],
  'dataset12' : [],
  'dataset13' : [],
  'dataset14' : [],
  'dataset15' : [],
  'dataset16' : [],
  'dataset17' : [],
  'dataset18' : [],
  'dataset19' : [],
  'dataset20' : []
};

let g_polygons = [];
let g_queue = {};

let g_fileDatasets = [
  {key:"dataset1", label:"dataset1"},
  {key:"dataset2", label:"dataset2 - 100 Random", num:100},
  {key:"dataset3", label:"dataset3 - 200 Random", num:200},
  {key:"dataset4", label:"dataset4 - 500 Random", num:500},
  {key:"dataset5", label:"dataset5 - 1000 Random", num:1000},
  {key:"dataset6", label:"dataset6 - Sydney city dataset", isMap: true, filename:"Sydney_2_512.map"},
  {key:"dataset7", label:"dataset7 - Berlin city dataset", isMap: true, filename:"Berlin_0_256.map"},
  {key:"dataset8", label:"dataset8 - Boston city dataset", isMap: true, filename:"Boston_0_256.map"},
  {key:"dataset9", label:"dataset9 - Moscow city dataset", isMap: true, filename:"Moscow_1_256.map"},
  {key:"dataset10", label:"dataset10 - Holes-64"},
  {key:"dataset11", label:"dataset11 - Holes-128"},
  {key:"dataset12", label:"dataset12 - Holes-256"},
  {key:"dataset13", label:"dataset13 - Holes-512"},
  {key:"dataset14", label:"dataset14 - Holes-1024"},
  {key:"dataset15", label:"dataset15 - Holes-2048"},
  {key:"dataset16", label:"dataset16 - Holes-4096"},
  {key:"dataset17", label:"dataset17 - Holes-8192"},
  {key:"dataset18", label:"dataset18 - Holes-16384"},
  {key:"dataset19", label:"dataset19 - Holes-32768"},
  {key:"dataset20", label:"dataset20"}
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
  showEvents: {label: "Show Events", value: false},
  showGVDVer: {label: "Show GVD vertices", value: false},
  showGVDSeg: {label: "Show GVD segments", value: true},
  showObjVer: {label: "Show object vertices", value: false},
  showObjSeg: {label: "Show object segments", value: true},
  showMedial: {label: "Show Medial Axis", value: false},
  showDebugObjs: {label: "Show Debug Input", value: false}, // debugging only
  showTree: {label: "Show Tree", value: false},
  showBeachLine: {label: "Show beach-line", value: true}
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

  _.forEach(g_fileDatasets, function (p) {
    var option = document.createElement("option");
    option.text = p.label;
    document.getElementById("g_dataset").add(option);
  });

  // if (localStorage.g_dataset) {
  //   document.getElementById("g_dataset").value = localStorage.g_dataset;
  // }
  document.getElementById("g_dataset").value = "dataset1";
  datasetChange(document.getElementById("g_dataset").value);
}

function datasetChange(value) {
  console.log(value);
  localStorage.g_dataset = value;

  var found = _.find(g_fileDatasets, function(f) { return f.label === value; });
  if (found) {
    if (g_datasets[found.key].length == 0) {
      if (found.isMap) {
        var query = '/map/?value=' + './data/maps/' + found.filename;
        $.get(query).then(function (json) {
          var polygons = parseInputMap(json);
          // console.error("error not yet implemented");
          g_datasets[found.key] = polygons;
          g_polygons = polygons;
          processNewDataset();
        });
      } else {
        var query = '/data/?value=' + found.key;
        $.get(query).then(function (json) {
          var polygons = parseInputJSON(json);
          g_datasets[found.key] = polygons;
          g_polygons = polygons;
          processNewDataset();
        });
      }
    } else {
      g_polygons = g_datasets[found.key]; // load the cached data
      processNewDataset();
    }
  } else {
    console.error("Unable to find dataset...");
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
            if (newY < curY - 0.000001 || Math.abs(newY - curY) < g_eventThresh) {
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
      newEvents.forEach(function (ev) {
        var newY = getEventY(ev);
        var curY = getEventY(event);
        if (newY < curY - 0.000001 || Math.abs(newY - curY) < g_eventThresh) {
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
  drawCloseEvents(closeEventPoints);
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
