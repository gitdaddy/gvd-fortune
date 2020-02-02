#include <iostream>
#include <string>
#include <vector>

#include "types.hh"

namespace math
{
  double getEventY(Event const& e);

  std::vector<vec2> getPointsRightOfLine(vec2 const& a, vec2 const& b, std::vector<vec2> points);

  std::vector<vec2> getPointsLeftOfLine(vec2 const& a, vec2 const& b, std::vector<vec2> points);

  bool devidesRightOfLine(vec2 const& a1, vec2 const& b1, vec2 const& a2, vec2 const& b2);

  bool isRightOfLine(vec2 const& upper, vec2 const& lower, vec2 const& p);

  std::vector<double> quadratic(vec2 const& a, vec2 const& b, vec2 const& c);

  vec2 intersectLines(vec2 const& p1, vec2 const& p2, vec2 const& p3, vec2 const& p4);

  std::vector<double> intersectLeftRightLines (std::vector<Line> const& leftLines, std::vector<Line> const& rightLines);

  // TODO
  // std::vector<double> lpIntersect()
}