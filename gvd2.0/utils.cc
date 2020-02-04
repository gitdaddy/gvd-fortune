#include "utils.hh"
#include "math.hh"

#include <algorithm>
#include <iostream>
#include <map>

namespace
{
  // offset sites that collide or overlap
  void sanitizePointSiteData(std::vector<std::shared_ptr<PointSite>> const& sortedPts)
  {
    for (size_t i = 1; i < sortedPts.size(); i++)
    {
      auto p1 = sortedPts[i-1]->getValue();
      auto p2 = sortedPts[i]->getValue();
      if (math::equiv2(p1, p2))
      {
        sortedPts[i]->addToY(-0.0001);
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

std::vector<std::shared_ptr<Event>> createDataQueue(std::vector<Polygon> const& polygons)
{
  std::vector<std::shared_ptr<Event>> rslt;
  std::vector<std::shared_ptr<PointSite>> points;
  for (auto&& p : polygons)
  {
    auto toAdd = p.getPointSites();
    points.insert(points.end(), toAdd.begin(), toAdd.end());
  }

  // sanitize across sites
  std::sort(points.begin(), points.end(), point_site_less_than());
  sanitizePointSiteData(points);

  std::map<uint32_t, std::vector<std::shared_ptr<Event>>> generatedSegs;
  for(auto&& sortedP : points)
  {
    std::vector<std::shared_ptr<Event>> ss;
    if (generatedSegs.find(sortedP->getLabel()) != generatedSegs.end())
    {
      ss = generatedSegs.at(sortedP->getLabel());
    }
    else
    {
      auto poly = getPolyByLabel(sortedP->getLabel(), polygons);
      ss = poly.getSegments();
      generatedSegs.emplace(sortedP->getLabel(), ss);
    }

    std::vector<std::shared_ptr<Event>> connectedSegs;
    std::copy_if(ss.begin(), ss.end(), std::back_inserter(connectedSegs),
    [sortedP](auto pSeg){return math::equiv2(pSeg->a(), sortedP->getValue());});

    // if (!connectedSegs.empty()) {
    //   if (connectedSegs.size() == 2) {
    //     if (isRightOfLine(connectedSegs[0]->a(), connectedSegs[0]->b(), connectedSegs[1]->b())) {
    //       rslt.push_back(segs[0]);
    //       rslt.push(segs[1]);
    //     } else {
    //       rslt.push(segs[1]);
    //       rslt.push(segs[0]);
    //     }
    //   } else {
    //     rslt.push(segs[0]);
    //   }
    // }
    // rslt.push(p);
  }
  // get all points and segments

}


// void processNewDataset(std::vector<Polygon> const& polygons)
// {
//   // var segments = [];
//   // var points = [];
//   // g_polygons.forEach(function(poly) {
//   //   segments = segments.concat(poly.segments);
//   //   points = points.concat(poly.points);
//   // });

//   // sanitizePointSiteData(g_polygons);

//   // drawSites(points);
//   // drawSegments(segments);

//   // var t1 = performance.now();
//   // var processTime = t1 - t0;
//   // console.log("Pre-process time:" + processTime.toFixed(6) + "(ms)");
//   // render();
//   // updateOverview();
//   std::vector<vec2> sortedYMPoints;
//   for (auto& rPoly : polygons)
//   {

//     sortedYMPoints.insert(sortedYMPoints.end(),
//     )
//   }
// }
