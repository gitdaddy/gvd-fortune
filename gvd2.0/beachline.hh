#ifndef BEACHLINE_HH
#define BEACHLINE_HH

#include "types.hh"
#include "math.hh"

#include <memory>

std::shared_ptr<vec2> intersectStraightArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, decimal_t directrix);
std::shared_ptr<vec2> intersectParabolicToStraightArc(std::shared_ptr<Node> l, std::shared_ptr<Node> r,
 bool isFlipped, decimal_t directrix);
std::shared_ptr<vec2> intersectParabolicArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, decimal_t directrix);

std::shared_ptr<vec2> intersection(std::shared_ptr<Node> edge, decimal_t directrix);

std::vector<Event> add(std::shared_ptr<Node> const& pChild, EventPacket const& packet);

std::vector<Event> remove(std::shared_ptr<Node> const& arcNode, vec2 point,
            double directrix, std::vector<std::shared_ptr<Node>> const& endingEdges);

#endif
