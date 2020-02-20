#ifndef UTILS_HH
#define UTILS_HH

#include <vector>
#include "types.hh"

std::vector<Event> createDataQueue(std::vector<Polygon> const& polygons);

std::vector<vec2> consolidate(std::vector<vec2> intersections, decimal_t pivotX);

V createBeachlineSegmentV(Event site, double directrix, uint32_t id);
Parabola createBeachlineSegmentPara(Event site, double directrix, uint32_t id);
GeneralParabola createBeachlineSegmentGPara(Event site, double directrix, uint32_t id);

////////////////////////////////////// Close Event Methods /////////////////////////

bool validDiff(decimal_t diff);

decimal_t getDiff(std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                  std::shared_ptr<Node> const& pr, vec2 p, double directrix);

decimal_t getRadius(vec2 point, std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                  std::shared_ptr<Node> const& pr);

vec2 getIntercept(std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pr, double directrix);

vec2 chooseClosePoint(std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                  std::shared_ptr<Node> const& pr, double directrix);

std::shared_ptr<Event> createCloseEvent(std::shared_ptr<Node> const& pNode, double directrix);

#endif
