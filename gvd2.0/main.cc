#include <string>
#include <iostream>
#include <fstream>

#include "dataset.hh"
#include "types.hh"

// void fortune()
// {

// }

int main(int argc, char** argv)
{
  if (argc < 2)
  {
    std::cout << "Usage: <program> <input file containing a list of file paths>\n";
    return 0;
  }

  // no map files

  std::string i(argv[1]);
  // Read in the dataset files
  auto polygons = processInputFiles(i);

  // infinite loop to adjust the sweepline?

  std::ofstream ofs("out.txt", std::ofstream::out | std::ios_base::trunc);
  for (auto&& p : polygons)
  {
    ofs << "poly \n";
    for (auto&& s : p.getSites())
    {
      if (EventType_e::POINT == s.getType())
      {
        ofs << s.x() << " " << s.y() << "\n";
      }
      else if (EventType_e::SEG == s.getType())
      {
        ofs << s.a().x << " " << s.a().y << " -> " << s.b().x << " " << s.b().y << "\n";
      }
    }
  }
  ofs.close();

  return 0;
}
