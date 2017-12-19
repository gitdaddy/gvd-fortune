//------------------------------------------------------------
// ArcNode
//------------------------------------------------------------

var nodeId = 0;

var ArcNode = function(site) {
	this.id = nodeId++;
	this.site = site;
	this.isArc = true;
	this.isEdge = false;
	this.toDot = function() {
		return "\"" + this.site.x() + " (" + this.id + ")" + "\"";
	};
}

//------------------------------------------------------------
// prevArc
// Returns the previous in-order arc node
//------------------------------------------------------------
ArcNode.prototype.prevArc = function() {
	var node = this;
	while (node.parent != null && node.parent.left == node) {
		node = node.parent;
	}
	if (node.parent == null) return null;
	return node.parent.prevArc();
}

//------------------------------------------------------------
// nextArc
// Returns the next in-order arc node
//------------------------------------------------------------
ArcNode.prototype.nextArc = function() {
	var node = this;
	while (node.parent != null && node.parent.right == node) {
		node = node.parent;
	}
	if (node.parent == null) return null;
	return node.parent.nextArc();
	// node = node.parent.right;
	// while (!node.isArc) {
	// 	node = node.left;
	// }
	// return node;
}

//------------------------------------------------------------
// EdgeNode
// left and right are the left and right children.
//------------------------------------------------------------
var EdgeNode = function(left, right, vertex) {
	this.id = nodeId++;
	// this.edge = bisector(left.site, right.site);
	this.isArc = false;
	this.isEdge = true;
	// this.site = left.site;
	this.left = left;
	this.right = right;
	// this.children = [ left, right ];
	this.avertex = vertex;
	this.bvertex = null;

	left.parent = this;
	right.parent = this;

	this.toDot = function() {
		return "\"" + this.id + "\"";
	};
}

EdgeNode.prototype.prevArc = function() {
	var node = this;
	// node = node.parent.left;
	node = node.left;
	while (!node.isArc) {
		node = node.right;
	}
	return node;
}

EdgeNode.prototype.nextArc = function() {
	var node = this;
	// node = node.parent.right;
	node = node.right;
	while (!node.isArc) {
		node = node.left;
	}
	return node;
}

EdgeNode.prototype.getChild = function(side) {
	if (side == LEFT_CHILD) return this.left;
	return this.right;
}

EdgeNode.prototype.setChild = function(node, side) {
	if (side == LEFT_CHILD) {
		this.left = node;
	} else {
		this.right = node;
	}
	node.parent = this;
}

EdgeNode.prototype.intersection = function(directrix) {
	// This is inefficient. We should be storing sites in edge nodes.
	var pleft = createParabola(this.prevArc().site, directrix);
	var pright = createParabola(this.nextArc().site, directrix);
	var intersections = pleft.intersect(pright);
	if (intersections.length == 1) return intersections[0];
	if (pleft.focus.y() > pright.focus.y()) return intersections[0];
	return intersections[1];
};
