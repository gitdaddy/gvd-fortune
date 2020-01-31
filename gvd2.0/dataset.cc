#include "dataset.hh"

#include <algorithm>
#include <fstream>
#include <vector>
#include <sstream>
#include <memory>

namespace
{
  /////////////////////////// Helper Functions //////////////////////////////////////////

  std::vector<std::string> split(const std::string& s, char delimiter)
  {
    std::vector<std::string> tokens;
    std::string token;
    std::istringstream tokenStream(s);
    while (std::getline(tokenStream, token, delimiter))
    {
        tokens.push_back(token);
    }
    return tokens;
  }

  vec2 parseLineToVec2(std::string const& s)
  {
    auto t = split(s, ' ');
    return {std::stod(t[0]), std::stod(t[1])};
  }

  struct RemovedResult
  {
    bool removed;
    std::vector<vec2> points;
  };

  RemovedResult removeColinearPoints(std::vector<vec2> const& orderedPoints, std::shared_ptr<double> pOptTolerance = nullptr)
  {
    bool didRemove = false;
    vec2 finalPoint = orderedPoints[orderedPoints.size() - 1];
    std::vector<size_t> toRemove;
    // remove the last element since it is a circular list
    std::vector<vec2> rslt(orderedPoints.begin(), orderedPoints.end() - 1);

    // if (orderedPoints[0].x == orderedPoints[orderedPoints.length-1].x
    //   && orderedPoints[0].y == orderedPoints[orderedPoints.length-1].y)
    // {
    //   orderedPoints.splice(orderedPoints.length-1, 1);
    // }

    // order points should now be a unique set of points
    // orderedPoints = _.uniqWith(orderedPoints, _.isEqual); // TODO performance

    for (size_t i = 0; i < rslt.size(); i++) {
      bool start = i == 0 ? rslt.size()-1 : i-1;
      auto p1 = rslt[start];
      auto p2 = rslt[i];
      auto p3 = rslt[(i+1)%rslt.size()]; // 2,3,0
      if (isColinear(p1, p2, p3, optTolerance)) {
        if (p1.y < p2.y && p1.y > p3.y || p1.y > p2.y && p1.y < p3.y) // p1
          toRemove.push_back(start);
        else if (p1.y < p2.y && p1.y > p3.y || p1.y > p2.y && p1.y < p3.y) // p2
          toRemove.push_back(i);
        else // use p3
          toRemove.push_back((i+1)%rslt.size());
      }
    }

    if (toRemove.size() > 0) {
      std::vector<vec2> afterRemove;
      for (size_t j = 0; j < rslt.size(); ++j)
      {
        if (std::find(toRemove.begin(), toRemove.end(), j) == toRemove.end())
        {
          // does not contain j
          afterRemove.push_back(rslt[j]);
        }
      }
      didRemove = true;
    }
    // place the ending back on
    // orderedPoints.push(orderedPoints[0]);
    // add the start/end point if it does not create a colinear line
    return {removed: didRemove, points: orderedPoints};
  }

  std::vector<vec2> removeCAS(std::vector<vec2> points, std::shared_ptr<double> pOptTolerance = nullptr)
  {
    auto rslt = removeColinearPoints(points, pOptTolerance);
    while(rslt.removed)
    {
      rslt = removeColinearPoints(points, pOptTolerance);
    }
    return rslt.points;
  }
}

SegmentSite makeSegment(vec2 p1, vec2 p2, uint32_t label, bool forceOrder)
{
  // check for p1.y == p2.y?
  // TESTING ONLY
  if (p1.y == p2.y) throw std::runtime_error("Horizontal segment detected");

  if (forceOrder)
  {
    return SegmentSite(label, p1, p2);
  }
  return p1.y > p2.y ? SegmentSite(label, p1, p2) : SegmentSite(label, p2, p1);
}

std::vector<vec2> sanitizeData(std::vector<vec2> orderedPoints, std::shared_ptr<double> pOptTolerance = nullptr)
{
  if (orderedPoints.size() > 3)
  {
    orderedPoints = removeCAS(orderedPoints, pOptTolerance);
  }

  // TODO Horizontal adjust
  return orderedPoints;
}

std::vector<Polygon> processInputFiles(std::string const& inputFiles)
{
  std::ifstream fin(inputFiles.c_str());

  // each file is a single polygon, line, or point
  std::vector<Polygon> polygons;
  std::string filePath;
  while(fin >> filePath)
  {
    // trim?
    // each file of format
    // xxxxx yyyyyyy - p1
    // xxxxx yyyyyyy...
    // xxxxx yyyyyyy - p1
    std::ifstream file(filePath.c_str());
    std::string line;
    std::vector<std::string> lines;
    while (std::getline(file, line))
    {
      lines.push_back(line);
    }

    std::vector<vec2> points;
    for (size_t i = 1; i < lines.size(); ++i)
    {
      points.push_back(parseLineToVec2(lines[i]));
    }

    sanitizeData(points);

    Polygon poly;
    auto p1 = points[0];
    poly.addPoint(p1);

    for (size_t i = 1; i < points.size() - 1; ++i)
    {
      auto p2 = points[i];
      poly.addPoint(p2);
      poly.addSegment(p1,p2);
      p1 = p2;
    }

    // terminate the wrap around
    poly.addSegment(points[0], p1);

    polygons.push_back(poly);
  }
  // TESTING ONLY
  std::cout << "Num Polygons:" << polygons.size() << std::endl;
  return polygons;
}

// void processInputMap(std::string const& /* inputMap */)
// {
//   std::cout << "processing input map\n";
//     // TODO process map
// }
