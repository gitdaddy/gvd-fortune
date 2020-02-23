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

  // ////////////////////////////////////// Close Event Methods /////////////////////////

  bool validDiff(decimal_t diff)
  {
    return diff > 2e-2;
  }

  decimal_t getRadius(vec2 point, std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                    std::shared_ptr<Node> const& pr)
  {
    if (pl->aType == ArcType_e::ARC_V && pNode->aType == ArcType_e::ARC_V && pr->aType == ArcType_e::ARC_V)
    {
      return std::min(
        std::min(math::distLine(point, pl->a, pl->b), math::distLine(point, pNode->a, pNode->b)),
        math::distLine(point, pr->a, pr->b));
    }
    if (pl->aType == ArcType_e::ARC_PARA)
      return math::dist(point, pl->point);
    else if (pNode->aType == ArcType_e::ARC_PARA)
      return math::dist(point, pNode->point);

    return math::dist(point, pr->point);
  }

  std::shared_ptr<vec2> getIntercept(std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pr, double directrix)
  {
    // TODO
    return std::make_shared<vec2>(0.0, 0.0);
  }

  decimal_t getDiff(std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                    std::shared_ptr<Node> const& pr, vec2 p, double directrix)
  {
    auto radius = getRadius(p, pl, pNode, pr);
    auto newY = p.y - radius;
    auto newYErrorMargin = p.y - (radius + 1e-13);
    // rule out points too far above the directrix
    if (newY > directrix && newYErrorMargin > directrix) return 1e10;

    // Option: or test that left and right intersection
    auto i0 = getIntercept(pl, pNode, newY);
    auto i1 = getIntercept(pNode, pl, newY);
    if (!i0 || !i1) return 1e10;
    auto diffX = std::abs(i0->x - i1->x);
    auto diffY = std::abs(i0->y - i1->y);
    return diffX + diffY;
  }

  vec2 chooseClosePoint(std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                  std::shared_ptr<Node> const& pr, double directrix)
  {
    // TODO
    return vec2(0.0, 0.0);
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

std::shared_ptr<Event> createCloseEvent(std::shared_ptr<Node> const& pNode, double directrix)
{
  return nullptr;
}

std::vector<Event> processCloseEvents(std::vector<std::shared_ptr<Node>> closingNodes, double directrix) 
{
  std::vector<Event> ret;
  for (auto&& n : closingNodes)
  {
    auto e = createCloseEvent(n, directrix);
    if (e)
      ret.push_back(*e);
  }

  return ret;
}
