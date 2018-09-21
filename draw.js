function drawSweepline(sweepline) {
  d3.select("#sweepline")
    .attr("x1", -1)
    .attr("y1", sweepline)
    .attr("x2", 1)
    .attr("y2", sweepline)
  ;
}

function drawSurface(dcel) {
  // Render surface with D3
  let iter = dcel.edges;
  let result = iter.next();
  let count = 0;
  let edges = [];
  while (!result.done) {
    var edge = result.value;
    if (edge.origin.point && edge.dest.point) {
      var op = edge.origin.point;
      var dp = edge.dest.point;
      if (op[0] == op[0] && op[1] == op[1] &&
          dp[0] == dp[0] && dp[1] == dp[1]) {
        edges.push(edge);
      }
    }
    result = iter.next();
  }
  let update = function(s) {
    s
      .attr('x1', e => e.origin.point[0])
      .attr('y1', e => e.origin.point[1])
      .attr('x2', e => e.dest.point[0])
      .attr('y2', e => e.dest.point[1])
    ;
  };
  let d3edges = d3.select('#gvd')
    .selectAll('.gvd-surface')
    .data(edges)
  ;
  d3edges.exit().remove();
  let enter = d3edges.enter()
    .append('line')
    .attr('class', "gvd-surface")
    .attr("vector-effect", "non-scaling-stroke")
  ;
  update(enter);
  update(d3edges);
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

  //------------------------------
  // Render the events
  //------------------------------
  if (renderEvents) {
    let selection = d3.select("#gvd").selectAll(".event")
      .data(events);
    // exit
    selection.exit().remove();
    // enter
    selection.enter()
      .append("circle")
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 6/gvdw)
      .attr('class', "event")
      .attr("vector-effect", "non-scaling-stroke")
    ;
    // update
    selection
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
    ;
  }
  
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
    let update = function(s) {
        s
        .attr("d", p => line(p.drawPoints))
        .style("stroke", p => arcColorSvg(p.id))
        .attr("id", p => `treenode${p.id}`)
        .attr("leftx", p => p.drawPoints[0].x)
        .attr("rightx", p => p.drawPoints[p.drawPoints.length-1].x)
        .attr("transform", p => p.transform)
      ;
    };
    // exit
    selection.exit().remove();
    // enter
    let enter = selection.enter()
      .append("path")
      .style("fill","none")
      .attr("class", "beach-parabola")
      .attr("vector-effect", "non-scaling-stroke")
    ;
    update(enter);
    // update
    update(selection);
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
    let update = function(s) {
      s.attr("d", p => line(p.drawPoints))
        .style("stroke", p => arcColorSvg(p.id))
        .attr("id", p => `treenode${p.id}`)
        .attr("leftx", p => p.drawPoints[0].x)
        .attr("rightx", p => p.drawPoints[p.drawPoints.length-1].x)
    ;
    };
    // exit
    selection.exit().remove();
    // enter
    let enter = selection.enter()
      .append("path")
      .style("fill","none")
      .attr("class", "beach-parabola")
      .attr("vector-effect", "non-scaling-stroke")
    ;
    update(enter);
    // update
    update(selection);
  }
  
  //------------------------------
  // Render the active surface
  //------------------------------
  {
    let selection = d3.select("#gvd").selectAll(".gvd-surface-active")
      .data(lines);
    let update = function(s) {
      s
        .attr('x1', d => d.x0)
        .attr('y1', d => d.y0)
        .attr('x2', d => d.x1)
        .attr('y2', d => d.y1)
        .attr("id", p => `treenode${p.id}`)
    };
    // exit
    selection.exit().remove();
    // enter
    let enter = selection.enter()
      .append("line")
      .attr('class', "gvd-surface-active")
      .attr("vector-effect", "non-scaling-stroke")
    ;
    update(enter);
    // update
    update(selection);
  }  

}
