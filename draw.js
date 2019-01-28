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

function drawDebugObjs(objs) {
  var parabolas = _.filter(objs, function (o) {
    return !_.isUndefined(o.para);
  });
  parabolas = _.map(parabolas, function (p) { return p.para; });
  // _.forEach(parabolas, function (p) {
  //   p.prepDraw();
  // });

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
  ;

  let line = d3.line()
  .x(function (d) {return d.x;})
  .y(function (d) {return d.y;})
  .curve(d3.curveLinear)
  ;
  let d3generalEdges = d3.select('#gvd')
    .selectAll('.gvd-surface-parabola')
    .data(parabolas)
  ;
  d3generalEdges.exit().remove();
  d3generalEdges.enter()
    .append("path")
    .style("fill","none")
    .attr("class", "gvd-surface-parabola")
    .attr("vector-effect", "non-scaling-stroke")
    .merge(d3generalEdges)
    .style("stroke-width", 5)
    .attr("d", p => line(p.drawPoints))
    .attr("id", p => p.id)
    .attr("transform", p => p.transform)
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
    // draw segment boundaries
    var boundaries = [];
    _.forEach(segments, function(s) {
      var AB = subtract(s.b, s.a);
      var BA = subtract(s.a, s.b);
      var v1Clockwise = new vec3(AB.y, -AB.x, 0); // 90 degrees perpendicular
      var v1CounterClockwise = new vec3(-AB.y, AB.x, 0);
      var v2Clockwise = new vec3(BA.y, -BA.x, 0);
      var v2CounterClockwise = new vec3(-BA.y, BA.x, 0);
      // define the boundary endpoints - add end point values
      boundaries.push({
        p1: add(v1Clockwise, s.a),
        p2: add(v1CounterClockwise, s.a)
      });
      boundaries.push({
        p1: add(v2Clockwise, s.b),
        p2: add(v2CounterClockwise, s.b)
      });
    });

    let selB = d3.select("#gvd")
    .selectAll(".seg-boundary")
    .data(boundaries);

    selB.exit().remove();
    selB
      .enter()
      .append("line")
      .attr("class", "seg-boundary")
      .attr("vector-effect", "non-scaling-stroke")
      .merge(selB)
      .attr("x1", bound => bound.p1.x)
      .attr("y1", bound => bound.p1.y)
      .attr("x2", bound => bound.p2.x)
      .attr("y2", bound => bound.p2.y)
      .attr('visibility', showSegmentBoundaries ? null : 'hidden')
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
        gp.prepDraw(-10000, vec3(edge.origin.point.x, edge.origin.point.y, 0.0), vec3(edge.dest.point.x, edge.dest.point.y, 0.0));
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

function activeLineWidth(point) {
  return point.connectedToGVD ? 1 : 0;
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
      .style("stroke-width", p => activeLineWidth(p))
    ;
  }
  //------------------------------
  // Render the debug objects
  //------------------------------
  drawDebugObjs(debugObjs);
}

