#ifndef UTILS_HH
#define UTILS_HH

#include <vector>
#include "types.hh"

std::vector<std::shared_ptr<Event>> createDataQueue(std::vector<Polygon> const& polygons);

#endif
