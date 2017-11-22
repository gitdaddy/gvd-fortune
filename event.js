// var SiteEvent = function(p) {
// 	this.y = p.y();
// 	this.p = vec3(p);
// };

var CircleEvent = function(y, node) {
	this.yval = y;
	this.y = function() { return this.yval; }
	this.node = node;
};
