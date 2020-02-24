#ifndef UTILS_HH
#define UTILS_HH

#include <vector>
#include "types.hh"
#include "math.hh"

std::vector<Event> createDataQueue(std::vector<Polygon> const& polygons);

std::vector<vec2> consolidate(std::vector<vec2> intersections, decimal_t pivotX);

#endif
