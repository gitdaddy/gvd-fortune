"use strict";

function createDatasets() {
  let points1 = [
    vec3(0.01, 0.21, 0),
    vec3(0.01, -0.61, 0),

    // vec3(-0.05, 0.41, 0),
    // p1 -- V -- p2
    // Right side tests
    // vec3(0.12,  0.01, 0),
    // vec3(0.29,  -0.11, 0),
    // vec3(0.38,  0.0, 0),
    // // Left side tests
    vec3(-0.12,  0.01, 0),

    // vec3(-0.28,  -0.31, 0),
    // vec3(-0.34, -0.1, 0),
    // vec3(-0.48,  -0.11, 0),
  ];
  let segments1 = [
    makeSegment(points1[0], points1[1])
  ];

  let points2 = [
    // segment test points
    vec3(-0.2, 0.6, 0),
    vec3(-0.1, -0.6, 0),
    vec3(0.2, -0.3, 0),
    // remaining points
    vec3(-0.30, 0.1, 0),
    vec3(-0.26, 0.73, 0),
    vec3(-0.5, 0.3, 0),
    vec3(-0.12,0.13, 0),
    vec3(0.73,0.15, 0),
    vec3(0.42,0.5, 0),
    vec3(0.0, -0.7, 0),
  ];
  let segments2 = [
    makeSegment(points2[0], points2[1])
  ];

  let points5 = [
    vec3(-0.26, 0.73, 0),
    vec3(0.62, 0.37, 0),
    vec3(-0.12,0.13, 0),
    vec3(-0.30, -0.1, 0),
    vec3(0.73,-0.13, 0),
    vec3(-0.65, -0.15, 0),
  ];
  let segments5 = [];

  let points3 = [];
  let segments3 = [];
  {
    Math.seedrandom('5');
    let numRandom = 30;
    for (var i = 0; i < numRandom; ++i) {
      var p = vec3(Math.random()*2-1, Math.random()*2-1, 0);
      points3.push(p);
    }
  }

  Math.seedrandom('3');
  let numRandom = 100;
  let points4 = [];
  for (var i = 0; i < numRandom; ++i) {
  	var p = vec3(Math.random()*2-1, Math.random()*2-1, 0);
  	points4.push(p);
  }
  let segments4 = [];

  datasets = {
    'dataset1' : { points:points1, segments:segments1 },
    'dataset2' : { points:points2, segments:segments2 },
    'dataset3' : { points:points3, segments:segments3 },
    'dataset4' : { points:points4, segments:segments4 },
    'dataset5' : { points:points5, segments:segments5 },
  };
}
