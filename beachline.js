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

	var left = arcNode.prevArc();
	var right = arcNode.nextArc();
	if (left != null && right != null) {
		var equi = equidistant(left.site, arcNode.site, right.site);
		var r = length(subtract(arcNode.site, equi));
		var a = 3;
		var b = 3;
		return new CircleEvent(equi.y()-r, arcNode, equi, a, b);
	}
	return null;
}

//------------------------------------------------------------
// add
//
// Site is a vec3 or a CircleEvent.
//------------------------------------------------------------
Beachline2.prototype.add = function(site) {
	var node = new ArcNode(site);
	if (this.root == null) {
		this.root = node;
	} else if (this.root.isArc) {
		this.root = splitArcNode(this.root, node);
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
	var e = createCircleEvent(node.prevArc());
	if (e != null) {
		closeEvents.push(e);
	}
	e = createCircleEvent(node.nextArc());
	if (e != null) {
		closeEvents.push(e);
	}

	return closeEvents;
}

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

