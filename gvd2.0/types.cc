#include "types.hh"
#include "math.hh" // circular reference?

#include <memory>

namespace
{
  std::vector<vec4> rotateZ(decimal_t theta)
  {
    auto radians = theta * (std::atan(1)*4) / 180.0;
    // double c = 0.0;
    // if ( std::abs(theta) == 90)
    //   c = 0.0;
    // else
    //   c = std::cos(radians);
    auto c = std::cos(radians);
    auto s = std::sin(radians);
    return {vec4( c,   -s, 0.0, 0.0),
            vec4( s,    c, 0.0, 0.0),
            vec4(0.0, 0.0, 1.0, 0.0),
            vec4(0.0, 0.0, 0.0, 1.0) };
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

/////////////////////// V
V::V(vec2 p1, vec2 p2, decimal_t directrix, uint32_t id)
  : point(0.0, 0.0), y1(0.0, 0.0), y0(0.0, 0.0),
  vectors(), thetas(), id(id)
{
  y0 = p1;
  y1 = p2;
  if (p1.y > p2.y)
  {
    y1 = p1;
    y0 = p2;
  }
  Event directrixSeg(EventType_e::SEG, 0, vec2(0.0,0.0),vec2(-1.0, directrix), vec2(1.0, directrix));
  auto optP = math::intersectLines(y0, y1, directrixSeg.a, directrixSeg.b);
  if (!optP) throw std::runtime_error("Invalid V");
  point = *optP;
  Event s1(EventType_e::SEG, 0, vec2(0.0,0.0), p1, p2);
  auto theta = math::getSegmentsBisectorAngle(directrixSeg, s1);

  auto PI = math::pi();
  while (theta > 0) theta -= PI/2;
  while (theta < 0) theta += PI/2;
  thetas = {theta + PI/2, theta};
  for (auto&& t : thetas)
  {
    vectors.push_back(vec2(std::cos(t), std::sin(theta)));
  }
}

decimal_t f_x(V const& v, decimal_t x)
{
  vec2 vec(0.0, 0.0);
  if (x < v.point.x) {
    vec = v.vectors[0];
  } else {
    vec = v.vectors[1];
  }
  return v.point.y + vec.y * (x - v.point.x) / vec.x;
}

std::vector<decimal_t> f_y(V const& v, decimal_t y)
{
  if (y < v.point.y) return {v.point.x};
  if (y == v.point.y) return {v.point.x};
  auto tY = v.point.y;
  auto tX = v.point.x;
  std::vector<decimal_t> ret;
  for (auto&& vec : v.vectors)
  {
    ret.push_back(tX + vec.x*(y-tY)/vec.y);
  }
  return ret;
}

//////////////// PARABOLA

Parabola::Parabola(vec2 focus, decimal_t h, decimal_t k, decimal_t p, uint32_t id)
  : focus(focus), h(h), k(k), p(p), id(id)
{}

/////////////// GENERAL PARABOLA

GeneralParabola::GeneralParabola(vec2 focus, decimal_t h, decimal_t k,
                  decimal_t p, decimal_t theta, uint32_t id)
  : focus(focus), h(h), k(k), p(p), theta(theta), Rz(), nRz(), id(id)
{
  Rz = rotateZ(-theta);
  nRz = rotateZ(theta);
}
