#include <string>
#include <iostream>
#include <fstream>
#include <chrono>

#include "dataset.hh"
#include "types.hh"
#include "utils.hh"
#include "math.hh"


int main(int /* argc */, char** /* argv */)
{
  // always run from the /gvd-fortune/ folder
  // all paths must be relative to the gvd-fortune/ folder

  try
  {
    //////////// Math Tests//////////
    Event seg1(EventType_e::SEG, 1);
    seg1.a = vec2(-0.5, 0.0);
    seg1.b = vec2(-0.5, 1.0);
    Event seg2(EventType_e::SEG, 2);
    seg2.a = vec2(0.5, 0.0);
    seg2.b = vec2(0.5, 1.0);
    Event seg3(EventType_e::SEG, 3);
    seg3.a = vec2(0.5, 0.0);
    seg3.b = vec2(0.4999, 1.0);

    // if (!math::parallelTest(seg1, seg2))
    //   throw std::runtime_error("Failed the parallel test 1");

    // if (math::parallelTest(seg1, seg3))
    //   throw std::runtime_error("Failed the parallel test 2");

    auto v1 = math::subtract(vec2(0.0,0.0), vec2(1.0, 0.0));
    auto v2 = math::subtract(vec2(0.0,0.0), vec2(-1.0, 0.0));
    auto v3 = math::subtract(vec2(0.0,0.0), vec2(0.0, 1.0));
    auto z1 = math::crossProduct(v1, v2);
    auto z2 = math::crossProduct(v1, v3);
    if (std::abs(z1) > 0.0001)
      throw std::runtime_error("Failed cross product test 1");
    if (!(std::abs(z2) > 0.99))
      throw std::runtime_error("Failed cross product test 2 with value" + std::to_string(z2));

    vec2 e1(0.12345678, 0.987654321111);
    vec2 e2(0.12345678, 0.987654321112);
    if (math::equiv2(e1, e2))
      throw std::runtime_error("Failed equal test");

    vec2 a1(0.0, 0.623);
    vec2 a2(0.0, 0.123);
    vec2 a3(0.0, 0.723); // colinear - not right
    vec2 a4(-0.5, 0.723); // left of line
    vec2 a5(0.5, 0.723); // right of line
    if (math::isRightOfLine(a1, a2, a3))
      throw std::runtime_error("Failed right of line test1");

    if (math::isRightOfLine(a1, a2, a4))
      throw std::runtime_error("Failed right of line test2");

    if (!math::isRightOfLine(a1, a2, a5))
      throw std::runtime_error("Failed right of line test3");

    std::cout << "All unit tests passed\n";
  }
  catch(const std::exception& e)
  {
    std::cout << e.what() << '\n';
  }
  catch(...)
  {
    std::cout << "Unknown error\n";
  }

  return 0;
}
