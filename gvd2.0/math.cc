#include "math.hh"

namespace math
{
  decimal_t getEventY(Event const& e)
  {
    if (e.type == EventType_e::POINT)
    {
      return e.point.y;
    }
    else if (e.type == EventType_e::SEG)
    {
      return e.a.y;
    }
    // else is a close event
    return e.point.y;
  }

  decimal_t crossProduct(vec2 const& v1, vec2 const& v2)
  {
    return v1.x * v2.y - v1.y * v2.x;
  }

  std::vector<vec4> rotateZ(int theta)
  {
    auto rad = radians(theta);
    // double c = 0.0;
    // if ( std::abs(theta) == 90)
    //   c = 0.0;
    // else
    //   c = std::cos(rad);
    auto c = std::cos(rad);
    auto s = std::sin(rad);
    return {vec4( c,   -s, 0.0, 0.0),
            vec4( s,    c, 0.0, 0.0),
            vec4(0.0, 0.0, 1.0, 0.0),
            vec4(0.0, 0.0, 0.0, 1.0) };
  }

  bool isRightOfLine(vec2 const& upper, vec2 const& lower, vec2 const& p)
  {
    auto v1 = vec2(upper.x - lower.x, upper.y - lower.y);
    auto v2 = vec2(p.x - lower.x, p.y - lower.y);
    auto z = crossProduct(v1, v2);
    return z < 0;
  }

  std::vector<vec2> getPointsRightOfLine(vec2 const& a, vec2 const& b, std::vector<vec2> points)
  {
    std::vector<vec2> rslt;
    for (auto&& p : points)
    {
      if (isRightOfLine(a,b,p))
        rslt.push_back(p);
    }
    return rslt;
  }

  std::vector<vec2> getPointsLeftOfLine(vec2 const& a, vec2 const& b, std::vector<vec2> points)
  {
    std::vector<vec2> rslt;
    for (auto&& p : points)
    {
      if (!isRightOfLine(a,b,p))
        rslt.push_back(p);
    }
    return rslt;
  }

  bool devidesRightOfLine(vec2 const& a1, vec2 const& b1, vec2 const& a2, vec2 const& b2)
  {
    return isRightOfLine(a1, b1, a2) && isRightOfLine(a1, b1, b2);
  }


  std::vector<decimal_t> quadratic(decimal_t const& a, decimal_t const& b, decimal_t const& c)
  {
    decimal_t thresh = 1e-3;
    if (a == 0.0) return {0.0};
    auto disc = b * b - 4 * a * c;
    if (disc < -thresh) {
      return {};
    }
    if (std::abs(disc) < thresh) {
      return {(-b)/(2*a)};
    }
    auto sdisc = std::sqrt(disc);
    return {(-b+sdisc)/(2*a), (-b-sdisc)/(2*a)};
  }

  std::shared_ptr<vec2> intersectLines(vec2 const& p1, vec2 const& p2, vec2 const& p3, vec2 const& p4)
  {
    auto x1 = p1.x;
    auto x2 = p2.x;
    auto x3 = p3.x;
    auto x4 = p4.x;
    auto y1 = p1.y;
    auto y2 = p2.y;
    auto y3 = p3.y;
    auto y4 = p4.y;
    auto denom = (x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
    // originally 1e-6 but more precision has been needed
    if (std::abs(denom) < 1e-14){
      return nullptr;
    }
    auto x = ((x1*y2-y1*x2)*(x3-x4) - (x1-x2)*(x3*y4-y3*x4))/denom;
    auto y = ((x1*y2-y1*x2)*(y3-y4) - (y1-y2)*(x3*y4-y3*x4))/denom;
    return std::make_shared<vec2>(x, y);
  }

  std::vector<vec2> intersectLeftRightLines (std::vector<Line> const& leftLines, std::vector<Line> const& rightLines)
  {
    std::vector<vec2> result;
    for (auto&& ll : leftLines)
    {
      for (auto&& rl : rightLines)
      {
        auto pOptIntersect = intersectLines(ll.p1, ll.p2, rl.p1, rl.p2);
        if (pOptIntersect)
        {
          result.push_back(*pOptIntersect.get());
        }
      }
    }
    return result;
  }

  std::vector<decimal_t> lpIntersect(decimal_t h, decimal_t k, decimal_t p, vec2 const& q, vec2 const& v)
  {
    auto a = v.x * v.x / (4 * p);
    auto b = 2 * v.x * (q.x - h) / (4 * p) - v.y;
    auto c = (q.x * q.x - 2 * q.x * h + h * h) / (4 * p) + k - q.y;
    auto tvals = quadratic(a, b, c);
    return tvals;
  }

  std::vector<vec2> ppIntersect(decimal_t h1, decimal_t k1, decimal_t p1, decimal_t h2, decimal_t k2, decimal_t p2)
  {
    // Check for degenerate parabolas
    // WATCH VALUE
    // const double EPSILON = 0.00000001;
    // if (std::abs(p1) < EPSILON) {
    //   if (std::abs(p2) < EPSILON) {
    //     // Both parabolas have no width
    //     return {};
    //   }
    //   auto x = h1;
    //   auto y = parabola_f(x, h2, k2, p2); // TODO
    //   return {vec2(x, y), vec2(x, y)};
    // } else if (std::abs(p2) < EPSILON) {
    //   auto x = h2;
    //   auto y = parabola_f(x, h1, k1, p1);
    //   return {vec2(x, y), vec2(x, y)};
    // }

    // auto a = 0.25*(1/p1 - 1/p2);
    // auto b = 0.5*(h2/p2 - h1/p1);
    // auto c = 0.25*(h1*h1/p1 - h2*h2/p2) + k1 - k2;
    // auto disc = b*b - 4*a*c;
    // std::vector<double> xintersections;
    // if (a == 0) {
    //   // One solution -- no quadratic term
    //   xintersections.push_back(-c/b);
    // } else if (disc < 0) {
    //   // No real solutions
    // } else {
    //   // One or two solutions.
    //   auto x1 = (-b + std::sqrt(disc))/(2*a);
    //   auto x2 = (-b - std::sqrt(disc))/(2*a);
    //   if (x1 < x2) {
    //     xintersections.push_back(x1);
    //     xintersections.push_back(x2);
    //   } else {
    //     xintersections.push_back(x2);
    //     xintersections.push_back(x1);
    //   }
    // }
    // std::vector<vec2> ret;
    // for (auto&& x : xintersections)
    // {
    //   auto y = parabola_f(x, h1, k1, p1);//(x-h1)*(x-h1)/(4*p1) + k1;
    //   ret.push_back({x, y});
    // }
    // return ret;
    return {};
  }

}