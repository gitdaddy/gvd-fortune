#include "utils.hh"
#include "math.hh"

#include <algorithm>
#include <iostream>
#include <map>

namespace
{
  // offset sites that collide or overlap
  void sanitizePointSiteData(std::vector<Event>& rPts)
  {
    for (size_t i = 1; i < rPts.size(); i++)
    {
      auto p1 = rPts[i-1].point;
      auto p2 = rPts[i].point;
      if (math::equiv2(p1, p2))
      {
        rPts[i].point.y -= 0.0001;
      }
    }
  }

  Polygon getPolyByLabel(uint32_t label, std::vector<Polygon> const& polygons)
  {
    auto f = std::find_if(polygons.begin(), polygons.end(), [label](Polygon poly){
      if (label == poly.getLabel())
        return true;
    });
    if (f != polygons.end())
      return (*f);

    throw std::runtime_error("failed to locate polygon with label:" + std::to_string(label));
    return Polygon();
  }
}

std::vector<Event> createDataQueue(std::vector<Polygon> const& polygons)
{
  std::vector<Event> rslt;
  std::vector<Event> points;
  for (auto&& p : polygons)
  {
    // auto toAdd = p.getPointSites();
    // points.insert(points.end(), toAdd.begin(), toAdd.end());
    for (auto s : p.orderedPointSites)
    {
      points.push_back(s);
    }
  }

  std::cout << "sorting points size:" << points.size() << std::endl;
  std::sort(points.begin(), points.end(), event_less_than());
  std::cout << "sorted points\n";
  // sanitize across sites
  sanitizePointSiteData(points);

  std::map<uint32_t, std::vector<Event>> generatedSegs;
  for(auto&& sortedP : points)
  {
    std::vector<Event> ss;
    if (generatedSegs.find(sortedP.label) != generatedSegs.end())
    {
      ss = generatedSegs.at(sortedP.label);
    }
    else
    {
      auto poly = getPolyByLabel(sortedP.label, polygons);
      ss = poly.getSegments();
      generatedSegs.emplace(sortedP.label, ss);
    }

    std::vector<Event> connectedSegs;
    std::copy_if(ss.begin(), ss.end(), std::back_inserter(connectedSegs),
    [v = sortedP.point](auto s){return math::equiv2(s.a, v);});

    if (!connectedSegs.empty())
    {
      if (connectedSegs.size() == 2)
      {
        // add the segments if order of left to right
        if (math::isRightOfLine(connectedSegs[0].a, connectedSegs[0].b, connectedSegs[1].b))
        {
          rslt.push_back(connectedSegs[0]);
          rslt.push_back(connectedSegs[1]);
        }
        else
        {
          rslt.push_back(connectedSegs[1]);
          rslt.push_back(connectedSegs[0]);
        }
      }
      else
      {
        rslt.push_back(connectedSegs[0]);
      }
    }
    rslt.push_back(sortedP);
  }
  return rslt;
}

std::vector<vec2> consolidate(std::vector<vec2> const& intersections, decimal_t pivotX) {
  std::vector<vec2> ret;
  // WATCH VALUE
  auto thresh = 0.000001;
  std::vector<vec2> left;
  std::vector<vec2> right;
  for (auto&& i : intersections)
  {
    if (i.x < pivotX)
      left.push_back(i);
    else if (i.x > pivotX)
      right.push_back(i);
  }

  if (left.size() == 2)
  {
    auto d = math::dist(left[0], left[1]);
    if (d < thresh)
      ret.push_back(left[0]);
    else
    {
      ret.push_back(left[0]);
      ret.push_back(left[1]);
    }
  }
  else if (left.size() == 1)
    ret.push_back(left[0]);

  if (right.size() == 2)
  {
    auto d = math::dist(right[0], right[1]);
    if (d < thresh)
      ret.push_back(right[0]);
    else
    {
      ret.push_back(right[0]);
      ret.push_back(right[1]);
    }
  }
  else if (right.size() == 1)
    ret.push_back(right[0]);
  return ret;
}

