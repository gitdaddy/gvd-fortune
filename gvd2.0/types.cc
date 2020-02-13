#include "types.hh"


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

std::vector<vec2> GeometricObject::intersect(GeometricObject const& other)
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
