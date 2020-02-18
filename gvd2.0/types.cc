#include "types.hh"

#include <memory>
#include <cmath>

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

Node::Node(ArcType_e _aType)
  : aType(_aType),
  side(Side_e::UNDEFINED),
  id(g_nodeId++),
  pLeft(nullptr),
  pRight(nullptr),
  pParent(nullptr),
  start(vec2(0.0,0.0)),
  end(vec2(0.0,0.0)),
  point(vec2(0.0,0.0)),
  a(vec2(0.0,0.0)),
  b(vec2(0.0,0.0))
{}

