#ifndef GEOMETRIES_HH
#define GEOMETRIES_HH

#include <iostream>
#include "types.hh"

decimal_t parabola_f(decimal_t x, decimal_t h, decimal_t k, decimal_t p);

vec2 transformVector(vec2 v, GeometricObject const& genP);

vec2 untransformPoint(vec2 v, GeometricObject const& genP);

#endif
