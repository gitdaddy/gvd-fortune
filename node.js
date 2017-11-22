//------------------------------------------------------------
// Node in the binary search tree
//
// Leaf nodes have a site property which is a vec3. Internal
// nodes are edge nodes and have an edge property.
//------------------------------------------------------------

var SiteNode = function(site) {
	this.site = site;
	this.isLeaf = true;
	this.isEdge = false;
}

// left and right are the left and right children.
var EdgeNode = function(left, right) {
	this.edge = bisector(left.site, right.site);
	this.isLeaf = false;
	this.isEdge = true;
	this.site = left.site;
	this.left = left;
	this.right = right;
}

EdgeNode.prototype.getChild = function(side) {
	if (side == LEFT) return this.left;
	return this.right;
}

EdgeNode.prototype.setChild = function(node, side) {
	if (side == LEFT) this.left = node;
	else this.right = node;
}

EdgeNode.prototype.intersection = function(directrix) {
	var pleft = createParabola(this.left.site, directrix);
	var pright = createParabola(this.right.site, directrix);
	var intersections = pleft.intersect(pright);
	if (intersections.length == 1) return intersections[0];
	if (pleft.focus.y() > pright.focus.y()) return intersections[0];
	return intersections[1];
};


// var Node = {
// 	isLeaf: function() {
// 		return !this.hasOwnProperty("left");
// 	},
// 	isEdge: function() {
// 		return !this.isLeaf();
// 	}
// };

// function siteNode(site) {
// 	var n = Object.create(Node);
// 	n.site = site;
// 	return n;
// }

// // left and right are the left and right children.
// function edgeNode(left, right) {
// 	var edge = bisector(left.site, right.site);
// 	var n = Object.create(Node);
// 	n.edge = edge;
// 	n.site = left.site;
// 	n.left = left;
// 	n.right = right;
// 	n.intersection = function(directrix) {
// 		return siteSiteDirectrixIntersection(n.left.site, n.right.site, directrix);
// 	};
// 	return n;
// }

// //------------------------------------------------------------
// // Test function
// //------------------------------------------------------------
// function testNode() {
// 	var root = siteNode(vec3(0, 0, 0));
// 	var newSiteNode = siteNode(vec3(1, 0, 0));
// 	root = edgeNode(root, newSiteNode);
// 	console.log(root.site + " " + root.isLeaf());
// 	console.log(root.left.site + " " + root.left.isLeaf());
// 	console.log(root.right.site + " " + root.right.isLeaf());
// }

// var Node = function() {
// }

// Node.prototype.isLeaf = function() {
// 	return this.hasOwnProperty("site");
// }

// Node.prototype.isEdge = function() {
// 	return !this.isLeaf();
// }

// function leafNode(site) {
// 	return new Node() {
// 		site: site
// 	};
// }
