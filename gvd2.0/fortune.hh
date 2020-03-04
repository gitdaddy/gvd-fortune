#ifndef FORTUNE_HH
#define FORTUNE_HH

#include "types.hh"

#include <memory>

struct ComputeResult
{
  std::vector<Polygon> polygons;
  std::vector<std::pair<vec2, vec2>> edges; 
  std::vector<std::vector<vec2>> curvedEdges;
  std::vector<std::pair<vec2, vec2>> b_edges; 
  std::vector<std::vector<vec2>> b_curvedEdges;
};

std::shared_ptr<vec2> intersectStraightArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, double directrix);
std::shared_ptr<vec2> intersectParabolicToStraightArc(std::shared_ptr<Node> l, std::shared_ptr<Node> r, double directrix);
std::shared_ptr<vec2> intersectParabolicArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, double directrix);

std::shared_ptr<vec2> intersection(std::shared_ptr<Node> edge, double directrix);

ComputeResult fortune(std::vector<Polygon> const& polygons, double sweepline);

#endif
