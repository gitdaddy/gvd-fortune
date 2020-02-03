#include "dataset.hh"
#include "math.hh"
#include "types.hh"

#include <algorithm>
#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <vector>

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

  bool isColinear(vec2 const& p1,vec2 const& p2, vec2 const& p3, std::shared_ptr<double> pOptTolerance = nullptr)
  {
    auto v1 = vec2(p2.x - p1.x, p2.y - p1.y);
    auto v2 = vec2(p3.x - p1.x, p3.y - p1.y);
    auto c = math::crossProduct(v1, v2);
    if (pOptTolerance)
    {
      return std::abs(c) < *pOptTolerance;
    }

    return c == 0;
  }

  std::vector<size_t> getMatch(std::vector<vec2> const& dataPoints)
  {
    for (size_t i = 1; i < dataPoints.size(); i++)
    {
      if (math::equivD(dataPoints[i].y, dataPoints[i-1].y))
        return { i-1, i };
    }
    return {};
  }

  double getOffsetValue(std::vector<vec2> const& dataPoints, std::vector<size_t> const& match)
  {
    auto xDiff = std::abs(dataPoints[match[0]].x - dataPoints[match[0]].x);
    auto value = xDiff * 0.007;
    if (value == 0.0) {return 1e-6;}
    return value;
  }

  RemovedResult removeColinearPoints(std::vector<vec2>& orderedPoints, std::shared_ptr<double> pOptTolerance = nullptr)
  {
    bool didRemove = false;
    vec2 finalPoint = orderedPoints[orderedPoints.size() - 1];
    std::vector<size_t> toRemove;
    // remove the last element since it is a circular list
    std::vector<vec2> rslt(orderedPoints.begin(), orderedPoints.end() - 1);

    for (size_t i = 0; i < rslt.size(); i++) {
      bool start = i == 0 ? rslt.size()-1 : i-1;
      auto p1 = rslt[start];
      auto p2 = rslt[i];
      auto p3 = rslt[(i+1)%rslt.size()]; // 2,3,0
      if (isColinear(p1, p2, p3, pOptTolerance))
      {
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
    // add the start/end point if it does not create a colinear line
    if (isColinear(orderedPoints[orderedPoints.size()], finalPoint, orderedPoints[0]))
      orderedPoints.push_back(finalPoint);
    return {didRemove, orderedPoints};
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

std::vector<vec2> sanitizeData(std::vector<vec2> orderedPoints, std::shared_ptr<double> pOptTolerance = nullptr)
{
  if (orderedPoints.size() > 3)
  {
    orderedPoints = removeCAS(orderedPoints, pOptTolerance);
  }

  auto match = getMatch(orderedPoints);
  while(match.size() > 0)
  {
    orderedPoints[match[0]].y -= getOffsetValue(orderedPoints, match);
    match = getMatch(orderedPoints);
  }
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
