'use strict';

// A place for utility functions

function siteColorSvg(id) {
  // return 'black';
  return d3.schemeCategory10[id % 10];
}

function arcColorSvg(id) {
  // return d3.schemeCategory20[id%20];
  return d3.schemeCategory10[id % 10];
}

function sanitizePointSiteData(polygons) {
  var points = [];
  _.forEach(polygons, function(poly) {
    points = points.concat(poly.points);
  });

  var sp = _.sortBy(points, function(p) { return p[1]; });
  for (var i = 1; i < sp.length; i++) {
    if (sp[i][0] === sp[i-1][0] && sp[i][1] === sp[i-1][1]) {
      console.log("applying offset to overlapping point");
      // offset the data point of i
      // WATCH VALUE
      sp[i][1] -= 0.00001;
    }
  }
}

function processNewDataset() {
  var t0 = performance.now();
  var segments = [];
  var points = [];
  g_polygons.forEach(function(poly) {
    markSiteRelations(poly.segments);
    segments = segments.concat(poly.segments);
    points = points.concat(poly.points);
  });

  sanitizePointSiteData(g_polygons);

  // debug only
  initDebugCircumcircle();
  drawSites(points);
  drawSegments(segments);

  var t1 = performance.now();
  var processTime = t1 - t0;
  console.log("Pre-process time:" + processTime.toFixed(6) + "(ms)");

  render();
}

function x2win(x) {
  let xmin = -1;
  let xmax = 1;
  return (x - xmin) / (xmax - xmin) * width;
}

function win2x(xWin) {
  var half = width / 2;
  var dist = xWin - half;
  return dist / half;
}

function y2win(y) {
  let ymin = -1;
  let ymax = 1;
  return (1 - (y - ymin) / (ymax - ymin)) * height;
}

function win2y(yWin) {
  var half = height / 2;
  var dist = half - yWin;
  return dist / half;
}

function sortedInsertion(queue, newEvent) {
  var idx = _.sortedIndexBy(queue, newEvent, function(event) { return getEventY(event); });

  // insert the new event in order or on top
  if (idx === -1) {
    queue.push(newEvent);
  } else {
    queue.splice(idx, 0, newEvent);
  }
}

// Create the queue for the current dataset
function createDataQueue(reorder) {
  if (!reorder) {
    if (g_queue[localStorage.g_dataset])
      return [...g_queue[localStorage.g_dataset]];
  }
  var rslt = [];
  var points = [];
  g_polygons.forEach(function(poly) {
    points = points.concat(poly.points);
  });
  var sortedPoints = _.sortBy(points, function(p) { return p[1]; });

  _.forEach(sortedPoints, function(p) {
    var poly = getPolygonByLabel(p.label);
    var segs = _.filter(poly.segments, function(s) {
      return s.a[0] === p[0] && s.a[1] === p[1];
    });

    if (!_.isEmpty(segs)) {
      if (segs.length === 2) {
        if (isRightOfLine(segs[0].a, segs[0].b, segs[1].b)) {
          rslt.push(segs[0]);
          rslt.push(segs[1]);
        } else {
          rslt.push(segs[1]);
          rslt.push(segs[0]);
        }
      } else {
        rslt.push(segs[0]);
      }
    }
    rslt.push(p);
  });

  // create a clone of the result to access again
  g_queue[localStorage.g_dataset] = [...rslt];
  return rslt;
}

function getEventPacket(event, queue) {
  // The queue can only hold at most 2 descendants
  if (queue.length < 2) return {site: event, type: PACKET_TYPE.CHILD};
  var n = queue[queue.length - 1];
  var nn = queue[queue.length - 2];
  // var packet = {};
  if (nn.type === 'segment' && n.type === 'segment') {
    return {
      site: event,
      rightChild: queue.pop(),
      leftChild: queue.pop(),
      type: PACKET_TYPE.MULTI_CHILD_PARENT
    };
  } else if (n.type === 'segment') {
    return {site: event, child: queue.pop(), type: PACKET_TYPE.PARENT};
  }

  return {site: event, type: PACKET_TYPE.CHILD};
}

function onSiteDrag() {
  var segments = [];
  g_polygons.forEach(function(poly) {
    segments = segments.concat(poly.segments);
  });
  drawSegments(segments);
  // the drag could have changed the queue order
  render(true);
}

/// Code For Debugging the GVD
function mouseclick(e) {
  document.getElementById('mouseX').innerHTML = win2x(e.offsetX);
  document.getElementById('mouseY').innerHTML = win2y(e.offsetY);
}

function toggleFS() {
  g_fullScreen = !g_fullScreen;

  if (g_fullScreen) {
    d3.select('#tree').attr('width', 0).attr('height', 0);
    d3.select('#treeDebug').attr('width', widthT).attr('height', heightT);

    var w = window.innerWidth - margin.left - margin.right;
    var h = window.innerHeight - margin.top - margin.bottom;

    d3.select('#gvdsvg').attr('width', w).attr('height', h);

    var h2 = window.innerHeight / 2;
    var w2 = window.innerWidth / 2;
    d3.select('#gvd').attr(
        'transform', 'translate(' + w2 + ',' + h2 + ') scale(' + width / 4.0 +
            ',' + -1 * height / 4.0 + ')');
    document.getElementById('mainView').className = 'fullscreen';
  } else {
    d3.select('#tree').attr('width', widthT).attr('height', heightT);
    d3.select('#treeDebug').attr('width', 0).attr('height', 0);

    d3.select('#gvdsvg').attr('width', width).attr('height', height);

    d3.select('#gvd').attr(
        'transform', 'translate(' + width / 2.0 + ',' + height / 2.0 +
            ') scale(' + width / 2.0 + ',' + -1 * height / 2.0 + ')');
    document.getElementById('mainView').className = 'column';
  }
}

function setDebug(msg) {
  var id = g_fullScreen ? "tree-debug1" : "tree-debug2";
  document.getElementById(id).innerHTML = msg;
}
