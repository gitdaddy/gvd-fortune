let isoEdgeWidth = 1;
let nonisoEdgeWidth = 5;

function initDebugCircumcircle() {
  // Draw the close event highlight circle
  d3.select("#gvd").append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 0)
    .attr("id", "debug-circumcircle")
    .attr("stroke-width", 1)
    .attr("vector-effect", "non-scaling-stroke")
  ;
}

function showDebugCircumcircle(cx, cy, r) {
  d3.select("#debug-circumcircle")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", r)
    .attr("opacity", 1)
  ;
}

function hideDebugCircumcircle() {
  d3.select("#debug-circumcircle")
    .attr("opacity", 0)
  ;
}

function drawSites(points, segments) {
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
      .attr("x1", s => s[0].x)
      .attr("y1", s => s[0].y)
      .attr("x2", s => s[1].x)
      .attr("y2", s => s[1].y)
      .attr("stroke", (d,i) => siteColorSvg(d.id))
    ;
  }

  {
    let sel = d3.select("#gvd")
      .selectAll(".point-site")
      .data(points);

    sel.exit().remove();
    let enter = sel.enter()
      .append("circle")
      .attr("r", SITE_RADIUS)
      .attr("class", "site point-site")
      .merge(sel)
      .attr("cx", p => p.x)
      .attr("cy", p => p.y)
      .attr("fill", (d,i) => siteColorSvg(d.label))
      .attr("id", d => `site${d.id}`)
      .append("title").html(d => d.id)
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
    return bold ? nonisoEdgeWidth : isoEdgeWidth;
  }

  function drawSurface(dcel) {
    // Render surface with D3
  let iter = dcel.edges;
  let result = iter.next();
  let count = 0;
  let edges = [];
  while (!result.done) {
    var edge = result.value;
    nanInOrigin = _.find(edge.origin.point, function (value) { return _.isNaN(value); });
    nanInDest = _.find(edge.dest.point, function (value) { return _.isNaN(value); });
    if (edge.origin.point && edge.dest.point && !_.isNaN(nanInOrigin) && !_.isNaN(nanInDest)) {
      edges.push(edge);
    }
    result = iter.next();
  }
  let d3edges = d3.select('#gvd')
    .selectAll('.gvd-surface')
    .data(edges)
  ;
  d3edges.exit().remove();
  let enter = d3edges.enter()
    .append('line')
    .attr('class', "gvd-surface")
    .attr("vector-effect", "non-scaling-stroke")
    .merge(d3edges)
    .attr('x1', e => e.origin.point[0])
    .attr('y1', e => e.origin.point[1])
    .attr('x2', e => e.dest.point[0])
    .attr('y2', e => e.dest.point[1])
    .style("stroke-width", e => getSurfaceWidth(e.splitSite))
  ;
}

function drawGeneralSurface(parabolas, line) {
  let selection = d3.select("#gvd").selectAll(".gvd-surface-parabola")
    .data(parabolas);
  // exit
  selection.exit().remove();
  // enter
  selection.enter()
    .append("path")
    .attr("d", p => line(p.drawPoints))
    .style("fill","none")
    .attr("class", "gvd-surface-parabola")
    .attr("vector-effect", "non-scaling-stroke")
    .merge(selection)
    .attr("transform", p => p.transform)
    .style("stroke-width", p => getSurfaceWidth(p.splitSite))
  ;
}

function drawCloseEvents(eventPoints) {
  eventPoints = eventPoints.filter(d => d.live);

  let highlight = function(event) {
    console.log(event);
    let arcNode = event.arcNode;

    // Highlight the arc
    let arcElement = d3.select(`#treenode${arcNode.id}`);
    arcElement.style("stroke-width", 5);

    // Highlight the sites
    // d3.select(`#site${arcNode.site.id}`).attr("r", SITE_RADIUS_HIGHLIGHT);
    showDebugCircumcircle(event.point.x, event.point.y, event.r);
  };

  let unhighlight = function(event) {
    // console.log(event);
    console.log('unhighlight');
    let arcNode = event.arcNode;

    // Unhighlight the arc
    let arcElement = d3.select(`#treenode${arcNode.id}`);
    arcElement.style("stroke-width", null);

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
    .attr('r', SITE_RADIUS)
    .attr('class', "close-event")
    .attr("vector-effect", "non-scaling-stroke")
    .on('mouseover', highlight)
    .on('mouseout', unhighlight)
    .merge(selection)
    .attr('cx', d => d.point.x)
    .attr('cy', d => d.point.y)
    .attr('visibility', showEvents ? null : 'hidden')
  ;
}

function drawBeachline(beachline, directrix, renderEvents) {
  if (beachline.root == null) {
    d3.select("#gvd").selectAll(".beach-parabola").remove();
    return;
  }

  let arcElements = [];
  // These lines are GVD lines going to infinity that may or may not
  // eventually be subsumed into the DCEL.
  let lines = [];
  let events = [];
  // beachline.prepDraw(directrix, beachline.root, -1, 1, arcElements, lines, events);
  beachline.prepDraw(directrix, beachline.root, -100000, 1, arcElements, lines, events);

  let parabolas = arcElements.filter(d => d.type == "parabola");
  let vs = arcElements.filter(d => d.type == "v");

  // //------------------------------
  // // Render the events
  // //------------------------------
  // if (renderEvents) {
  //   let selection = d3.select("#gvd").selectAll(".event")
  //     .data(events);
  //   // exit
  //   selection.exit().remove();
  //   // enter
  //   selection.enter()
  //     .append("circle")
  //     .attr('cx', d => d.x)
  //     .attr('cy', d => d.y)
  //     .attr('r', 6/gvdw)
  //     .attr('class', "event")
  //     .attr("vector-effect", "non-scaling-stroke")
  //   ;
  //   // update
  //   selection
  //     .attr('cx', d => d.x)
  //     .attr('cy', d => d.y)
  //   ;
  // }

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
    let enter = selection.enter()
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
    let enter = selection.enter()
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
    ;
  }

  function activeLineWidth(point)
  {
    return point.connectedToGVD && !point.connectedToV ? 1 : 0;
  }

  //------------------------------
  // Render the active surface
  //------------------------------
  {
    let selection = d3.select("#gvd").selectAll(".gvd-surface-active")
      .data(lines);
    // exit
    selection.exit().remove();
    // enter
    let enter = selection.enter()
      .append("line")
      .attr('class', "gvd-surface-active")
      .attr("vector-effect", "non-scaling-stroke")
      .merge(selection)
      .attr('x1', d => d.x0)
      .attr('y1', d => d.y0)
      .attr('x2', d => d.x1)
      .attr('y2', d => d.y1)
      .attr("id", p => `treenode${p.id}`)
      .style("stroke-width", p => activeLineWidth(p))
    ;
  }
}
