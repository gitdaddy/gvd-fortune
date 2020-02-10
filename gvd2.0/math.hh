#ifndef MATH_HH
#define MATH_HH

#include <cmath>
#include <iostream>
#include <limits>
#include <memory>
#include <string>
#include <vector>

#include "types.hh"

namespace math
{
  constexpr double pi() { return std::atan(1)*4; }
  // Math data types

  decimal_t getEventY(Event const& e);

  // MV.js Functions
  decimal_t crossProduct(vec2 const& v1, vec2 const& v2);

  inline decimal_t dot(vec2 const &a, vec2 const &b)
  {
    return a.x*b.x + a.y*b.y;
  }
  inline decimal_t len(vec2 const &v) { return std::sqrt(dot(v,v)); }

  inline vec2 normalize(vec2 v)
  {
    auto r = len(v);
    return vec2(v.x/r, v.y/r);
  }

  inline vec2 negate(vec2 const& u)
  {
    return vec2(-u.x, -u.y);
  }

  inline double radians (int degrees)
  {
    return degrees * pi() / 180.0;
  }

  inline int radians (double radians)
  {
    return radians * 180 / pi();
  }

  struct Line
  {
    Line(vec2 const &a, vec2 const &b) : p1(a), p2(b), v(math::normalize(vec2(b.x - a.x, b.y - a.y)))
    {}

    vec2 p1;
    vec2 p2;
    vec2 v;
  };

  inline bool equivD(decimal_t a, decimal_t b, decimal_t error_factor=1.0)
  {
    return a==b ||
      std::abs(a-b)<std::abs(std::min(a,b))*std::numeric_limits<decimal_t>::epsilon()*
                    error_factor;
  }

  inline bool equiv2(vec2 const& a, vec2 const& b)
  {
    return equivD(a.x, b.x) && equivD(a.y, b.y);
  }

  std::vector<vec4> rotateZ(uint32_t theta);

  vec4 mult(std::vector<vec4> const& matrix, vec4 const& v4);

  bool isRightOfLine(vec2 const& upper, vec2 const& lower, vec2 const& p);

  std::vector<vec2> getPointsRightOfLine(vec2 const& a, vec2 const& b, std::vector<vec2> points);

  std::vector<vec2> getPointsLeftOfLine(vec2 const& a, vec2 const& b, std::vector<vec2> points);

  bool devidesRightOfLine(vec2 const& a1, vec2 const& b1, vec2 const& a2, vec2 const& b2);

  std::vector<decimal_t> quadratic(decimal_t const& a, decimal_t const& b, decimal_t const& c);

  std::shared_ptr<vec2> intersectLines(vec2 const& p1, vec2 const& p2, vec2 const& p3, vec2 const& p4);

  std::vector<vec2> intersectLeftRightLines (std::vector<Line> const& leftLines, std::vector<Line> const& rightLines);

  std::vector<decimal_t> lpIntersect(decimal_t h, decimal_t k, decimal_t p, vec2 const& q, vec2 const& v);

  std::vector<vec2> ppIntersect(decimal_t h1, decimal_t k1, decimal_t p1, decimal_t h2, decimal_t k2, decimal_t p2);
}

#endif