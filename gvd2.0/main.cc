#include <string>
#include <iostream>
#include <fstream>
#include <chrono>

#include "dataset.hh"
#include "types.hh"
#include "utils.hh"
#include "math.hh"

namespace
{
  void fortune(std::vector<Polygon> const& polygons, double sweepline)
  {
    auto queue = createDataQueue(polygons);
    // std::cout << "queue size:" << queue.size() << std::endl;

    if (queue.size() < 1) return;
    // TODO init beachline
    auto nextY = math::getEventY(queue.back());
    // while (queue.size > 0 && nextY > sweepline)
    // {
    //   auto event = queue.back();
    //   queue.pop_back();

    //   if (event.type == EventType_e::CLOSE)
    //   {
    //   // if (event.live && event.arcNode.closeEvent.live) {
    //     if (event.live)
    //     {
    //       // TODO edges and arcnodes

    //       // TODO perform remove
    //     }
    //   }
    //   else
    //   {
    //     // Add Event
    //   }
    //   if (queue.size() > 0)
    //     nextY = math::getEventY(queue.back());
    // }


    // get the result as a vector of edge results
  }
}

int main(int argc, char** argv)
{
  // always run from the /gvd-fortune/ folder
  // all paths must be relative to the gvd-fortune/ folder
  if (argc < 2)
  {
    std::cout << "Usage: <program> <input file containing a list of file paths>\n";
    return 0;
  }

  std::string i(argv[1]);
  // Read in the dataset files
  try
  {
    // only wrap for testing
    auto polygons = processInputFiles(i);
    auto start = std::chrono::system_clock::now();
    fortune(polygons, 0.0);
    auto end = std::chrono::system_clock::now();
    std::chrono::duration<double> elapsedSeconds = end-start;
    std::cout << "Process Duration: " << elapsedSeconds.count() << "s\n";

    // testing only
    // std::cout << "printing test files\n";
    // std::vector<std::string> files;
    // int count = 0;
    // for (auto&& p : polygons)
    // {
    //   std::string filename = "file_" + std::to_string(count) + ".txt";
    //   std::ofstream ofs(std::string("./gvd2.0/test_output/" + filename).c_str(), std::ofstream::out | std::ios_base::trunc);
    //   auto sites = p.getPointSites();
    //   std::cout << "poly point size:" << sites.size() << std::endl;
    //   for (auto&& pS : sites)
    //   {
    //     ofs << pS->x() << " " << pS->y() << "\n";
    //   }
    //   // wrap
    //   ofs << sites[0]->x() << " " << sites[0]->y() << "\n";

    //   files.push_back("./gvd2.0/test_output/" + filename);
    //   count++;
    //   ofs.close();
    // }

    // std::ofstream ofs2("./gvd2.0/test_output/_files.txt" , std::ofstream::out | std::ios_base::trunc);
    // for (auto&& f : files)
    // {
    //   ofs2 << f << "\n";
    // }

    // ofs2.close();

    // infinite loop to adjust the sweepline?
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
