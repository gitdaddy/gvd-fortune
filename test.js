function checkEqual(a, b) {
  if (typeof(a) == "number") {
    if (Math.abs(a-b) > 0.000001) {
      console.error(a + " != " + b);
    }
  } else {
    if (a != b) {
      console.error(a + " != " + b);
    }
  }
}

function runTests() {
  {
    var p = createGeneralParabola(vec3(0,1,0), [vec3(0,0,0), vec3(1,0,0)])
    checkEqual(p.parabola.h, 0);
    checkEqual(p.parabola.k, 0.5);
    checkEqual(p.parabola.p, 0.5);
    checkEqual(p.theta, 0);
  }
  {
    var p = createGeneralParabola(vec3(0,1,0), [vec3(1,0,0), vec3(0,0,0)])
    checkEqual(p.parabola.h, 0);
    checkEqual(p.parabola.k, 0.5);
    checkEqual(p.parabola.p, 0.5);
    checkEqual(p.theta, 0);
  }
  {
    var p = createGeneralParabola(vec3(0,-1,0), [vec3(1,0,0), vec3(0,0,0)])
    checkEqual(p.parabola.h, 0);
    checkEqual(p.parabola.k, 0.5);
    checkEqual(p.parabola.p, 0.5);
    checkEqual(p.theta, Math.PI);
  }
  {
    var p = createGeneralParabola(vec3(0,-1,0), [vec3(0,0,0), vec3(1,0,0)])
    checkEqual(p.parabola.h, 0);
    checkEqual(p.parabola.k, 0.5);
    checkEqual(p.parabola.p, 0.5);
    checkEqual(p.theta, -Math.PI);
  }
  {
    var p = createGeneralParabola(vec3(1,1,0), [vec3(0,0,0), vec3(1,0,0)])
    checkEqual(p.parabola.h, 1);
    checkEqual(p.parabola.k, 0.5);
    checkEqual(p.parabola.p, 0.5);
    checkEqual(p.theta, 0);
  }
  {
    var p = createGeneralParabola(vec3(1,1,0), [vec3(0,1,0), vec3(1,0,0)])
    checkEqual(p.parabola.h, 1);
    checkEqual(p.parabola.k, Math.sqrt(2)/4);
    checkEqual(p.parabola.p, Math.sqrt(2)/4);
    checkEqual(p.theta, -Math.PI/4);
  }

  //------------------------------------------------------------
  // Rendering tests
  //------------------------------------------------------------
  var line = new Line();
  // {
  //   var f = vec3(1/2, 1/2, 0);
  //   var a = vec3(0, 1/2, 0);
  //   var b = vec3(1/2, 0, 0);
  //   var s = [a, b];
  //   var p = createGeneralParabola(f, s);
  //   circle.render(program, p.parabola.focus, 0.01, true, red);
  //   p.render(program, -1, 1, red);
  //   line.render(program, a.x, a.y, b.x, b.y, red);
  // }
  // {
  //   var f = vec3(1/2, 1/2, 0);
  //   var a = vec3(0, 1/4, 0);
  //   var b = vec3(1/4, 0, 0);
  //   var s = [a, b];
  //   var p = createGeneralParabola(f, s);
  //   circle.render(program, p.focus, 0.01, true, red);
  //   p.render(program, -1, 1, red);
  //   line.render(program, a.x, a.y, b.x, b.y, red);
  // }
  // {
  //   var f = vec3(1/2, 1/2, 0);
  //   var a = vec3(0, 7/8, 0);
  //   var b = vec3(7/8, 0, 0);
  //   var s = [a, b];
  //   var p = createGeneralParabola(f, s);
  //   circle.render(program, p.focus, 0.01, true, red);
  //   p.render(program, -1, 1, red);
  //   line.render(program, a.x, a.y, b.x, b.y, red);
  // }
  // {
  //   var f = vec3(1/2, 1/2, 0);
  //   var a = vec3(0, 1/8, 0);
  //   var b = vec3(7/8, 0, 0);
  //   var s = [a, b];
  //   var p = createGeneralParabola(f, s);
  //   circle.render(program, p.focus, 0.01, true, red);
  //   p.render(program, -1, 1, red);
  //   line.render(program, a.x, a.y, b.x, b.y, red);
  // }
  // {
  //   var f = vec3(1/2, 1/2, 0);
  //   var a = vec3(0, 0, 0);
  //   var b = vec3(1, 1/2, 0);
  //   var s = [a, b];
  //   var p = createGeneralParabola(f, s);
  //   circle.render(program, p.focus, 0.01, true, red);
  //   p.render(program, -1, 1, red);
  //   line.render(program, a.x, a.y, b.x, b.y, red);

  //   var p1 = vec3(0,0,0);
  //   // var v = vec3(1,0.8,0);
  //   var v = vec3(0.8,0.8,0);
  //   var p2 = add(p1, v);
  //   var q = p.intersectRay(p1, v);
  //   q.slice(0, 1).forEach(function(qq) {
  //     // console.log("intersection = " + q[1]);
  //     circle.render(program, qq, 0.01, true, blue);
  //   });
  //   line.render(program, p1.x, p1.y, p2.x, p2.y, blue);
  // }
}
