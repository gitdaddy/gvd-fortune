#include <string>
#include <iostream>

#include "dataset.hh"

// void fortune()
// {

// }

int main(int argc, char** argv)
{
  if (argc < 2)
  {
    std::cout << "Usage: <program> <input file can be a .map or a file containing a files list>\n";
    return 0;
  }

  // no map files

  std::string i(argv[1]);
  // Read in the dataset files
  processInputFiles(i);

  // infinite loop to adjust the sweepline?

  return 0;
}
