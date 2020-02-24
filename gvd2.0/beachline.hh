#ifndef BEACHLINE_HH
#define BEACHLINE_HH

#include "types.hh"
#include "math.hh"

#include <memory>

std::shared_ptr<vec2> intersectStraightArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, double directrix);
std::shared_ptr<vec2> intersectParabolicToStraightArc(std::shared_ptr<Node> l, std::shared_ptr<Node> r,
 bool isFlipped, double directrix);
std::shared_ptr<vec2> intersectParabolicArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, double directrix);

std::shared_ptr<vec2> intersection(std::shared_ptr<Node> edge, double directrix);

////////////////////////////////////// Close Event Methods /////////////////////////

// std::shared_ptr<Event> createCloseEvent(std::shared_ptr<Node> const& arcNode, double directrix);

std::vector<Event> processCloseEvents(std::vector<std::shared_ptr<Node>> closingNodes, double directrix);

/////////////////////////////////////// Beachline methods ////////////////////
std::vector<Event> add(std::shared_ptr<Node> const& pChild, EventPacket const& packet);

std::vector<Event> remove(std::shared_ptr<Node> const& arcNode, vec2 point,
            double directrix, std::vector<std::shared_ptr<Node>> const& endingEdges);

#endif
