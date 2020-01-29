#include "dataset.hh"

#include <fstream>
#include <vector>
#include <sstream>
#include <memory>

/////////////////////////// Helper Functions //////////////////////////////////////////

std::vector<std::string> split(const std::string& s, char delimiter)
{
   std::vector<std::string> tokens;
   std::string token;
   std::istringstream tokenStream(s);
   while (std::getline(tokenStream, token, delimiter))
   {
      tokens.push_back(token);
   }
   return tokens;
}

vec2 parseLineToVec2(std::string const& s)
{
  auto t = split(s, ' ');
  return {std::stod(t[0]), std::stod(t[1])};
}

SegmentSite makeSegment(vec2 p1, vec2 p2, uint32_t label, bool forceOrder)
{
  // check for p1.y == p2.y?
  // TESTING ONLY
  if (p1.y == p2.y) throw std::runtime_error("Horizontal segment detected");

  if (forceOrder)
  {
    return SegmentSite(label, p1, p2);
  }
  return p1.y > p2.y ? SegmentSite(label, p1, p2) : SegmentSite(label, p2, p1);
}

std::vector<vec2> sanitizeData(std::vector<vec2> orderedPoints, std::shared_ptr<double> pOptTolerance = nullptr)
{
  if (orderedPoints.size() > 3)
  {
    // TODO remove CAS
  }

  // TODO Horizontal adjust
  return orderedPoints;
}

void processInputFiles(std::string const& inputFiles)
{
  std::ifstream fin(inputFiles.c_str());

  // each file is a single polygon, line, or point
  std::vector<Polygon> polygons;
  std::string filePath;
  while(fin >> filePath)
  {
    // trim?
    // each file of format
    // xxxxx yyyyyyy - p1
    // xxxxx yyyyyyy...
    // xxxxx yyyyyyy - p1
    std::ifstream file(filePath.c_str());
    std::string line;
    std::vector<std::string> lines;
    while (std::getline(file, line))
    {
      lines.push_back(line);
    }

    std::vector<vec2> points;
    for (size_t i = 1; i < lines.size(); ++i)
    {
      points.push_back(parseLineToVec2(lines[i]));
    }

    sanitizeData(points);

    Polygon poly;
    auto p1 = points[0];
    poly.addPoint(p1);

    for (size_t i = 1; i < points.size() - 1; ++i)
    {
      auto p2 = points[i];
      poly.addPoint(p2);
      poly.addSegment(p1,p2);
      p1 = p2;
    }

    // terminate the wrap around
    poly.addSegment(points[0], p1);

    polygons.push_back(poly);
  }
}

void processInputMap(std::string const& /* inputMap */)
{
  std::cout << "processing input map\n";
    // TODO process map
}
