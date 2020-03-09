var fs = require('fs');

module.exports.readOutputFiles = function (fileData) {
  var rslt = {};
  var pFile = fileData["sites"];
  if (pFile) {
    var polygons = [];
    var lines = fs.readFileSync(pFile.trim(), 'utf-8').split('\n');
    var dataPoints = [];
    lines.forEach(line => {
      if (line.length === 0);
      else if (line[0] === 'p') {
        if (dataPoints.length !== 0){
          polygons.push({points: dataPoints});
          dataPoints = [];
        }
      } else {
        var p = line.split(" ");
        if (p.length != 2)
          throw "Invalid input data line:" + line;
        var newElem = {x: parseFloat(p[0]), y: parseFloat(p[1])};
        dataPoints.push(newElem);
      }
    });

    rslt.sites = JSON.stringify(polygons); // {polygons:[{points: [{}], fileId: ''}, ..]}
  }
  var eFile = fileData["edges"];
  if (eFile) {
    var edges = [];
    var lines = fs.readFileSync(eFile.trim(), 'utf-8').split('\n');
    var dataPoints = [];
    lines.forEach(line => {
      if (line.length === 0);
      else if (line[0] === 'e') {
        if (dataPoints.length !== 0){
          edges.push({points: dataPoints});
          dataPoints = [];
        }
      } else {
        var p = line.split(" ");
        if (p.length != 2)
          throw "Invalid line data line:" + line;
        var newElem = {x: parseFloat(p[0]), y: parseFloat(p[1])};
        dataPoints.push(newElem);
      }
    });

    rslt.edges = JSON.stringify(edges);// {edges:[{points: [{}], fileId: ''}, ..]}
  }
  var bFile = fileData["beachline"];
  if (bFile) {
    var arcs = [];
    var lines = fs.readFileSync(bFile.trim(), 'utf-8').split('\n');
    var dataPoints = [];
    lines.forEach(line => {
      if (line.length === 0);
      else if (line[0] === 'b') {
        if (dataPoints.length !== 0){
          arcs.push({points: dataPoints});
          dataPoints = [];
        }
      } else {
        var p = line.split(" ");
        if (p.length != 2)
          throw "Invalid line data line:" + line;
        var newElem = {x: parseFloat(p[0]), y: parseFloat(p[1])};
        dataPoints.push(newElem);
      }
    });

    rslt.beachline = JSON.stringify(arcs); // {arcs:[{points: [{}], fileId: ''}, ..]}
  }
  return rslt;
}
