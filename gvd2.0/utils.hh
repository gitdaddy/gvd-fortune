#ifndef UTILS_HH
#define UTILS_HH

#include <vector>
#include "types.hh"
#include "math.hh"

std::vector<Event> createDataQueue(std::vector<Polygon> const& polygons);

std::vector<vec2> consolidate(std::vector<vec2> intersections, decimal_t pivotX);

////////////////////////////////////// Close Event Methods /////////////////////////

std::shared_ptr<Event> createCloseEvent(std::shared_ptr<Node> const& pNode, double directrix);

std::vector<Event> processCloseEvents(std::vector<std::shared_ptr<Node>> closingNodes, double directrix);

#endif
