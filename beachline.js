//------------------------------------------------------------
// Segment
//------------------------------------------------------------

const LEFT = -2.0;
const RIGHT = 2.0;

var Segment = function(parabola, left, right) {
	this.parabola = parabola;
	this.left = left;
	this.right = right;
};

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
	newSegments.push(segment);
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
			this.add(new Segment(parabola,
													 vec2(-1.0, parabola.f(-1.0)), vec2(1.0, parabola.f(1.0))),
							 this.segments, "0");
		}
		return [];
	}

	var vertices = [];
	var newSegments = [];
	var i = 0;
	var segment = this.segments[i];
	var intersections = segment.intersect(parabola, "1");
	var left = intersections[0];
	// Search from left to right until we find a segment
	// that the parabola intersects with
	while (left.x() == RIGHT && i < this.segments.length) {
		this.add(segment, newSegments, "1");
		++i;
		segment = this.segments[i];
		intersections = segment.intersect(parabola, "2");
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
		}
	}
	if (i == this.segments.length) {
		this.add(new Segment(parabola, left, vec2(1.0, parabola.f(1.0))), newSegments, "3");
	} else {
		this.add(new Segment(parabola, left, right), newSegments, "3.5");
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

