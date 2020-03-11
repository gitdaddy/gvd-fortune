#ifndef FORTUNE_HH
#define FORTUNE_HH

#include "types.hh"

#include <memory>
#include <string>

struct ComputeResult
{
  std::vector<Polygon> polygons;
  std::vector<std::pair<vec2, vec2>> edges;
  std::vector<std::vector<vec2>> curvedEdges;
  std::vector<std::vector<vec2>> b_edges;
  std::vector<std::vector<vec2>> b_curvedEdges;
};

// results with polygon path, edge path, beachline path
void writeResults(ComputeResult const& r, std::string const& pPath, std::string const& ePath, std::string const& bPath);
void writeResults(ComputeResult const& r, std::string const& ePath, std::string const& bPath);
void writeResults(ComputeResult const& r, std::string const& ePath);

std::shared_ptr<vec2> intersectStraightArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, double directrix);
std::shared_ptr<vec2> intersectParabolicToStraightArc(std::shared_ptr<Node> l, std::shared_ptr<Node> r, double directrix);
std::shared_ptr<vec2> intersectParabolicArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, double directrix);

std::shared_ptr<vec2> intersection(std::shared_ptr<Node> edge, double directrix);

ComputeResult fortune(std::vector<Event> queue, double const& sweepline, std::string& rMsg, std::string& rErr);

#endif
