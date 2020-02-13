#ifndef MATH_HH
#define MATH_HH

#include <cmath>
#include <iostream>
#include <limits>
#include <memory>
#include <string>
#include <vector>
#include <algorithm>

#include "types.hh"

namespace math
{
  constexpr double pi() { return std::atan(1)*4; }

  decimal_t getEventY(Event const& e);

  // return the z component between the two vectors
  decimal_t crossProduct(vec2 const& v1, vec2 const& v2);

  inline decimal_t dot(vec2 const &a, vec2 const &b)
  {
    return a.x*b.x + a.y*b.y;
  }
  inline decimal_t length(vec2 const &v) { return std::sqrt(dot(v,v)); }

  inline vec2 normalize(vec2 v)
  {
    auto r = length(v);
    return vec2(v.x/r, v.y/r);
  }

  inline vec2 subtract(vec2 const& v1, vec2 const& v2)
  {
    return vec2(v1.x - v2.x, v1.y - v2.y);
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

  inline decimal_t parabola_f(decimal_t x, decimal_t h, decimal_t k, decimal_t p)
  {
    return (x - h) * (x - h) / (4 * p) + k;
  }

  // either a line or a point segment bisector
  struct Bisector
  {
    bool isLine;
    std::shared_ptr<GeometricObject> optGeneralParabola;
    vec2 p1;
    vec2 p2;
    vec2 v;
  };

  inline Bisector createLine(vec2 p1, vec2 p2)
  {
    return {true, nullptr, p1, p2, math::normalize(vec2(p2.x - p1.x, p2.y - p1.y))};
  }

  inline Bisector createGeneralBisector(vec2 focus, vec2 a, vec2 b)
  {
    GeometricObject g(GeometryType_e::GEN_PARABOLA, g_id++);
    auto v = normalize(vec2(b.x - a.x, b.y - a.y));
    auto v1 = vec2(focus.x - a.x, focus.y - a.y);
    auto z = crossProduct(v, v1);
    if (z < 0)
    {
      v = negate(v);
      z = -z;
    }
    g.focus = focus;
    g.k = z / 2.0;
    g.p = g.k;
    g.h = focus.x;
    g.theta = std::atan2(v.y, v.x);
    // splitSite = _.get(focus, "label") != _.get(directrix, "label");
    return {false,
            std::make_shared<GeometricObject>(g),
            vec2(0.0, 0.0), vec2(0.0, 0.0), vec2(0.0, 0.0)};
  }

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

  inline decimal_t dist(vec2 a, vec2 b)
  {
    return length(vec2(a.x - b.x, a.y - b.y));
  }

  std::vector<vec4> rotateZ(uint32_t theta);

  vec4 mult(std::vector<vec4> const& matrix, vec4 const& v4);

  bool isRightOfLine(vec2 const& upper, vec2 const& lower, vec2 const& p);

  std::vector<vec2> getPointsRightOfLine(vec2 const& a, vec2 const& b, std::vector<vec2> points);

  std::vector<vec2> getPointsLeftOfLine(vec2 const& a, vec2 const& b, std::vector<vec2> points);

  bool dividesRightOfLine(vec2 const& a1, vec2 const& b1, vec2 const& a2, vec2 const& b2);

  std::vector<decimal_t> quadratic(decimal_t const& a, decimal_t const& b, decimal_t const& c);

  std::shared_ptr<vec2> intersectLines(vec2 const& p1, vec2 const& p2, vec2 const& p3, vec2 const& p4);

  std::vector<vec2> intersectLeftRightLines (std::vector<Bisector> const& leftLines, std::vector<Bisector> const& rightLines);

  std::vector<decimal_t> lpIntersect(decimal_t h, decimal_t k, decimal_t p, vec2 const& q, vec2 const& v);

  std::vector<vec2> ppIntersect(decimal_t h1, decimal_t k1, decimal_t p1, decimal_t h2, decimal_t k2, decimal_t p2);

  inline bool betweenValue(decimal_t t, decimal_t a, decimal_t b)
  {
    std::vector<decimal_t> v = {a, b};
    std::sort(v.begin(), v.end());
    return v[0] <= t && t <= v[1];
  }

  double getAngle(Event s, bool consider_order=true);

  // Does the vector v separate p1 and p2 from starting at origin
  bool dividesPoints(vec2 v, vec2 origin, vec2 p1, vec2 p2);

  bool fallsInBoundary(vec2 A, vec2 B, vec2 point);

  std::vector<vec2> filterVisiblePoints(Event const& site, std::vector<vec2> const& points);

  bool intersectsTargetSegments(Event const& s1, Event const& s2);

  inline double getAngleBetweenTwoVec(vec2 v1, vec2 v2)
  {
    auto d = dot(v1, v2);
    auto m1 = std::sqrt(v1.x * v1.x + v1.y * v1.y);
    auto m2 = std::sqrt(v2.x * v2.x + v2.y * v2.y);
    return std::acos(d/m1*m2);
  }

  inline std::shared_ptr<vec2> connected(Event const& s1, Event const& s2)
  {
    if (equiv2(s1.a, s2.a) || equiv2(s1.a, s2.b)) {
      return std::make_shared<vec2>(s1.a);
    }
    else if (equiv2(s1.b, s2.a) || equiv2(s1.b, s2.b))
    {
      return std::make_shared<vec2>(s1.b);
    }
    return nullptr;
  }

  Bisector bisectPointSegment(vec2 p, vec2 a, vec2 b);

  double getSegmentsBisectorAngle(Event const& s, Event const& t);

  Bisector bisectPoints(vec2 p1, vec2 p2);

  Bisector smallAngleBisectSegments(Event s1, Event s2, std::shared_ptr<vec2> optIntersect = nullptr);
  std::vector<Bisector> bisectSegments2(Event const& s1, Event const& s2);
  // std::vector<Bisector> bisectSegments4(Event const& s1, Event const& s2, Event const& s3);

  inline bool parallelTest(Event const& s1, Event const& s2)
  {
    auto l1 = createLine(s1.a, s1.b);
    auto l2 = createLine(s2.a, s2.b);
    return equiv2(l1.v, l2.v);
  }

  inline Bisector getAverage(Event const& s1, Event const& s2)
  {
    auto p1 = vec2(((s1.a.x + s2.a.x) / 2.0), ((s1.a.y + s2.a.y) / 2.0));
    auto p2 = vec2(((s1.b.x + s2.b.x) / 2.0), ((s1.b.y + s2.b.y) / 2.0));
    return createLine(p1, p2);
  }

  Bisector bisect(Event const& e1, Event const& e2);

  std::vector<vec2> intersect(Bisector const& a, Bisector const& b);

  std::vector<vec2> equidistant(Event const& a, Event const& b, Event const& c);
}

#endif