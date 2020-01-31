#include <iostream>
#include <string>
#include <vector>

static uint32_t g_id = 0;
static uint32_t g_labelCount = 0;

/////////////////////////////////// Data Structures /////////////////////////////////////

struct vec2
{
  double x;
  double y;
};

class Site
{
  public:
  Site(bool isSegmentSite, uint32_t l)
  : isSeg(isSegmentSite), id(g_id++), label(l)  {}

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
  bool isSeg;
  uint32_t id;
  uint32_t label;
};

class PointSite : public Site
{
  public:
  PointSite(uint32_t label, vec2 loc) : Site(false, label), value(loc) {}

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

class SegmentSite : public Site
{
  public:
  SegmentSite(uint32_t label, vec2 _a, vec2 _b) : Site(true, label), locA(_a), locB(_b) {}

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

SegmentSite makeSegment(vec2 p1, vec2 p2, uint32_t label, bool forceOrder = false);

class Polygon
{
  public:
    Polygon() { label = g_labelCount++; }

    void addPoint(vec2 const& loc)
    {
      sites.push_back(PointSite(label, loc));
    }

    void addSegment(vec2 a, vec2 b)
    {
      sites.push_back(makeSegment(a, b, label));
    }

  private:
    uint32_t label;
    std::vector<Site> sites;
};

std::vector<Polygon> processInputFiles(std::string const& inputFiles);

// void processInputMap(std::string const& inputFiles);
