#ifndef UTILS_HH
#define UTILS_HH

#include <vector>
#include "types.hh"
#include "math.hh"

std::vector<Event> createDataQueue(std::vector<Polygon> const& polygons);

std::vector<vec2> consolidate(std::vector<vec2> intersections, decimal_t pivotX);

////////////////////////////////////// Close Event Methods /////////////////////////

bool validDiff(decimal_t diff);

decimal_t getRadius(vec2 point, std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                  std::shared_ptr<Node> const& pr);
std::shared_ptr<vec2> getIntercept(std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pr, double directrix);

decimal_t getDiff(std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                  std::shared_ptr<Node> const& pr, vec2 p, double directrix);

vec2 chooseClosePoint(std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                  std::shared_ptr<Node> const& pr, double directrix);

std::shared_ptr<Event> createCloseEvent(std::shared_ptr<Node> const& pNode, double directrix);


#endif
