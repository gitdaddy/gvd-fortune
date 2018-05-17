var treeData =
  {
    // name: "Top Level",
    // value: 10,
    // type: "black",
    // level: "red",
    children: [
      {
	// name: "Level 2: A",
	// value: 15,
	// type: "grey",
	// level: "red",
	children: [
	  {
	    // name: "Son of A",
	    // value: 5,
	    // type: "steelblue",
	    // level: "orange"
	  },
	  {
	    // name: "Daughter of A",
	    // value: 8,
	    // type: "steelblue",
	    // level: "red"
	  }
	]
      },
      {
	// name: "Level 2: B",
	// value: 10,
	// type: "grey",
	// level: "green"
      }
    ]
  };

function nodeColor(node) {
  // return node.isEdge ? "red" : "blue";
  if (node.isEdge) {
    return "red";
  }
  // arc node
  var c = siteColor(node.id);
  var color = d3.rgb(c[0]*255, c[1]*255, c[2]*255);
  return color;
}

function getInfo(d) {
  if (d.data.isEdge)
    return d.data.dcelEdge.a + "-" + d.data.dcelEdge.b;
  if (d.data.closeEvent) {
    var arcNode = d.data;
    var prev = arcNode.prevArc();
    var next = arcNode.nextArc();
    return arcNode.closeEvent.y().toFixed(3) + " " + prev.id + " " +
      next.id;
  }
  return '';
}

function showTree(treeData) {
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
      // return "M" + d.x + "," + d.y
      //   + "C" + (d.x + d.parent.x) / 2 + "," + d.y
      //   + " " + (d.x + d.parent.x) / 2 + "," + d.parent.y
      //   + " " + d.parent.x + "," + d.parent.y;
      // })
      return "M" + d.x + "," + d.y
        + "C" + d.x + "," + (d.y + d.parent.y) / 2
        + " " + d.parent.x + "," +  (d.y + d.parent.y) / 2
        + " " + d.parent.x + "," + d.parent.y;
    })
  // .attr("d", diagonal)
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
    .on("mouseover", function(d) {
      var g = d3.select(this); // The node
      // The class is used to remove the additional text later
      var info = g.append('text')
        .classed('info', true)
        .attr('x', 10)
        .attr('y', -20)
        .text(getInfo(d)/*'More info'*/);
    })
    .on("mouseout", function() {
      // Remove the info text on mouse out.
      d3.select(this).select('text.info').remove()
    })
  ;

  // adds the circle to the arcNode
  node.append("circle")
    .attr("r", function(d) { return 10;/*d.data.value;*/ })
    .style("stroke", function(d) { return nodeColor(d.data); })
    .style("fill", function(d) { return nodeColor(d.data); })
  
  // adds the text to the arcNode
  node.append("text")
    .attr("dy", ".35em")
  // .attr("x", function(d) { return d.children ? 
  // 												 (10/*d.data.value*/ + 4) * -1 : 10/*d.data.value*/ + 4 })
  // .attr("x", function(d) { return (10 + 4) * -1 })
    .attr("x", function(d) { return (10 + 4) * -1 })
  // .style("text-anchor", function(d) { 
  // 	return d.children ? "end" : "start"; })
    .style("text-anchor", function(d) { return "end"; })
  // .text(function(d) { return "abc"; });//d.data.name; });
    .text(function(d) {
      // console.log(d);
      var star = "";
      if (d.data.closeEvent && d.data.closeEvent.live) {
	// return d.data.closeEvent.y().toFixed(2);
        star = "*";
	// star = " (" + d.data.closeEvent.y().toFixed(1) + ")";
      }
      if (d.data.id) {
        return d.data.id + star;
      }
      return "abc";
    });//d.data.name; });
}
