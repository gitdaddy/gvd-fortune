const LEFT_CHILD = 0;
const RIGHT_CHILD = 1;

var Beachline2 = function() {
	this.root = null;
}

//------------------------------------------------------------
// Utility function
//------------------------------------------------------------
function splitArcNode(toSplit, node) {
	var left = toSplit;
	var right = new ArcNode(toSplit.site);
	return new EdgeNode(left, new EdgeNode(node, right));
}

//------------------------------------------------------------
// createCircleEvent
//------------------------------------------------------------
function createCircleEvent(arcNode) {
	if (arcNode == null) return null;

	// var left = prevArc(arcNode);
	var left = arcNode.prevArc();
	// var right = nextArc(arcNode);
	var right = arcNode.nextArc();
	if (left != null && right != null) {
		var equi = equidistant(left.site, arcNode.site, right.site);
		var r = length(subtract(arcNode.site, equi));
		return new CircleEvent(equi.y()-r, arcNode);
	}
	return null;
}

//------------------------------------------------------------
// add
//
// site is a vec3
//------------------------------------------------------------
Beachline2.prototype.add = function(site) {
	var newNode = null;
	var node = new ArcNode(site);
	if (this.root == null) {
		this.root = node;
		newNode = this.root;
	} else if (this.root.isArc) {
		this.root = splitArcNode(this.root, node);
		newNode = this.root;
	} else {
		var directrix = site.y();
		var parent = this.root;
		var x = parent.intersection(directrix).x();
		var side = (site.x() < x) ? LEFT_CHILD : RIGHT_CHILD;
		var child = parent.getChild(side);
		while (child.isEdge) {
			parent = child;
			x = parent.intersection(directrix).x();
			side = (site.x() < x) ? LEFT_CHILD : RIGHT_CHILD;
			child = parent.getChild(side);
		}
		var newNode = splitArcNode(child, node);
		parent.setChild(newNode, side);
	}

	// Create close events
	var closeEvents = [];
	// var e = createCircleEvent(prevArc(node));
	var e = createCircleEvent(node.prevArc());
	if (e != null) {
		closeEvents.push(e);
	}
	// e = createCircleEvent(nextArc(node));
	e = createCircleEvent(node.nextArc());
	if (e != null) {
		closeEvents.push(e);
	}

	return closeEvents;
}

// //------------------------------------------------------------
// // prevArc
// // Returns the previous in-order arc node
// //------------------------------------------------------------
// function prevArc(node) {
// 	while (node.parent != null && node.parent.left == node) {
// 		node = node.parent;
// 	}
// 	if (node.parent == null) return null;
// 	node = node.parent.left;
// 	while (!node.isArc) {
// 		node = node.right;
// 	}
// 	return node;
// }

// //------------------------------------------------------------
// // nextArc
// // Returns the next in-order arc node
// //------------------------------------------------------------
// function nextArc(node) {
// 	while (node.parent != null && node.parent.right == node) {
// 		node = node.parent;
// 	}
// 	if (node.parent == null) return null;
// 	node = node.parent.right;
// 	while (!node.isArc) {
// 		node = node.left;
// 	}
// 	return node;
// }

//------------------------------------------------------------
// remove
//------------------------------------------------------------
Beachline2.prototype.remove = function(node) {
	if (!node.isArc) throw "Unexpected edge in remove";

	var parent = node.parent;
	var grandparent = parent.parent;
	var side = (parent.left == node) ? LEFT_CHILD : RIGHT_CHILD;
	var parentSide = (grandparent.left == parent) ? LEFT_CHILD : RIGHT_CHILD;

	var sibling = parent.getChild(1-side);
	grandparent.setChild(sibling, parentSide);
}

//------------------------------------------------------------
// render
//------------------------------------------------------------

Beachline2.prototype.renderImpl = function(program, directrix, node, leftx, rightx) {
	if (node.isArc) {
		createParabola(node.site, directrix).render(program, leftx, rightx);
	} else {
		var p = node.intersection(directrix);
		this.renderImpl(program, directrix, node.left, leftx, p.x());
		this.renderImpl(program, directrix, node.right, p.x(), rightx);
	}
}

Beachline2.prototype.render = function(program, directrix) {
	if (this.root == null) return;
	this.renderImpl(program, directrix, this.root, -1, 1);
}

//------------------------------------------------------------
// toDot
//------------------------------------------------------------

function toDotImpl(directrix, node, leftx, rightx, level) {
	var s = "";
	if (node.isArc) {
	} else {
		var p = node.intersection(directrix);
		s += node.toDot() + " -> " + node.left.toDot() + "\n";
		s += node.toDot() + " -> " + node.right.toDot() + "\n";
		s += toDotImpl(directrix, node.left, leftx, p.x(), level+1);
		s += toDotImpl(directrix, node.right, p.x(), rightx, level+1);
	}
	return s;
}

Beachline2.prototype.toDot = function(directrix) {
	var s = "digraph G {";
	if (this.root != null) {
		s += toDotImpl(directrix, this.root, -1, 1, 0);
	}
	s += "}";
	return s;
}

//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------
//------------------------------------------------------------

//------------------------------------------------------------
// Segment
//------------------------------------------------------------

const LEFT = -2.0;
const RIGHT = 2.0;

var Segment = function(parabola, left, right) {
	this.parabola = parabola;
	this.left = left;
	this.right = right;
	if (left.x() == LEFT || left.x() == RIGHT ||
			right.x() == LEFT || right.x() == RIGHT) {
		throw "Bad segment: left = " + left + " right = " + right;
	}
}

Segment.prototype.isDegenerate = function() {
	const EPSILON = 0.0000001;
	return Math.abs(this.left.x() - this.right.x()) < EPSILON;
}

Segment.prototype.render = function(program, color) {
	this.parabola.render(program, this.left.x(), this.right.x(), color);
}

Segment.prototype.intersect = function(parabola, prefix="") {
	var intersections = this.parabola.intersect(parabola);
	for (var i = 0; i < intersections.length; ++i) {
		if (intersections[i].x() < this.left.x())
			intersections[i].setx(LEFT);
		else if (intersections[i].x() > this.right.x()) {
			intersections[i].setx(RIGHT);
		}
	}
	// if (prefix != "") {
	// 	console.log(prefix + " intersecting " + parabola.h + " with " +
	// 							this.parabola.h + ": " + intersections);
	// }
	return intersections;
}

//------------------------------------------------------------
// Beachline
//------------------------------------------------------------

var Beachline = function() {
	this.segments = [];
}

Beachline.prototype.vertices = function() {
	var verts = [];
	for (var i = 0; i < this.segments.length - 1; ++i) {
		verts.push(this.segments[i].right);
	}
	return verts;
}

Beachline.prototype.render = function(program, color) {
	this.segments.forEach(function(segment) {
		segment.render(program, color);
	});
}

Beachline.prototype.add = function(segment, newSegments, prefix="") {
	// if (prefix != "") {
	// 	console.log(prefix + " adding h=" + segment.parabola.h +
	// 							" left=" + segment.left + " right=" + segment.right);
	// }
	if (!segment.isDegenerate()) {
		newSegments.push(segment);
	}
}

// point, site one and site two
var Vertex = function(p, s1, s2) {
	this.p = p;
	this.s1 = s1;
	this.s2 = s2;
}

// Returns intersections of the given parabola with any other parabola. Call
// them vertices.
Beachline.prototype.update = function(parabola) {
	// console.log("updating");
	if (this.segments.length == 0) {
		if (Math.abs(parabola.p) > 0.000001) {
			var left = vec3(-1.0, parabola.f(-1.0), 0);
			var right = vec3(1.0, parabola.f(1.0), 0);
			this.add(new Segment(parabola, left, right), this.segments, "0");
		}
		return [];
	}

	var vertices = [];
	var newSegments = [];
	var i = 0;
	var segment = this.segments[i];
	var intersections = segment.intersect(parabola, "1");
	// if (intersections.length == 0) {
	// 	console.log("no intersections");
	// 	console.log(segment.parabola.focus);
	// 	console.log(segment.parabola.p);
	// 	console.log(parabola.focus);
	// 	console.log(parabola.p);
	// }
	var left = intersections[0];
	// Search from left to right until we find a segment
	// that the parabola intersects with
	while (left.x() == RIGHT && i < this.segments.length) {
		this.add(segment, newSegments, "1");
		++i;
		segment = this.segments[i];
		intersections = segment.intersect(parabola, "2");
		if (intersections.length == 0) {
			console.log("no intersections");
			console.log(segment.parabola.focus);
			console.log(parabola.focus);
		}
		left = intersections[0];
	}
	// The parabola's left intersection is either to the left of or in
	// the range of segment i.
	if (left.x() != LEFT) {
		var add1 = new Segment(segment.parabola, segment.left, left);
		this.add(add1, newSegments, "2");
		// if (left.y() != left.y()) {
		// 	console.log("2 pushing " + left);
		// 	console.log(parabola);
		// 	console.log(segment.parabola);
		// }
		vertices.push(new Vertex(left, 0, 0));
	}

	// Skip over parabolas covered by this parabola
	var right = intersections[1];
	while (right.x() == RIGHT && i < this.segments.length) {
		// console.log("Skipping " + segment.parabola.h);
		++i;
		if (i == this.segments.length) {
			right.setx(0.0);
		} else {
			segment = this.segments[i];
			intersections = segment.intersect(parabola, "3");
			right = intersections[1];
			// console.log("right");
			// console.log(right);
		}
	}
	if (i == this.segments.length) {
		// This parabola covers all other parabolas
		this.add(new Segment(parabola, left, vec3(1.0, parabola.f(1.0), 0)),
						 newSegments, "3");
	} else {
		left.setx(Math.max(left.x(), -1.0));
		this.add(new Segment(parabola, left, right),
						 newSegments, "3.5");
		// console.log("1 pushing " + right);
		vertices.push(new Vertex(right, 0, 0));
		this.add(new Segment(segment.parabola, right, segment.right), newSegments, "4");
		++i;
		while (i < this.segments.length) {
			segment = this.segments[i];
			this.add(segment, newSegments, "5");
			++i;
		}
	}

	this.segments = newSegments;
	return vertices;
}

