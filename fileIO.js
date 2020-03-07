var fs = require('fs');

module.exports.readOutputFiles = function (fileData) {
  var pFile = fileData["sites"];
  if (pFile) {
    var json = {};
    var polygons = [];
    var lines = fs.readFileSync(pFile.trim(), 'utf-8').split('\n');
    var dataPoints = [];
    lines.forEach(line => {
      // comments don't need to be processed
      if (line[0] === 'p') {
        if (dataPoints.length !== 0){
          polygons.push({points: dataPoints});
          dataPoints = [];
        }
      } else {
        var p = input.split(" ");
        if (p.length != 2)
          throw "Invalid input data line:" + input;
        var newElem = {x: parseFloat(p[0]), y: parseFloat(p[1])};
        dataPoints.push(newElem);
      }
    });

    json.polygons = polygons;
    fileData["sites"].data = JSON.stringify(json); // {polygons:[{points: [{}], fileId: ''}, ..]}
  }
  var eFile = fileData["edges"];
  if (eFile) {
    var json = {};
    var edges = [];
    var lines = fs.readFileSync(eFile.trim(), 'utf-8').split('\n');
    var dataPoints = [];
    lines.forEach(line => {
      // comments don't need to be processed
      if (line[0] === 'e') {
        if (dataPoints.length !== 0){
          polygons.push({points: dataPoints});
          dataPoints = [];
        }
      } else {
        var p = input.split(" ");
        if (p.length != 2)
          throw "Invalid input data line:" + input;
        var newElem = {x: parseFloat(p[0]), y: parseFloat(p[1])};
        dataPoints.push(newElem);
      }
    });

    json.edges = polygons;
    fileData["edges"].data = JSON.stringify(json);// {edges:[{points: [{}], fileId: ''}, ..]}
  }
  var bFile = fileData["beachline"];
  if (bFile) {
    var json = {};
    var arcs = [];
    var lines = fs.readFileSync(bFile.trim(), 'utf-8').split('\n');
    var dataPoints = [];
    lines.forEach(line => {
      // comments don't need to be processed
      if (line[0] === 'b') {
        if (dataPoints.length !== 0){
          polygons.push({points: dataPoints});
          dataPoints = [];
        }
      } else {
        var p = input.split(" ");
        if (p.length != 2)
          throw "Invalid input data line:" + input;
        var newElem = {x: parseFloat(p[0]), y: parseFloat(p[1])};
        dataPoints.push(newElem);
      }
    });

    json.arcs = polygons;
    fileData["beachline"].data = JSON.stringify(json); // {arcs:[{points: [{}], fileId: ''}, ..]}
  }
  return fileData;
}
