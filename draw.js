var g_zoomScale = 1;

let g_siteRadius = 0.01;
var g_isoEdgeWidth = 1;

var margin = {top: -5, right: -5, bottom: -5, left: -5},
    width = 700 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var svg;
var zoomCatcher;

var x = d3.scaleLinear()
    .domain([0, width])
    .range([0, width]);

var y = d3.scaleLinear()
    .domain([0, height])
    .range([0, height]);

var xAxis = d3.axisBottom(x)
    .tickSize(height)
    .tickPadding(8 - height);

var yAxis = d3.axisRight(y)
    .ticks(4)
    .tickSize(width)
    .tickPadding(8 - width);

let zoom = d3.zoom()
    .extent([[100000, 100000], [width, height]])
    .scaleExtent([1, 100000])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", zoomed);

function drawInit()
{
  zoomCatcher = d3.select("#mainView")
  .append("rect")
  .attr("class", "zoomCatcher")
  .attr("x", margin.left)
  .attr("y", margin.top)
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "transparent")
  .attr("stroke", "none")
  .call(zoom);
  svg = zoomCatcher
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("id", "gvdsvg")
  .attr("xmlns", "http://www.w3.org/2000/svg");

  svg.append("g")
    .attr("id", "gvd")
    .attr("transform", "translate(" + width/2.0
      + "," + height/2.0 + ") scale(" + width/2.0 + "," + -1*height/2.0 + ")")
    .append("line")
    .attr("id", "sweepline")
    .attr("x1", -1)
    .attr("y1", 0)
    .attr("x2", 1)
    .attr("y2", 0)
    .attr("vector-effect", "non-scaling-stroke");
}

function initDebugCircumcircle() {
  // Draw the close event highlight circle
  d3.select("#gvd").append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 0)
    .attr("id", "debug-circumcircle")
    .attr("stroke-width", g_isoEdgeWidth)
    .attr("vector-effect", "non-scaling-stroke")
  ;
}

function showDebugCircumcircle(cx, cy, r) {
  d3.select("#debug-circumcircle")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", r)
    .attr("opacity", 1)
    .attr("stroke-width", g_isoEdgeWidth)
  ;
}

function hideDebugCircumcircle() {
  d3.select("#debug-circumcircle")
    .attr("opacity", 0)
  ;
}

var dragSite = d3.drag()
.on("drag", function(d, i) {
  this.x = this.x || 0;
  this.y = this.y || 0;
  this.x += d3.event.dx;
  this.y += d3.event.dy;
  d.x += d3.event.dx;
  d.y += d3.event.dy;
  // console.log("X:" + d.x + " Y:" + d.y);
  d3.select(this).attr("transform", "translate(" + this.x + "," + this.y + ")");
})
.on("end", function() { onSiteDrag(); });

function drawDebugObjs(objs) {
  var parabolas = _.filter(objs, function (o) {
    return !_.isUndefined(o.para);
  });
  parabolas = _.map(parabolas, function (p) { return p.para; });

  var lines = _.filter(objs, function (o) {
    return o instanceof Line;
  });

  let selB = d3.select("#gvd")
  .selectAll(".debug-line")
  .data(lines);

  selB.exit().remove();
  selB
    .enter()
    .append("line")
    .attr("class", "debug-line")
    .attr("vector-effect", "non-scaling-stroke")
    .merge(selB)
    .attr("x1", l => l.p1.x)
    .attr("y1", l => l.p1.y)
    .attr("x2", l => l.p2.x)
    .attr("y2", l => l.p2.y)
    .attr('visibility', showDebugObjs ? null : 'hidden')
  ;

  let line = d3.line()
  .x(function (d) {return d.x;})
  .y(function (d) {return d.y;})
  .curve(d3.curveLinear)
  ;
  let d3generalEdges = d3.select('#gvd')
    .selectAll('.debug-parabola')
    .data(parabolas)
  ;
  d3generalEdges.exit().remove();
  d3generalEdges.enter()
    .append("path")
    .style("fill","none")
    .attr("class", "debug-parabola")
    .attr("vector-effect", "non-scaling-stroke")
    .merge(d3generalEdges)
    .style("stroke-width", g_isoEdgeWidth * 5)
    .attr("d", p => line(p.drawPoints))
    .attr("id", p => p.id)
    .attr("transform", p => p.transform)
    .attr('visibility', showDebugObjs ? null : 'hidden')
  ;
}

function drawSites(points) {
  {
    let sel = d3.select("#gvd")
      .selectAll(".point-site")
      .data(points);

    sel.exit().remove();
    let enter = sel.enter()
    .append("g")
    .append("circle")
    .attr("class", "site point-site")
    .merge(sel)
      .call(dragSite)
      .attr("r", g_siteRadius)
      .attr("cx", p => p.x)
      .attr("cy", p => p.y)
      .attr("fill", (d,i) => siteColorSvg(d.label))
      .attr("id", d => `site${d.id}`)
      .attr("href", "#gvd")
      .append("title").html(d => d.id + " r: " + d.relation)
    ;
  }
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
      .attr("x1", s => s[0].x)
      .attr("y1", s => s[0].y)
      .attr("x2", s => s[1].x)
      .attr("y2", s => s[1].y)
      .attr("stroke", (d,i) => siteColorSvg(d.label))
    ;
  }
}

function drawSweepline(sweepline) {
  d3.select("#sweepline")
    .attr("x1", -1)
    .attr("y1", sweepline)
    .attr("x2", 1)
    .attr("y2", sweepline)
    ;
}

function getSurfaceWidth(bold) {
  return bold ? g_isoEdgeWidth * 5 : g_isoEdgeWidth;
}

function drawSurface(dcel) {
    // Render surface with D3
  let iter = dcel.edges;
  let result = iter.next();
  let edges = [];
  let generalEdges = [];
  while (!result.done) {
    var edge = result.value;
    nanInOrigin = _.find(edge.origin.point, function (value) { return _.isNaN(value); });
    nanInDest = _.find(edge.dest.point, function (value) { return _.isNaN(value); });
    if (edge.origin.point && edge.dest.point && !_.isNaN(nanInOrigin) && !_.isNaN(nanInDest)) {
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
        // console.log("ID: " + idStr + " origin:" + edge.origin.point + " - dest:" + edge.dest.point);
        gp.prepDraw(idStr, edge.origin.point, edge.dest.point);
        generalEdges.push(gp);
      } else {
        edges.push(edge);
      }
    }
    result = iter.next();
  }

  let line = d3.line()
  .x(function (d) {return d.x;})
  .y(function (d) {return d.y;})
  .curve(d3.curveLinear)
  ;
  let d3generalEdges = d3.select('#gvd')
    .selectAll('.gvd-surface-parabola')
    .data(generalEdges)
  ;
  d3generalEdges.exit().remove();
  d3generalEdges.enter()
    .append("path")
    .style("fill","none")
    .attr("class", "gvd-surface-parabola")
    .attr("vector-effect", "non-scaling-stroke")
    .merge(d3generalEdges)
    .style("stroke-width", e => getSurfaceWidth(e.splitSite))
    .attr("d", p => line(p.drawPoints))
    .attr("id", p => p.id)
    .attr("transform", p => p.transform)
  ;

  let d3edges = d3.select('#gvd')
    .selectAll('.gvd-surface')
    .data(edges)
  ;
  d3edges.exit().remove();
  d3edges.enter()
    .append('line')
    .attr('class', "gvd-surface")
    .attr("vector-effect", "non-scaling-stroke")
    .merge(d3edges)
    .attr('x1', e => e.origin.point.x)
    .attr('y1', e => e.origin.point.y)
    .attr('x2', e => e.dest.point.x)
    .attr('y2', e => e.dest.point.y)
    .style("stroke-width", e => getSurfaceWidth(e.splitSite))
  ;
}

function drawCloseEvents(eventPoints) {
  eventPoints = eventPoints.filter(d => d.live);

  let highlight = function(event) {
    let arcNode = event.arcNode;

    // Highlight the arc
    let arcElement = d3.select(`#treenode${arcNode.id}`);
    arcElement.style("stroke-width", g_isoEdgeWidth * 5);

    showDebugCircumcircle(event.point.x, event.point.y, event.r);
  };

  let unhighlight = function(event) {
    // console.log(event);
    // console.log('unhighlight');
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
  let enter = selection.enter()
    .append("circle")
    .attr('class', "close-event")
    .attr("vector-effect", "non-scaling-stroke")
    .on('mouseover', highlight)
    .on('mouseout', unhighlight)
    .merge(selection)
    .attr('r', g_siteRadius)
    .attr('cx', d => d.point.x)
    .attr('cy', d => d.point.y)
    .attr('visibility', showEvents ? null : 'hidden')
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
      .x(function (d) {return d.x;})
      .y(function (d) {return d.y;})
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
      .attr("leftx", p => p.drawPoints[0].x)
      .attr("rightx", p => p.drawPoints[p.drawPoints.length-1].x)
      .attr("transform", p => p.transform)
      .style("stroke-width", g_isoEdgeWidth);
    ;
  }

  //------------------------------
  // Render the Vs
  //------------------------------
  {
    let line = d3.line()
      .x(function (d) {return d.x;})
      .y(function (d) {return d.y;})
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
      .attr("leftx", p => p.drawPoints[0].x)
      .attr("rightx", p => p.drawPoints[p.drawPoints.length-1].x)
      .style("stroke-width", g_isoEdgeWidth);
    ;
  }

  //------------------------------
  // Render the active surface
  //------------------------------
  {
    let line = d3.line()
    .x(function (d) {return d.x;})
    .y(function (d) {return d.y;})
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
      .attr("id", p => p.id)
      .attr("transform", p => p.transform)
      .style("stroke-width", g_isoEdgeWidth);
    ;

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
      .attr('x1', d => d.x0)
      .attr('y1', d => d.y0)
      .attr('x2', d => d.x1)
      .attr('y2', d => d.y1)
      .attr("id", p => `treenode${p.id}`)
      .style("stroke-width", g_isoEdgeWidth);
    ;
  }
  //------------------------------
  // Render the debug objects
  //------------------------------
  drawDebugObjs(g_debugObjs);
}

function zoomed() {
  g_zoomScale = d3.event.transform.k;
  g_siteRadius = 0.01 / g_zoomScale;
  g_isoEdgeWidth = 1 / g_zoomScale;
  // g_nonisoEdgeWidth = 5 / g_zoomScale;
  svg.attr("transform", "translate(" +  d3.event.transform.x + ","
  +  d3.event.transform.y + ") scale(" +  d3.event.transform.k + ")");

  // update point sites
  d3.select("#gvd")
  .selectAll(".point-site")
  .attr("r", g_siteRadius);

  d3.select("#gvd")
  .selectAll(".segment-site")
  .style("stroke-width", g_isoEdgeWidth);

  // update beachline
  d3.select("#gvd")
  .selectAll(".beach-parabola")
  .style("stroke-width", g_isoEdgeWidth);

  d3.select("#gvd")
  .selectAll(".beach-v")
  .style("stroke-width", g_isoEdgeWidth);

  d3.select("#gvd")
  .selectAll("#sweepline")
  .style("stroke-width", g_isoEdgeWidth);

  // debug
  d3.select("#gvd")
  .selectAll(".close-event")
  .attr("r", g_siteRadius);

  // d3.select('#gvd')
  // .selectAll('.debug-parabola')
  // .style("stroke-width", g_nonisoEdgeWidth);

  // update Edges
  d3.select("#gvd")
  .selectAll(".gvd-surface-active-parabola")
  .style("stroke-width", e => getSurfaceWidth(e.splitSite))

  d3.select("#gvd").selectAll(".gvd-surface-active")
  .style("stroke-width", e => getSurfaceWidth(e.splitSite))

  d3.select('#gvd')
  .selectAll('.gvd-surface-parabola')
  .style("stroke-width", e => getSurfaceWidth(e.splitSite))

  d3.select('#gvd')
  .selectAll('.gvd-surface')
  .style("stroke-width", e => getSurfaceWidth(e.splitSite))
}
