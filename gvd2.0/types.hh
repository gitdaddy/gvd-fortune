#ifndef TYPES_HH
#define TYPES_HH

#include <iostream>
#include <memory>
#include <string>
#include <vector>

static uint32_t g_id = 0;
static uint32_t g_labelCount = 0;

/////////////////////////////////// Data Structures /////////////////////////////////////

struct vec2
{
  vec2(double _x, double _y) : x(_x), y(_y) {}
  double x;
  double y;
};

enum class EventType_e
{
  SEG = 1,
  POINT = 2,
  CLOSE = 3
};

class Event
{
public:
  Event(EventType_e _type, uint32_t l)
      : type(_type), id(g_id++), label(l) {}

  virtual double x() const
  {
    throw std::runtime_error("calling x() on base Site");
    return 0.0;
  }

  virtual double y() const
  {
    throw std::runtime_error("calling y() on base Site");
    return 0.0;
  }

  virtual vec2 a() const
  {
    throw std::runtime_error("calling a() on base Site");
    return {0.0, 0.0};
  }

  virtual vec2 b() const
  {
    throw std::runtime_error("calling b() on base Site");
    return {0.0, 0.0};
  }

  uint32_t getLabel() { return label; }

  EventType_e getType() { return type; }

private:
  EventType_e type;
  uint32_t id;
  uint32_t label;
};

class PointSite : public Event
{
public:
  PointSite(uint32_t label, vec2 loc) : Event(EventType_e::POINT, label), value(loc) {}

  double x() const override
  {
    return value.x;
  }

  double y() const override
  {
    return value.y;
  }

  void addToY(double toAdd) { value.y + toAdd; }

  vec2 getValue() const { return value; }

private:
  vec2 value;
};

struct point_site_less_than
{
  inline bool operator() (const PointSite& lhs, const PointSite& rhs)
  {
    // Y major, x minor
    return (lhs.y() < rhs.y() || lhs.x() < rhs.x());
  }
};

class SegmentSite : public Event
{
public:
  SegmentSite(uint32_t label, vec2 _a, vec2 _b) : Event(EventType_e::SEG, label), locA(_a), locB(_b) {}

  vec2 a() const override
  {
    return locA;
  }

  vec2 b() const override
  {
    return locB;
  }

private:
  vec2 locA;
  vec2 locB;
};

class CloseEvent : public Event
{
public:
  CloseEvent(uint32_t label, vec2 _a, vec2 _b) : Event(EventType_e::CLOSE, label), locA(_a), locB(_b) {}

  vec2 a() const override
  {
    return locA;
  }

  double y() const override
  {
    return std::max(locA.y, locB.y);
  }

  vec2 b() const override
  {
    return locB;
  }

private:
  vec2 locA;
  vec2 locB;
};

// SegmentSite makeSegment(vec2 p1, vec2 p2, uint32_t label, bool forceOrder = false);
std::shared_ptr<SegmentSite> makeSegment(vec2 p1, vec2 p2, uint32_t label, bool forceOrder = false);

class Polygon
{
public:
  Polygon() : label(g_labelCount++) {}

  void addPoint(vec2 const& loc)
  {
    orderedPointSites.push_back(std::make_shared<PointSite>(label, loc));
  }

  std::vector<std::shared_ptr<PointSite>> getPointSites() const { return orderedPointSites; }

  std::vector<std::shared_ptr<Event>> getSegments()
  {
    std::vector<std::shared_ptr<Event>> rslt;
    auto p1 = vec2(orderedPointSites[0]->x(), orderedPointSites[0]->y());
    for (size_t i = 1; i < orderedPointSites.size(); ++i)
    {
      auto p2 = vec2(orderedPointSites[i]->x(), orderedPointSites[i]->y());
      rslt.push_back(makeSegment(p1, p2, label));
      p1 = p2;
    }
    auto start = vec2(orderedPointSites[0]->x(), orderedPointSites[0]->y());
    // terminate the wrap around
    rslt.push_back(makeSegment(start, p1, label));
  }

  uint32_t getLabel() { return label; }

private:
  uint32_t label;
  std::vector<std::shared_ptr<PointSite>> orderedPointSites;

};

#endif
