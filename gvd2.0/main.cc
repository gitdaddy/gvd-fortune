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

  std::string i(argv[1]);

  if (i.substr(i.size() - 4, i.size()) == ".map")
  {
    // TODO process map
    processInputMap(i);
  }
  else
  {
    // Read in the dataset files
    processInputFiles(i);
  }

  return 0;
}
