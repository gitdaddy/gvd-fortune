var CircleEvent = function(y, node, equi, a, b) {
	this.yval = y;
	this.y = function() { return this.yval; }
	// Point that is equidistant from the three points
	this.equi = equi;
	this.node = node;
	this.a = a;
	this.b = b;
};
