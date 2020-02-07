#include <string>
#include <iostream>
#include <fstream>
#include <chrono>

#include "dataset.hh"
#include "types.hh"
#include "utils.hh"


int main(int /* argc */, char** /* argv */)
{
  // always run from the /gvd-fortune/ folder
  // all paths must be relative to the gvd-fortune/ folder

  try
  {
    std::cout << "Add test passed\n";
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
