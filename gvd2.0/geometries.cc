#include "geometries.hh"
#include "math.hh"

// namespace
// {
// }

decimal_t parabola_f(decimal_t x, decimal_t h, decimal_t k, decimal_t p)
{
  return (x - h) * (x - h) / (4 * p) + k;
}

vec2 transformVector(vec2 v, GeometricObject const& genP)
{
  if (genP.objType() != GeometryType_e::GEN_PARABOLA)
    throw std::runtime_error("Invalid object type: general parabola expected");
  if (genP.theta == 0) return v;

  vec4 v4 = vec4(v.x, v.y, 0.0, 0.0);
  // auto val = math::mult(genP.Rz, v4);
  auto val = math::mult(genP.Rz, v4);
  // Not sure why w is getting set to 1.
  // v[3] = 0;
  return vec2(val.x, val.y); // Do we need z,w?
}

vec2 untransformPoint(vec2 p, GeometricObject const& genP)
{
  if (genP.objType() != GeometryType_e::GEN_PARABOLA)
    throw std::runtime_error("Invalid object type: general parabola expected");
  if (genP.theta == 0) return p;
  vec4 newP(p.x, p.y, 0.0, 0.0);
  newP.x += -genP.h;
  p.y += -2 * genP.k;
  auto rslt = math::mult(genP.nRz, newP);
  rslt.x += genP.focus.x;
  rslt.y += genP.focus.y;
  return vec2(rslt.x, rslt.y); // Do we need z,w?
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

std::vector<vec2> GeometricObject::intersectRay(decimal_t p, vec2 v)
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