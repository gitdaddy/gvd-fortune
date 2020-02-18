#ifndef TYPES_HH
#define TYPES_HH

#include <iostream>
#include <memory>
#include <string>
#include <vector>

static uint32_t g_id = 0;
static uint32_t g_labelCount = 0;

/////////////////////////////////// Data Structures /////////////////////////////////////

typedef long double decimal_t;
// for better precision perhaps try
// typedef _Float128 decimal_t;

struct vec2
{
  vec2(decimal_t _x, decimal_t _y) : x(_x), y(_y) {}
  decimal_t x;
  decimal_t y;
};

struct vec4
{
  vec4(decimal_t _x, decimal_t _y, decimal_t _z, decimal_t _w) : x(_x), y(_y), z(_z), w(_w) {}
  decimal_t x;
  decimal_t y;
  decimal_t z;
  decimal_t w;
};

enum class EventType_e
{
  SEG = 1,
  POINT = 2,
  CLOSE = 3,
  UNDEFINED = 4
};

enum class Side_e
{
  LEFT = 1,
  RIGHT = 2,
  UNDEFINED = 3
};

class V
{
  public:
  V(vec2 p1, vec2 p2, decimal_t directrix, uint32_t id);

  vec2 point;
  vec2 y1;
  vec2 y0;
  std::vector<vec2> vectors;
  std::vector<double> thetas;
  private:
  uint32_t id;
  // split site?
};

decimal_t f_x(V const& v, decimal_t x);
std::vector<decimal_t> f_y(V const& v, decimal_t y);

class Parabola
{
  public:
  Parabola(vec2 focus, decimal_t h, decimal_t k, decimal_t p, uint32_t id);

  vec2 focus;
  decimal_t h;
  decimal_t k;
  decimal_t p;
  private:
  uint32_t id;
};

class GeneralParabola
{
  public:
  GeneralParabola(vec2 focus, decimal_t h, decimal_t k,
                  decimal_t p, decimal_t theta, uint32_t id);

  vec2 focus;
  decimal_t h;
  decimal_t k;
  decimal_t p;
  decimal_t theta;
  std::vector<vec4> Rz;
  std::vector<vec4> nRz;
  private:
  uint32_t id;
};

static uint32_t g_nodeId = 0;
//------------------------------------------------------------
// EdgeNode
// left and right are the left and right children nodes.
// left is always an ArcNode. Right may be an ArcNode or
// EdgeNode.
//------------------------------------------------------------
//------------------------------------------------------------
// ArcNode - active node segment in the beachline
//------------------------------------------------------------
class Node
{
  public:
  Node(bool _isArc,
    EventType_e type = EventType_e::UNDEFINED,
    std::shared_ptr<Node> const& _optLeft = nullptr,
    std::shared_ptr<Node> const& _optRight = nullptr,
    vec2 _start = vec2(0.0,0.0))
    : isArc(_isArc), isParabola(),
    side(Side_e::UNDEFINED), id(g_nodeId++),
    pLeft(_optLeft),
    pRight(_optRight),
    pParent(nullptr),
    start(_start),
    end(vec2(0.0,0.0)),
    point(vec2(0.0,0.0)),
    a(vec2(0.0,0.0)),
    b(vec2(0.0,0.0))
    {
      isParabola = (type == EventType_e::POINT);
    }

  // Parabola, Gen Parabola, or V
  // GeometricObject createDrawElement(double directrix);

  bool isGenEdge() const { return false; } // TODO determine if edge is general

  std::shared_ptr<Node> prevEdge();
  std::shared_ptr<Node> nextEdge();

  std::shared_ptr<Node> prevArc();
  std::shared_ptr<Node> nextArc();

  void updateEdge();

  vec2 intersection();

  // std::shared_ptr<Event> optSite;

  bool isArc; // otherwise an edge
  bool isParabola; // parabola or V
  Side_e side; // which side of the edge
  uint32_t id;
  // Perhaps these will need to be weak_ptr
  // to avoid circular ownership
  std::shared_ptr<Node> pLeft;
  std::shared_ptr<Node> pRight;
  std::shared_ptr<Node> pParent;
  vec2 start;
  vec2 end;
  vec2 point;
  vec2 a;
  vec2 b;
};

struct Event
{
  Event(EventType_e t, uint32_t l, vec2 _p = vec2(0.0,0.0), vec2 _a = vec2(0.0,0.0), vec2 _b = vec2(0.0,0.0))
  : type(t), id(g_id++), label(l), point(_p), a(_a), b(_b), live(true) {}

  EventType_e type;
  uint32_t id;
  uint32_t label;
  vec2 point;
  vec2 a;
  vec2 b;

  // close event items
  bool live;
  std::shared_ptr<Node> arcNode;
  decimal_t yval;
};

struct EventPacket
{
  Event site;
  std::vector<Event> children; //[0] - left/single child [1] - right
};

inline Event createCloseEvent(decimal_t y, std::shared_ptr<Node> const& arcNode, vec2 point)
{
  Event r(EventType_e::CLOSE, 0, point);
  r.arcNode = arcNode;
  r.yval = y;
  return r;
}

struct event_less_than
{
  inline bool operator() (Event const& lhs, Event const& rhs) const
  {
    decimal_t r1 = 0.0;
    decimal_t r2 = 0.0;
    decimal_t l1 = 0.0;
    decimal_t l2 = 0.0;
    // Y major, x minor
    if (lhs.type == EventType_e::POINT)
    {
      l1 = lhs.point.y;
      l2 = lhs.point.x;
    }
    else if (lhs.type == EventType_e::SEG)
    {
      l1 = lhs.a.y;
      l2 = lhs.a.x;
    }
    else
    {
      l1 = lhs.point.y;
      l2 = lhs.point.x;
    }

    if (rhs.type == EventType_e::POINT)
    {
      r1 = rhs.point.y;
      r2 = rhs.point.x;
    }
    else if (rhs.type == EventType_e::SEG)
    {
      r1 = rhs.a.y;
      r2 = rhs.a.x;
    }
    else
    {
      r1 = rhs.point.y;
      r2 = rhs.point.x;
    }
    // return l1 < r1 || l2 < r2;
    if (l1 == r1) return l2 < r2;
    return l1 < r1;
  }
};

Event makeSegment(vec2 p1, vec2 p2, uint32_t label, bool forceOrder = false);

class Polygon
{
public:
  Polygon() : label(g_labelCount++), orderedPointSites() {}

  void addPoint(vec2 const& loc)
  {
    orderedPointSites.push_back(Event(EventType_e::POINT, label, loc));
  }

  std::vector<Event> getSegments()
  {
    if (orderedPointSites.size() < 2) return {};
    if (orderedPointSites.size() == 2)
    {
      return {makeSegment(orderedPointSites[0].point, orderedPointSites[1].point, label)};
    };

    std::vector<Event> rslt;
    auto p1 = orderedPointSites[0].point;
    for (size_t i = 1; i < orderedPointSites.size(); ++i)
    {
      auto p2 = orderedPointSites[i].point;
      rslt.push_back(makeSegment(p1, p2, label));
      p1 = p2;
    }
    auto start = orderedPointSites[0].point;
    // terminate the wrap around
    rslt.push_back(makeSegment(start, p1, label));

    return rslt;
  }

  uint32_t getLabel() { return label; }

  std::vector<Event> orderedPointSites;
private:
  uint32_t label;
};

#endif
