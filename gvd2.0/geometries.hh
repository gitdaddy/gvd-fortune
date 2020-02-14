#ifndef GEOMETRIES_HH
#define GEOMETRIES_HH

#include <iostream>
#include "types.hh"

vec2 transformVector(vec2 v, GeneralParabola const& genP);

vec2 untransformPoint(vec2 v, GeneralParabola const& genP);

#endif
