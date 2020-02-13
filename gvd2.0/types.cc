#include "types.hh"
#include "math.hh" // circular reference?

namespace
{
  std::vector<vec2> ppIntersect(decimal_t h1, decimal_t k1, decimal_t p1, decimal_t h2, decimal_t k2, decimal_t p2)
  {
    // Check for degenerate parabolas
    // WATCH VALUE
    const double EPSILON = 0.00000001;
    if (std::abs(p1) < EPSILON) {
      if (std::abs(p2) < EPSILON) {
        // Both parabolas have no width
        return {};
      }
      auto x = h1;
      auto y = math::parabola_f(x, h2, k2, p2);
      return {vec2(x, y)};
    } else if (std::abs(p2) < EPSILON) {
      auto x = h2;
      auto y = math::parabola_f(x, h1, k1, p1);
      return {vec2(x, y)};
    }

    auto a = 0.25*(1/p1 - 1/p2);
    auto b = 0.5*(h2/p2 - h1/p1);
    auto c = 0.25*(h1*h1/p1 - h2*h2/p2) + k1 - k2;
    auto tvals = math::quadratic(a, b, c);
    std::vector<vec2> ret;
    for (auto&& x : tvals)
    {
      auto y = math::parabola_f(x, h1, k1, p1);//(x-h1)*(x-h1)/(4*p1) + k1;
      ret.push_back({x, y});
    }
    return ret;
  }

  std::vector<vec2> vpIntersect(GeometricObject const& v, GeometricObject const& p)
  {
    // std::vector<vec2> ret;
    // auto p = v.p;
    // for (auto&& )
    return {};
  }

}

Event makeSegment(vec2 p1, vec2 p2, uint32_t label, bool forceOrder)
{
  // check for p1.y == p2.y?
  // TESTING ONLY
  if (p1.y == p2.y)
    throw std::runtime_error("Horizontal segment detected");

  if (forceOrder)
  {
    return Event(EventType_e::SEG, label, vec2(0.0, 0.0), p1, p2);
  }
  return p1.y > p2.y ? Event(EventType_e::SEG, label, vec2(0.0, 0.0), p1, p2) : Event(EventType_e::SEG, label, vec2(0.0, 0.0), p2, p1);
}

std::vector<vec2> GeometricObject::intersect(GeometricObject& rOther)
{
  switch (type)
  {
  case GeometryType_e::PARABOLA:
    if (rOther.type == GeometryType_e::PARABOLA)
    {
      // not sure that this is needed
      p = p == 0.0 ? 1e-8 : p;
      rOther.p = rOther.p == 0.0 ? 1e-8 : rOther.p;
      return ppIntersect(h, k, p, rOther.h, rOther.k, rOther.p);
    }
    // else
    // {
    //   // v p

    // }
    break;

  case GeometryType_e::GEN_PARABOLA:
    /* code */
    break;

  case GeometryType_e::V:
    /* code */
    break;

  default:
    throw std::runtime_error("Invalid geometry type");
  }
  return {};
}

std::vector<vec2> GeometricObject::intersectRay(vec2 p, vec2 v)
{
  switch (type)
  {
  case GeometryType_e::PARABOLA:
    /* code */
    break;

  case GeometryType_e::GEN_PARABOLA:
    /* code */
    break;

  case GeometryType_e::V:
    /* code */
    break;

  default:
    throw std::runtime_error("Invalid geometry type");
  }
  return {};
}

decimal_t GeometricObject::f(decimal_t x)
{
  switch (type)
  {
  case GeometryType_e::PARABOLA:
    /* code */
    break;

  case GeometryType_e::GEN_PARABOLA:
    /* code */
    break;

  case GeometryType_e::V:
    /* code */
    break;

  default:
    throw std::runtime_error("Invalid geometry type");
  }
  return 0.0;
}
// Inverse of f. x = f_(y)
decimal_t GeometricObject::_f(decimal_t y)
{
  switch (type)
  {
  case GeometryType_e::PARABOLA:
    /* code */
    break;

  case GeometryType_e::GEN_PARABOLA:
    /* code */
    break;

  case GeometryType_e::V:
    /* code */
    break;

  default:
    throw std::runtime_error("Invalid geometry type");
  }
  return 0.0;
}

std::vector<vec2> GeometricObject::prepDraw(vec2 origin, vec2 dest)
{
  switch (type)
  {
  case GeometryType_e::PARABOLA:
    /* code */
    break;

  case GeometryType_e::GEN_PARABOLA:
    /* code */
    break;

  case GeometryType_e::V:
    /* code */
    break;

  default:
    throw std::runtime_error("Invalid geometry type");
  }
  return {};
}
