"use strict";

function createDatasets() {
  let points1 = [
    vec3(0.35, 0.6, 0),
    vec3(0.6, -0.5, 0),
    vec3(-0.55, 0.61, 0),
    vec3(-0.65, -0.51, 0)
  ];
  let segments1 = [
    makeSegment(points1[0], points1[1]),
    makeSegment(points1[2], points1[3])
  ];

  let points2 = [
    // segment test points
    vec3(-0.8, 0.6, 0),
    vec3(-0.4, -0.6, 0),
    vec3(0.7, -0.3, 0),
    // remaining points
    vec3(0.95, 0.81, 0),
    vec3(-0.40, 0.1, 0),
    vec3(-0.66, 0.73, 0),
    // vec3(-0.5, 0.3, 0),
    // vec3(-0.12,0.13, 0),
    // vec3(0.73,0.15, 0),
    // vec3(0.42,0.5, 0),
    // vec3(0.0, -0.7, 0),
  ];
  let segments2 = [
    makeSegment(points2[0], points2[1]),
    makeSegment(points2[2], points2[3]),
    // makeSegment(points2[4], points2[5])
  ];

  let points3 = [];
  {
    Math.seedrandom('8');
    let numRandom = 8;
    for (var i = 0; i < numRandom; ++i) {
      var p = vec3(Math.random()*2-1, Math.random()*2-1, 0);
      points3.push(p);
    }
  }
  let segments3 = [
    makeSegment(points3[0], points3[1]),
    makeSegment(points3[2], points3[3]),
    makeSegment(points3[4], points3[5]),
    makeSegment(points3[6], points3[7])
  ];

  let points4 = [
    vec3(-0.26, 0.73, 0),
    vec3(0.62, 0.37, 0),
    vec3(-0.12,0.13, 0),
    vec3(-0.30, -0.1, 0),
    vec3(0.73,-0.13, 0),
    vec3(-0.65, -0.15, 0),
  ];
  let segments4 = [];

  Math.seedrandom('3');
  let numRandom = 100;
  let points5 = [];
  for (var i = 0; i < numRandom; ++i) {
  	var p = vec3(Math.random()*2-1, Math.random()*2-1, 0);
  	points5.push(p);
  }
  let segments5 = [];

  datasets = {
    'dataset1' : { points:points1, segments:segments1 },
    'dataset2' : { points:points2, segments:segments2 },
    'dataset3' : { points:points3, segments:segments3 },
    'dataset4' : { points:points4, segments:segments4 },
    'dataset5' : { points:points5, segments:segments5 },
  };
}