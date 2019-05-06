function nodeColor(node) {
  if (node.isEdge) {
    return "black";
  }
  // arc node
  // var c = siteColor(node.id);
  // var c = arcColorSvg(node.id);
  var c = siteColorSvg(node.site.label);
  return c;
  // var color = d3.rgb(c[0]*255, c[1]*255, c[2]*255);
  // return color;
}

function getInfo(d) {
  if (d.data.isEdge)
    return d.data.dcelEdge.a + "-" + d.data.dcelEdge.b;
  if (d.data.closeEvent) {
    var arcNode = d.data;
    var prev = arcNode.prevArc();
    var next = arcNode.nextArc();
    return arcNode.closeEvent.y.toFixed(3) + " " + prev.id + " " +
      next.id;
  }
  return '';
}

function highlight(d) {
  // Highlight the arc
  let node = d3.select(`#treenode${d.data.id}`);
  node.style("stroke-width", 5);

  if (d.data.isArc) {
    // Highlight the site
    d3.select(`#site${d.data.site.id}`).attr("r", SITE_RADIUS_HIGHLIGHT);

    // Debug
    let arc = node;
    if (!arc.empty() && arc.attr('leftx')) {
      let x0 = (+arc.attr('leftx')).toFixed(1);
      let x1 = (+arc.attr('rightx')).toFixed(1);
      setDebug(`x0=${x0} x1=${x1}`);
    }
  } else {
    let edge = d.data;
    // console.log(edge);
    let msg = 'intersections: ';
    edge.intersections.forEach(function(i) {
      msg = msg + ` (${i.x.toFixed(1)}, ${i.y.toFixed(1)})`;
    });
    msg = msg + '<br>selected intersection: ';
    let i = edge.selectedIntersection;
    msg = msg + ` (${i.x.toFixed(1)}, ${i.y.toFixed(1)})`;
    setDebug(msg);
  }
}

function showTree(treeData) {
  if (treeData == null || fullScreen) return;

  // set the dimensions and margins of the diagram
  // var margin = {top: 20, right: 90, bottom: 30, left: 90},
  var margin = {top: 20, right: 90, bottom: 90, left: 90},
  width = 660 - margin.left - margin.right,
  height = 512 - margin.top - margin.bottom;

  // declares a tree layout and assigns the size
  var treemap = d3.tree()
    .size([height, width]);

  // var diagonal = d3.svg.diagonal()
  // 	.projection(function(d) { return [d.x, d.y]; });

  //  assigns the data to a hierarchy using parent-child relationships
  var nodes = d3.hierarchy(treeData, function(d) {
    if (!d) return [];
    if (!d.left) return [];
    return [ d.left, d.right ];
  });

  // maps the arcNode data to the tree layout
  nodes = treemap(nodes);

  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  d3.select(".tree").html("");
  var svg = d3.select(".tree")//.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom),
  g = svg.append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")")
  ;

  // adds the links between the nodes
  var link = g.selectAll(".link")
    .data(nodes.descendants().slice(1))
    .enter().append("path")
    .attr("class", "link")
    .style("stroke", function(d) { return "green"; })//d.data.level; })
    .attr("d", function(d) {
      return "M" + d.x + "," + d.y
        + "L" + d.parent.x + "," + d.parent.y;
    })
  ;

  // adds each arcNode as a group
  var node = g.selectAll(".arcNode")
    .data(nodes.descendants())
    .enter().append("g")
    .attr("class", function(d) {
      return "arcNode" +
        (d.children ? " arcNode--internal" : " arcNode--leaf"); })
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"; })
    .on("click", function(d) { console.log("click"); })
  ;

  // adds the circle to the arcNode
  node.append("circle")
    .attr("r", function(d) { return 10;/*d.data.value;*/ })
    .style("stroke", function(d) { return nodeColor(d.data); })
    .style("fill", function(d) { return nodeColor(d.data); })
    // .on("mouseover", function(d) {
    //   // Highlight the arc
    //   let node = d3.select(`#treenode${d.data.id}`);
    //   node.style("stroke-width", 5);
    //   // Highlight the site
    //   if (d.data.isArc) {
    //     d3.select(`#site${d.data.site.id}`).attr("r", SITE_RADIUS_HIGHLIGHT);
    //     // Debug
    //     let arc = node;
    //     if (arc.attr('leftx')) {
    //       let x0 = (+arc.attr('leftx')).toFixed(1);
    //       let x1 = (+arc.attr('rightx')).toFixed(1);
    //       setDebug(`x0=${x0} x1=${x1}`);
    //     }
    //   }
    // })
    .on('mouseover', highlight)
    .on("mouseout", function(d, i) {
      d3.select(`#treenode${d.data.id}`).style("stroke-width", null);
      setDebug('');
      if (d.data.isArc)
        d3.select(`#site${d.data.site.id}`).attr("r", SITE_RADIUS);
    })
;

  // adds the text to the arcNode
  node.append("text")
    .attr("dy", ".35em")
    .attr("x", function(d) { return (10 + 4) * -1 })
    .style("text-anchor", function(d) { return "end"; })
    .text(function(d) {
      var star = "";
      // if (d.data.closeEvent && d.data.closeEvent.live) {
      //   star = "*";
      // }
      if (d.data.id) {
        return d.data.id + star;
      }
      return "abc";
    });
}
