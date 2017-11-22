//------------------------------------------------------------
// Edge
//------------------------------------------------------------

var Edge = function(p0, v) {
	this.p0 = p0;
	this.v = v;
	this.t0 = undefined;
	this.t1 = undefined;

	this.p = function(t) {
		return add(this.p0, mult(t, this.v));
	};

	// The two endpoints are a and b.
	this.a = function() {
		return this.p(this.t0);
	}
	this.b = function() {
		return this.p(this.t1);
	}
}

// Returns an edge that bisects points a and b.
function bisector(a, b) {
	// console.log(a);
	// console.log(b);
	var vv = subtract(a, b);
	// console.log(vv);
	var c = add(b, mult(0.5, vv));
	var v = normalize(vec3(-vv.y(), vv.x(), 0));
	return new Edge(c, v);
}
