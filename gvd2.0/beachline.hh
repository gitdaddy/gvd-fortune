#ifndef BEACHLINE_HH
#define BEACHLINE_HH

#include "types.hh"
#include "math.hh"

#include <memory>

/////////////////////////////////////// Beachline Methods ///////////////////////////

void add(std::shared_ptr<Node> const& pRoot, EventPacket const& packet);

void remove(std::shared_ptr<Node> const& pArcNode, vec2 point,
            double directrix, std::vector<std::shared_ptr<Node>> const& endingEdges);

vec2 intersection(std::shared_ptr<Node> edge, decimal_t directrix);

vec2 intersectStraightArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, decimal_t directrix);
vec2 intersectParabolicToStraightArc(std::shared_ptr<Node> l, std::shared_ptr<Node> r,
 bool isFlipped, bool isGeneral, decimal_t directrix);
vec2 intersectParabolicArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, decimal_t directrix);

#endif
