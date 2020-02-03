#ifndef TYPES_HH
#define TYPES_HH

#include <string>
#include <vector>
#include <iostream>

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
      : type(_type), id( 123 /* g_id++ */), label(l) {}

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

  vec2 getValue() { return value; }

private:
  vec2 value;
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
SegmentSite makeSegment(vec2 p1, vec2 p2, uint32_t label, bool forceOrder = false);

class Polygon
{
public:
  Polygon() : label(123/* g_labelCount++ */) {}

  void addPoint(vec2 const &loc)
  {
    sites.push_back(PointSite(label, loc));
  }

  void addSegment(vec2 a, vec2 b)
  {
    sites.push_back(makeSegment(a, b, label));
  }

private:
  uint32_t label;
  std::vector<Event> sites;
};

#endif
