#ifndef BEACHLINE_HH
#define BEACHLINE_HH

#include "types.hh"
#include "math.hh"

#include <memory>


// node.js beachline.js closeEvent.js nodeInsert.js

///////////////////////////////////// Node Insert Methods //////////////////////////

std::shared_ptr<Node> generateSubTree(EventPacket const& packet, std::shared_ptr<Node> pNode, std::shared_ptr<Node> optChild = nullptr);


std::vector<vec2> consolidate(std::vector<vec2> intersections, decimal_t pivotX);

/////////////////////////////////////// Beachline Methods ///////////////////////////

V createBeachlineSegmentV(Event site, double directrix, uint32_t id);
Parabola createBeachlineSegmentPara(Event site, double directrix, uint32_t id);
GeneralParabola createBeachlineSegmentGPara(Event site, double directrix, uint32_t id);

void add(std::shared_ptr<Node> const& pRoot, EventPacket const& packet);

void remove(std::shared_ptr<Node> const& pArcNode, vec2 point,
            double directrix, std::vector<std::shared_ptr<Node>> const& endingEdges);

// prepDraw?

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
