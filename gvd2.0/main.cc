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

  std::string i(argv[1]);
  // Read in the dataset files
  try
  {
    auto polygons = processInputFiles(i);

    // std::cout << "test print\n";
    // // infinite loop to adjust the sweepline?
    // std::ofstream ofs("./out.txt", std::ofstream::out | std::ios_base::trunc);
    // for (auto&& p : polygons)
    // {
    //   ofs << "poly \n";
    //   for (auto&& pS : p.getSites())
    //   {
    //     if (EventType_e::POINT == pS->getType())
    //     {
    //       ofs << pS->x() << " " << pS->y() << "\n";
    //     }
    //     else if (EventType_e::SEG == pS->getType())
    //     {
    //       ofs << pS->a().x << " " << pS->a().y << " -> " << pS->b().x << " " << pS->b().y << "\n";
    //     }
    //   }
    // }
    // ofs.close();
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
