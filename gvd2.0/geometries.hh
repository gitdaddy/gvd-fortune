#ifndef GEOMETRIES_HH
#define GEOMETRIES_HH

#include <iostream>
#include "types.hh"

decimal_t parabola_f(decimal_t x, decimal_t h, decimal_t k, decimal_t p);

vec2 transformVector(vec2 v, GeometricObject const& genP);

vec2 untransformPoint(vec2 v, GeometricObject const& genP);

// h - x offset
// k - y offset
// p - scale factor
// directrix is at k-p
// focus is at k+p
// y = (x-h)^2/(4p) + k
// GeometricObject crateParabola(decimal_t focus, double directrix, uint32_t id);

enum class GeometryType_e
{
  PARABOLA = 1,
  GEN_PARABOLA = 2,
  V = 3
};

// Composed geometric object
class GeometricObject
{
  public:
  GeometricObject(GeometryType_e type, uint32_t id)
  : focus(), k(), p(), theta(), offset(), Rz(), nRz(), y1(0.0, 0.0), y0(0.0, 0.0) {}

  std::vector<vec2> intersect(GeometricObject const& other);

  // Intersect the positive portion of the ray.
  // If there are two intersections, the intersections will
  // be returned in order of t value.
  // The ray is given in parametric form p(t) = p + tv
  std::vector<vec2> intersectRay(decimal_t p, vec2 v);

  decimal_t f(decimal_t x);
  // Inverse of f. x = f_(y)
  decimal_t _f(decimal_t y);

  std::vector<vec2> prepDraw(vec2 origin, vec2 dest);

  GeometryType_e objType() const { return type; }

  // h - x offset
  // k - y offset
  // p - scale factor
  // directrix is at k-p
  // focus is at k+p
  // y = (x-h)^2/(4p) + k
  // GeometricObject crateParabola(decimal_t focus, double directrix, uint32_t id);
  vec2 focus;
  decimal_t h;
  decimal_t k;
  decimal_t p;
  int theta;
  decimal_t offset;
  std::vector<vec4> Rz;
  std::vector<vec4> nRz;
  vec2 y1;
  vec2 y0;
  private:
  GeometryType_e type;
  uint32_t id;
  // split site?
};

#endif
