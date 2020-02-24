#ifndef UTILS_HH
#define UTILS_HH

#include <vector>
#include <set>
#include "types.hh"
#include "math.hh"

std::set<Event, math::event_less_than> createDataQueue(std::vector<Polygon> const& polygons);

// inline void sortedInsertion(std::vector<Event>& rQueue, Event const& newEvent)
// {
//   // std::sort(points.begin(), points.end(), event_less_than());

//   // var idx = _.sortedIndexBy(queue, newEvent, function(event) { return getEventY(event); });

//   // // insert the new event in order or on top
//   // if (idx === -1) {
//   //   queue.push(newEvent);
//   // } else {
//   //   queue.splice(idx, 0, newEvent);
//   // }
// }

#endif
