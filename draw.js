let g_zoomed = false;

let g_siteRadius = 3;
let g_isoEdgeWidth = 1;

// dijkstra's controls
let g_pathStartElemIdx = undefined;
var g_gvdVertices = [];

// start, end, default
let g_edgeColors = [ 'darkkhaki', 'limegreen', 'red', 'black'];

const ZOOM_EXTENT = 200000;

let margin = {top: 50, right: 50, bottom: 50, left: 50},
    width = 1000 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;

let svg;
let xAxis;
let yAxis;

let xRev = d3.scaleLinear()
    .domain([-1.1, 1.1])
    .range([0, width]);

let xRevOrigin = d3.scaleLinear()
    .domain([-1.1, 1.1])
    .range([0, width]);

let yRev = d3.scaleLinear()
    .domain([1.1, -1.1])
    .range([0, height]);

let yRevOrigin = d3.scaleLinear()
    .domain([1.1, -1.1])
    .range([0, height]);

let yToGVD = d3.scaleLinear()
    .domain([0, height])
    .range([1.1, -1.1]);

let xToGVD = d3.scaleLinear()
    .domain([0, width])
    .range([1.1, -1.1]);

let gvdToPixelXScale =  d3.scaleLinear()
.domain([-1, 1])
.range([0, width]);

let gvdToPixelYScale =  d3.scaleLinear()
.domain([1, -1])
.range([0, height]);

  // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
let zoom = d3.zoom()
  .scaleExtent([.5, ZOOM_EXTENT])
  .extent([[0, 0], [width, height]])
  .on("zoom", zoomed);


/////////////// Handler Functions /////////////////

function getEdgeId(d) {
  if (d.type === "general_parabola") {
    return `edge${d.id}`;
  }
  return `edge${d.a}-${d.b}`;
  // return `edge${d.siteA.id}-${d.siteB.id}`;
}

function getEdgeVertexId(i) {
  return `edge-vertex-${i}`;
}

function onEdgeVertexClick(d, i) {
  // Stop the event from propagating to the SVG
  d3.event.stopPropagation();

  if (g_pathStartElemIdx) {
    d3.select('#' + getEdgeVertexId(g_pathStartElemIdx))
      .style("fill", g_edgeColors[3]);
  }
  this.style["fill"] = g_edgeColors[1];
  g_pathStartElemIdx = i;
  var t0 = performance.now();
  // clear all path info
  _.each(g_gvdVertices, v => {
    _.each(_.values(v.connectedEdges), e =>{
      e.path = [];
      e.tCost = undefined;
    });
  });
  shortestPath(d);
  var t1 = performance.now();
  var processTime = t1 - t0;
  console.log("Path Processing Time:" + processTime.toFixed(6) + "(ms)");
}

function onEdgeVertexMouseOver(d, i) {
  d3.select(`#${this.id}`).attr("r", g_siteRadius * 3);
  if (_.isUndefined(g_pathStartElemIdx)) return;
  var edges = _.sortBy(_.values(d.connectedEdges), e => {
    return e.tCost;
  });

  if (i != g_pathStartElemIdx) {
    if (edges[0].path && edges[0].path.length > 0) {
      highlightPath(edges[0].path, g_edgeColors[3]);
    }
  }
}

function onEdgeVertexMouseOut(d, i) {
  d3.select(`#${this.id}`).attr("r", g_siteRadius);
  unHighlightPaths();
}

///////////////////////////////////////////////////

function resetView() {
  g_zoomed = false;
  d3.zoomIdentity.x = 0;
  d3.zoomIdentity.y = 0;
  d3.select('#mainView').call(zoom.transform, d3.zoomIdentity.scale(1));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startVideo() {
  // var scale = 1;
  // var toPoint = [478, 440];
  var toPoint = [468, 430];
  // var point = [0, 0];
  var totalExtent = 50;
  for (var k = 2; k < totalExtent; k += 0.2) {

    // var xWinVal = k/totalExtent * toPoint[0];
    // var yWinVal = k/totalExtent * toPoint[0];
    // var x = k * -xWinVal;
    // var y = k * -yWinVal;

    var x = k * -toPoint[0];
    var y = k * -toPoint[1];
    // console.log(`Scale: ${k}, x: ${x}, y:${y}`);
    d3.zoomIdentity.x = x;
    d3.zoomIdentity.y = y;
    d3.select('#mainView').transition().duration(50).call(zoom.transform, d3.zoomIdentity.scale(k));
    await sleep(50);
  }
}

function drawInit(sweepline, settings) {
  svg = d3.select('#mainView')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .style("pointer-events", "mousedown, dbclick, wheel.zoom")
  .call(zoom)
  .append("g")
  .attr("id", "gvd")
  .attr("transform", `translate(${margin.left} ,${margin.top})`)
  ;

  svg.selectAll("line")
    .data([sweepline])
    .enter()
    .append("line")
    .attr("id", "sweepline")
    .attr("x1", d => xRev(d.x1))
    .attr("y1", d => yRev(d.y))
    .attr("x2", d => xRev(d.x2))
    .attr("y2", d => yRev(d.y))
    .attr("vector-effect", "non-scaling-stroke")
    ;

  xAxis = svg.append('g')
    .attr("transform", `translate(${margin.left}, ${height})`)
    .call(d3.axisBottom(xRev));

  yAxis = svg.append('g')
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yRev));

  // Add a clipPath: everything out of this area won't be drawn.
  svg.append("defs").append("svg:clipPath")
  .attr("id", "clip")
  .append("svg:rect")
  .attr("width", width - (margin.left + margin.right))
  // .attr("width", width + margin.left + margin.right)
  .attr("height", height + 20)
  // .attr("height", height + margin.top + margin.bottom)
  .attr("x", 0)
  .attr("y", 0);

  svg.attr("clip-path", "url(#clip)");

  // add settings
  var settings = _.map(g_settings, function (val, key) {
    return {key: key, label:val.label, value: val.value};
  })
  d3.select("#gvd-settings")
    .selectAll("label").data(settings)
    .enter()
    .append("label")
    .html(d => {
      if (d.value) {
        return `<input type="checkbox" checked data-toggle="toggle" value="${d.key}"
                onclick="onSettingChecked(this)" /> ${d.label}`;
      }
      return `<input type="checkbox" data-toggle="toggle" value="${d.key}"
              onclick="onSettingChecked(this)" /> ${d.label}`;
    })
    ;

  initDebugCircumcircle();
}

function enforceSettings() {
  // show events
  d3.selectAll(".close-event")
  .attr('visibility', g_settings.showEvents.value ? null : 'hidden');

  // debugging only
  // d3.selectAll(".debug-events")
  // .style('height', g_settings.showEvents.value ? 100 : 0)
  // .style('visibility', g_settings.showEvents.value ? null : 'hidden');
  // d3.selectAll(".debug-inputs")
  // .style('height', g_settings.showDebugObjs.value ? 100 : 0)
  // .style('visibility', g_settings.showDebugObjs.value ? null : 'hidden');

  // show gvd vertices
  d3.select("#gvd")
  .selectAll(".gvd-edge-vertex")
  .attr('r', g_settings.showGVDVer.value ? g_siteRadius : 0);

  // Show gvd segments/parabolas
  d3.select('#gvd')
  .selectAll('.gvd-surface-parabola')
  .style("stroke-width", g_settings.showGVDSeg.value ? g_isoEdgeWidth * 4 : 0)
  ;

  d3.select('#gvd')
  .selectAll('.gvd-surface')
  .style("stroke-width", g_settings.showGVDSeg.value ? g_isoEdgeWidth * 4 : 0)
  ;

  // show sites
  d3.select("#gvd")
  .selectAll(".point-site")
  .attr('r', g_settings.showObjVer.value ? g_siteRadius : 0);
  ;

  // show site segments
  d3.select("#gvd")
  .selectAll(".segment-site")
  .style('stroke-width', g_settings.showObjSeg.value ? g_isoEdgeWidth : 0)
  ;

  // Medial Axis
  d3.selectAll(".gvd-iso-surface")
  .style("stroke-width", g_settings.showMedial.value ? g_isoEdgeWidth : 0)
  ;

  d3.selectAll(".gvd-iso-surface-parabola")
  .style("stroke-width", g_settings.showMedial.value ? g_isoEdgeWidth : 0)
  ;

  d3.selectAll(".gvd-surface-active-parabola")
  .style("stroke-width", g_settings.showMedial.value ? g_isoEdgeWidth : 0)
  ;

  d3.selectAll(".gvd-surface-active")
  .style("stroke-width", g_settings.showMedial.value ? g_isoEdgeWidth : 0)
  ;

  // debugging only Show debug
  // d3.selectAll(".debug-line")
  // .attr('visibility', g_settings.showDebugObjs.value ? null : 'hidden');
  // d3.selectAll(".debug-parabola")
  // .attr('visibility', g_settings.showDebugObjs.value ? null : 'hidden');
  // d3.selectAll(".debug-point")
  // .attr('visibility', g_settings.showDebugObjs.value ? null : 'hidden');

  // Tree
  d3.select(g_treeId)
  // .attr('visibility', g_settings.showTree.value ? null : 'hidden');
  .attr('width', g_settings.showTree.value ? widthT : 0)
  .attr('height', g_settings.showTree.value ? heightT : 0);

  // beach line
  d3.select("#gvd")
  .selectAll(".beach-parabola")
  .style("stroke-width",  g_settings.showBeachLine.value ? g_isoEdgeWidth : 0);
  ;

  d3.select("#gvd")
  .selectAll(".beach-v")
  .style("stroke-width", g_settings.showBeachLine.value ? g_isoEdgeWidth : 0);
  ;
}

function onSettingChecked(event) {
  g_settings[event.value].value = event.checked;
  rescaleView(xRev, yRev);
  enforceSettings();
}

function clearSurface() {
  d3.select("#gvd")
  .selectAll(".gvd-surface-active-parabola")
  .remove()
  ;

  d3.select("#gvd").selectAll(".gvd-surface-active")
  .remove()
  ;

  d3.select('#gvd')
  .selectAll('.gvd-surface-parabola')
  .remove()
  ;

  d3.select('#gvd')
  .selectAll('.gvd-iso-surface-parabola')
  .remove()
  ;

  d3.select('#gvd')
  .selectAll('.gvd-surface')
  .remove()
  ;

  d3.select('#gvd')
  .selectAll('.gvd-iso-surface')
  .remove()
  ;
}

function initDebugCircumcircle() {
  // Draw the close event highlight circle
  d3.select("#gvd").append("circle")
    .attr("cx", xRev(0))
    .attr("cy", yRev(0))
    .attr("r", 0)
    .attr("class", "debug-circumcircle")
    .style("stroke-width", g_isoEdgeWidth)
    .attr("vector-effect", "non-scaling-stroke")
  ;
}

function showDebugCircumcircle(cx, cy, r) {
  let rScale = d3.scaleLinear()
    .domain([0, 2.2])
    .range([0, width]);

  d3.selectAll(".debug-circumcircle")
    .attr("cx", xRev(cx))
    .attr("cy", yRev(cy))
    .attr("r", rScale(r))
    .attr("opacity", 1)
    .style("stroke-width", g_isoEdgeWidth)
  ;
}

function hideDebugCircumcircle() {
  d3.select(".debug-circumcircle")
    .attr("opacity", 0)
  ;
}

// var dragSite = d3.drag()
// .on("drag", function(d, i) {
//   this.x = this.x || 0;
//   this.y = this.y || 0;
//   this.x += d3.event.dx;
//   this.y += d3.event.dy;
//   d.x += d3.event.dx;
//   d.y += d3.event.dy;
//   // console.log("X:" + d.x + " Y:" + d.y);
//   d3.select(this).attr("transform", "translate(" + this.x + "," + this.y + ")");
// })
// .on("end", function() { onSiteDrag(); });

// debugging only
// function drawDebugObjs(objs) {

//   // Lines
//   var lines = _.filter(objs, function (o) {
//     return o instanceof Line;
//   });
//   let selB = d3.select("#gvd")
//   .selectAll(".debug-line")
//   .data(lines);

//   selB.exit().remove();
//   selB
//     .enter()
//     .append("line")
//     .attr("class", "debug-line")
//     .attr("vector-effect", "non-scaling-stroke")
//     .merge(selB)
//     .attr("x1", l => xRev(l.p1[0]))
//     .attr("y1", l => yRev(l.p1[1]))
//     .attr("x2", l => xRev(l.p2[0]))
//     .attr("y2", l => yRev(l.p2[1]))
//     .attr('visibility', g_settings.showDebugObjs.value ? null : 'hidden')
//   ;

//   // parabolas
//   var parabolas = _.filter(objs, function (o) {
//     return !_.isUndefined(o.para);
//   });

//   var idStr = "pId";
//   var originPt = {point:vec3(-1, 1, 0)};
//   var destPt = {point:vec3(1, 0, 0)};
//   var count = 0;
//   parabolas = _.map(parabolas, function (p) {
//     idStr = idStr + count++;
//     p.para.prepDraw(idStr, originPt, destPt);
//     return p.para;
//   });

//   let line = d3.line()
//   .x(function (d) {return xRev(d[0]);})
//   .y(function (d) {return yRev(d[1]);})
//   .curve(d3.curveLinear)
//   ;
//   let debugSelectionPara = d3.select('#gvd')
//     .selectAll('.debug-parabola')
//     .data(parabolas)
//   ;
//   debugSelectionPara.exit().remove();
//   debugSelectionPara.enter()
//     .append("path")
//     .style("fill","none")
//     .attr("class", "debug-parabola")
//     .attr("vector-effect", "non-scaling-stroke")
//     .merge(debugSelectionPara)
//     .style("stroke-width", g_isoEdgeWidth * 5)
//     .attr("d", p => line(p.drawPoints))
//     .attr("transform", p => p.transform)
//     .attr('visibility', g_settings.showDebugObjs.value ? null : 'hidden')
//   ;

//   // debug points
//   var pts = _.filter(objs, function (o) {
//     return o.type && o.type === "vec";
//   });
//   let ptsSelection = d3.select('#gvd')
//   .selectAll('.debug-point')
//   .data(pts)
//   ;
//   ptsSelection.exit().remove();

//   ptsSelection.enter()
//     .append("circle")
//     .attr("class", "debug-point")
//     .attr("r", g_siteRadius * 2)
//     .merge(ptsSelection)
//     .attr("cx", p => xRev(p[0]))
//     .attr("cy", p => yRev(p[1]))
//   ;
// }

function drawSites(points) {
  d3.select("#gvd").selectAll(".point-site").remove();

  d3.select("#gvd")
    .selectAll(".point-site")
    .data(points)
    .enter()
    .append("circle")
    .attr("class", "site point-site")
    // .call(dragSite)
    .attr("r", g_siteRadius)
    .attr("cx", p => xRev(p[0]))
    .attr("cy", p => yRev(p[1]))
    .attr("fill", (d,i) => siteColorSvg(d.label))
    .attr("id", d => `site${d.id}`)
    .attr("href", "#gvd")
    .append("title").html(d => d.id + " p(" + d[0] + ", " + d[1] + ")" + " file:" + d.fileId)
    // .append("title").html(d => d.id + " r: " + d.relation + " p(" + d[0] + ", " + d[1] + ")" + " file:" + d.fileId)
  ;
}

function drawSegments(segments) {
  {
    let sel = d3.select("#gvd")
      .selectAll(".segment-site")
      .data(segments);

    sel.exit().remove();
    sel
      .enter()
      .append("line")
      .attr("class", "site segment-site")
      .attr("vector-effect", "non-scaling-stroke")
      .merge(sel)
      .style("stroke-width", g_isoEdgeWidth)
      .attr("x1", s => xRev(s[0][0]))
      .attr("y1", s => yRev(s[0][1]))
      .attr("x2", s => xRev(s[1][0]))
      .attr("y2", s => yRev(s[1][1]))
      .attr("stroke", (d) => {
        return siteColorSvg(d.label);
        // if (!d.color) return siteColorSvg(d.label);
        // return d.color;
      })
    ;
  }
}

function drawSweepline(sweepline) {
  d3.select("#sweepline").data([sweepline])
    .attr("x1", d => xRev(d.x1))
    .attr("y1", d => yRev(d.y))
    .attr("x2", d => xRev(d.x2))
    .attr("y2", d => yRev(d.y))
    .attr("vector-effect", "non-scaling-stroke")
    ;
}

function getSurfaceClass(onGvd) {
  return onGvd ? "gvd-surface" : "gvd-iso-surface";
}

function getSurfaceParabolaClass(onGvd) {
  return onGvd ? "gvd-surface-parabola" : "gvd-iso-surface-parabola";
}

function getSurfaceWidth(bold) {
  return bold ? g_isoEdgeWidth * 4 : g_isoEdgeWidth;
}

function drawSurface(dcel) {
    // Render surface with D3
  let iter = dcel.edges;
  let result = iter.next();
  let edges = [];
  let generalEdges = [];
  while (!result.done) {
    var edge = result.value;
    if (edge.origin.point && edge.dest.point) {
      if (edge.generalEdge) {
        var point;
        var segment;
        if (edge.siteA.type == "segment" && edge.siteB.type == "vec") {
          segment = edge.siteA;
          point = edge.siteB;
        } else if (edge.siteA.type == "vec" && edge.siteB.type == "segment") {
          point = edge.siteA;
          segment = edge.siteB;
        } else {
          throw "Error edge node marked as general surface but is not between a V and parabola";
        }
        var gp = createGeneralParabola(point, segment);
        var idStr = edge.a.toString() + "-" + edge.b.toString();
        gp.prepDraw(idStr, edge.origin, edge.dest);
        generalEdges.push(gp);
      } else {
        edges.push(edge);
      }
    }
    result = iter.next();
  }

  g_pathStartElemIdx = undefined;

  let line = d3.line()
  .x(function (d) {return xRev(d[0]);})
  .y(function (d) {return yRev(d[1]);})
  .curve(d3.curveLinear);
  let d3generalEdges = d3.select('#gvd')
    .selectAll('.gvd-surface-parabola')
    .data(generalEdges);
  d3generalEdges.exit().remove();
  d3generalEdges.enter()
    .append("path")
    .style("fill","none")
    .attr("class", e => getSurfaceParabolaClass(e.splitSite))
    .attr("vector-effect", "non-scaling-stroke")
    .attr("id", d => getEdgeId(d))
    .merge(d3generalEdges)
    .style("stroke-width", e => getSurfaceWidth(e.splitSite))
    .attr("d", p => line(p.drawPoints))
    .attr("transform", p => p.transform)
  ;

  let d3edges = d3.select('#gvd')
    .selectAll('.gvd-surface')
    .data(edges);
  d3edges.exit().remove();
  d3edges.enter()
    .append('line')
    .attr('class', e => getSurfaceClass(e.splitSite))
    .attr("vector-effect", "non-scaling-stroke")
    .attr("id", d => getEdgeId(d))
    .merge(d3edges)
    .attr('x1', e => xRev(e.origin.point[0]))
    .attr('y1', e => yRev(e.origin.point[1]))
    .attr('x2', e => xRev(e.dest.point[0]))
    .attr('y2', e => yRev(e.dest.point[1]))
    .style("stroke-width", e => getSurfaceWidth(e.splitSite))
  ;

  d3.select('#gvd').selectAll(".gvd-edge-vertex").remove();

  g_gvdVertices = [];
  var vertexItr = dcel.vertices;
  var vecRslt = vertexItr.next();
  while (!vecRslt.done) {
    if (vecRslt.value.point && vecRslt.value.edge.splitSite)
    g_gvdVertices.push(vecRslt.value);
    vecRslt = vertexItr.next();
  }

  let edgeVertices = d3.select('#gvd')
    .selectAll(".gvd-edge-vertex")
    .data(g_gvdVertices);
  edgeVertices.enter()
    .append("circle")
    .attr("class", "gvd-edge-vertex")
    .attr("id", (d,i) => `edge-vertex-${i}`)
    .attr("cx", d => xRev(d.point[0]))
    .attr("cy", d => yRev(d.point[1]))
    .attr("r", g_siteRadius)
    .on("click", onEdgeVertexClick)
    .on("mouseover", onEdgeVertexMouseOver)
    .on("mouseout", onEdgeVertexMouseOut)
    ;
}

function drawCloseEvents(eventPoints) {
  eventPoints = eventPoints.filter(d => d.live);

  let highlight = function(event) {
    let arcNode = event.arcNode;

    // Highlight the arc
    let arcElement = d3.select(`#treenode${arcNode.id}`);
    arcElement.style("stroke-width", g_isoEdgeWidth * 5);

    showDebugCircumcircle(event.point[0], event.point[1], event.r);
  };

  let unhighlight = function(event) {
    let arcNode = event.arcNode;

    // Unhighlight the arc
    let arcElement = d3.select(`#treenode${arcNode.id}`);
    arcElement.style("stroke-width", g_isoEdgeWidth);

    // Unhighlight the sites
    // d3.select(`#site${arcNode.site.id}`).attr("r", SITE_RADIUS);
    hideDebugCircumcircle();
  };

  let selection = d3.select("#gvd").selectAll(".close-event")
    .data(eventPoints);
  // exit
  selection.exit().remove();
  // enter
  selection.enter()
    .append("circle")
    .attr('class', "close-event")
    .attr("vector-effect", "non-scaling-stroke")
    .on('mouseover', highlight)
    .on('mouseout', unhighlight)
    .merge(selection)
    .attr('r', g_siteRadius)
    .attr('cx', d => xRev(d.point[0]))
    .attr('cy', d => yRev(d.point[1]))
    .attr('visibility', g_settings.showEvents.value ? null : 'hidden')
  ;
}

function drawBeachline(beachline, directrix) {
  if (beachline.root == null) {
    d3.select("#gvd").selectAll(".beach-parabola").remove();
    return;
  }

  let arcElements = [];
  // These lines are GVD lines going to infinity that may or may not
  // eventually be subsumed into the DCEL.
  let lines = [];
  var generalSurfaces = [];
  let events = [];
  beachline.prepDraw(directrix, beachline.root, -10000, 10000, arcElements, lines, generalSurfaces, events);

  let parabolas = arcElements.filter(d => d.type == "parabola");
  let vs = arcElements.filter(d => d.type == "v");

  //------------------------------
  // Render the parabolas
  //------------------------------
  {
    let line = d3.line()
      .x(function (d) {return xRev(d[0]);})
      .y(function (d) {return yRev(d[1]);})
      .curve(d3.curveLinear)
    ;
    let selection = d3.select("#gvd").selectAll(".beach-parabola")
      .data(parabolas);
    // exit
    selection.exit().remove();
    // enter
    selection.enter()
      .append("path")
      .style("fill","none")
      .attr("class", "beach-parabola")
      .attr("vector-effect", "non-scaling-stroke")
      .merge(selection)
      .attr("d", p => line(p.drawPoints))
      .style("stroke", p => siteColorSvg(p.label))
      .attr("id", p => `treenode${p.nodeid}`)
      .attr("leftx", p => xRev(p.drawPoints[0][0]))
      .attr("rightx", p => xRev(p.drawPoints[p.drawPoints.length-1][0]))
      .attr("transform", p => p.transform)
      .style("stroke-width", g_isoEdgeWidth)
    ;
  }

  //------------------------------
  // Render the Vs
  //------------------------------
  {
    let line = d3.line()
      .x(function (d) {return xRev(d[0]);})
      .y(function (d) {return yRev(d[1]);})
      .curve(d3.curveLinear)
    ;
    let selection = d3.select("#gvd").selectAll(".beach-v")
      .data(vs);

    // exit
    selection.exit().remove();
    // enter
    selection.enter()
      .append("path")
      .style("fill","none")
      .attr("class", "beach-parabola")
      .attr("vector-effect", "non-scaling-stroke")
      .merge(selection)
      .attr("d", p => line(p.drawPoints))
      .style("stroke", p => siteColorSvg(p.label))
      .attr("id", p => `treenode${p.nodeid}`)
      .attr("leftx", p => xRev(p.drawPoints[0][0]))
      .attr("rightx", p => xRev(p.drawPoints[p.drawPoints.length-1][0]))
      .style("stroke-width", g_isoEdgeWidth);
    ;
  }

  //------------------------------
  // Render the active surface
  //------------------------------
  {
    let line = d3.line()
    .x(function (d) {return xRev(d[0]);})
    .y(function (d) {return yRev(d[1]);})
    .curve(d3.curveLinear)
    ;
    let selection = d3.select("#gvd").selectAll(".gvd-surface-active-parabola")
    .data(generalSurfaces);
    // exit
    selection.exit().remove();
    // enter
    selection.enter()
      .append("path")
      .style("fill","none")
      .attr("class", "gvd-surface-active-parabola")
      .attr("vector-effect", "non-scaling-stroke")
      .merge(selection)
      .attr("d", p => line(p.drawPoints))
      // .attr("id", p => p.id)
      .attr("id", p => `treenode${p.id}`)
      .attr("transform", p => p.transform)
      .style("stroke-width", g_isoEdgeWidth);

    let lineSelection = d3.select("#gvd").selectAll(".gvd-surface-active")
      .data(lines);
    // exit
    lineSelection.exit().remove();
    // enter
    let enter = lineSelection.enter()
      .append("line")
      .attr('class', "gvd-surface-active")
      .attr("vector-effect", "non-scaling-stroke")
      .merge(lineSelection)
      .attr('x1', d => xRev(d.x0))
      .attr('y1', d => yRev(d.y0))
      .attr('x2', d => xRev(d.x1))
      .attr('y2', d => yRev(d.y1))
      .attr("id", p => `treenode${p.id}`)
      .style("stroke-width", g_isoEdgeWidth);
    ;
  }
  //------------------------------
  // Render the debug objects
  //------------------------------
  // debugging only
  // drawDebugObjs(g_debugObjs);
}

function rescaleView(newX, newY) {
  // update axes with these new boundaries
  xAxis.call(d3.axisBottom(newX));
  yAxis.call(d3.axisLeft(newY));

  let line = d3.line()
  .x(function (d) {return newX(d[0]);})
  .y(function (d) {return newY(d[1]);})
  .curve(d3.curveLinear)
  ;

  if (g_settings.showObjVer.value) {
    // update point sites
    d3.select("#gvd")
    .selectAll(".point-site")
    .attr('cx', d => newX(d[0]))
    .attr('cy', d => newY(d[1]))
    ;
  }

  if (g_settings.showGVDVer.value) {
    d3.select("#gvd")
    .selectAll(".gvd-edge-vertex")
    .attr('cx', d => newX(d.point[0]))
    .attr('cy', d => newY(d.point[1]))
    ;
  }

  if (g_settings.showObjSeg.value) {
    d3.select("#gvd")
    .selectAll(".segment-site")
    .attr("x1", s => newX(s[0][0]))
    .attr("y1", s => newY(s[0][1]))
    .attr("x2", s => newX(s[1][0]))
    .attr("y2", s => newY(s[1][1]))
    ;
  }

  // update beachline
  if (g_settings.showBeachLine.value) {
    d3.select("#gvd")
    .selectAll(".beach-parabola")
    .attr("d", p => line(p.drawPoints))
    .attr("leftx", p => newX(p.drawPoints[0][0]))
    .attr("rightx", p => newX(p.drawPoints[p.drawPoints.length-1][0]))
    ;

    d3.select("#gvd")
    .selectAll(".beach-v")
    .attr("d", p => line(p.drawPoints))
    .attr("leftx", p => newX(p.drawPoints[0][0]))
    .attr("rightx", p => newX(p.drawPoints[p.drawPoints.length-1][0]))
    ;
  }

  d3.select("#sweepline")
    .attr("x1", d => newX(d.x1))
    .attr("y1", d => newY(d.y))
    .attr("x2", d => newX(d.x2))
    .attr("y2", d => newY(d.y))
    ;

  // debug
  if (g_settings.showEvents.value) {
    d3.select("#gvd")
    .selectAll(".close-event")
    .attr('cx', d => newX(d.point[0]))
    .attr('cy', d => newY(d.point[1]))
    ;
  }

  if (g_settings.showEvents.value) {
    // d3.select('#gvd')
    // .selectAll('.debug-line')
    // .attr('x1', e => newX(e.origin.point[0]))
    // .attr('y1', e => newY(e.origin.point[1]))
    // .attr('x2', e => newX(e.dest.point[0]))
    // .attr('y2', e => newY(e.dest.point[1]))
    // ;

    d3.select('#gvd')
    .selectAll('.debug-parabola')
    .attr("d", p => line(p.drawPoints));
  }

  if (g_settings.showGVDSeg.value) {
    // update Edges
    d3.select('#gvd')
    .selectAll('.gvd-surface-parabola')
    .attr("d", p => line(p.drawPoints))
    .style("stroke-width", g_isoEdgeWidth * 4)
    ;

    d3.select('#gvd')
    .selectAll('.gvd-surface')
    .attr('x1', e => newX(e.origin.point[0]))
    .attr('y1', e => newY(e.origin.point[1]))
    .attr('x2', e => newX(e.dest.point[0]))
    .attr('y2', e => newY(e.dest.point[1]))
    .style("stroke-width", g_isoEdgeWidth * 4)
    ;
  }

  if (g_settings.showMedial.value) {
    d3.selectAll(".gvd-iso-surface")
    .attr('x1', e => newX(e.origin.point[0]))
    .attr('y1', e => newY(e.origin.point[1]))
    .attr('x2', e => newX(e.dest.point[0]))
    .attr('y2', e => newY(e.dest.point[1]))
    ;
    d3.selectAll('.gvd-iso-surface-parabola')
    .attr("d", p => line(p.drawPoints))
    ;
    d3.select("#gvd")
    .selectAll(".gvd-surface-active-parabola")
    .attr("d", p => line(p.drawPoints))
    .style("stroke-width", e => getSurfaceWidth(e.splitSite))
    ;

    d3.select("#gvd").selectAll(".gvd-surface-active")
    .attr('x1', d => newX(d.x0))
    .attr('y1', d => newY(d.y0))
    .attr('x2', d => newX(d.x1))
    .attr('y2', d => newY(d.y1))
    .style("stroke-width", e => getSurfaceWidth(e.splitSite))
    ;
  }

  xRev = newX;
  yRev = newY;
}

function zoomed() {
  g_zoomed = true;

  // console.log(`Zoom scale: ${d3.event.transform.k}, x: ${d3.event.transform.x}, y:${d3.event.transform.y}`);

  // recover the new scale
  var newX = d3.event.transform.rescaleX(xRevOrigin);
  var newY = d3.event.transform.rescaleY(yRevOrigin);

  rescaleView(newX, newY);
}
