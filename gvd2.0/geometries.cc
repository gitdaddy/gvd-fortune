#include "geometries.hh"
#include "math.hh"

// namespace
// {
// }


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
