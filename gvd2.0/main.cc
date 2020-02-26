#include <string>
#include <iostream>
#include <fstream>
#include <chrono>

#include "beachline.hh"
#include "dataset.hh"
#include "math.hh"
#include "types.hh"
#include "utils.hh"

namespace
{
  EventPacket getEventPacket(Event const& e, std::vector<Event>& rQueue)
  {
    // auto n = rQueue.end()--;
    auto n = rQueue.back();
    auto nn = rQueue[rQueue.size() - 2];
    // auto nn = n--;
    if (nn.type == EventType_e::SEG && n.type == EventType_e::SEG)
    {
      EventPacket ret = {e, {n, nn}};
      // rQueue.erase(n);
      // rQueue.erase(nn);
      rQueue.pop_back();
      rQueue.pop_back();
      return ret;
    }
    else if (n.type == EventType_e::SEG)
    {
      EventPacket ret = {e, {n}};
      // rQueue.erase(n);
      rQueue.pop_back();
      return ret;
    }
    return {e, {}};
  }

  void sortedInsert(CloseEvent const& e, std::vector<CloseEvent>& rQueue)
  {
    // PERFORMANCE - see if we can speed this up
    rQueue.push_back(e);
    std::sort(rQueue.begin(), rQueue.end(), math::close_event_less_than());
  }

  void fortune(std::vector<Polygon> const& polygons, double sweepline)
  {
    auto queue = createDataQueue(polygons);
    std::cout << "queue size:" << queue.size() << std::endl;

    decimal_t curY = 0.0;

    // set perhaps?
    std::vector<CloseEvent> closeEvents;

    Event event(EventType_e::UNDEFINED, 0);
    CloseEvent cEvent;
    bool onClose = false;

    // testing only
    int count = 0;

    while (queue.size() > 0)
    {
      count++;
      event = queue.back();
      curY = math::getEventY(queue.back());
      // get the next event closest to the sweepline
      if (!closeEvents.empty() && closeEvents.back().yval >= curY)
      {
        onClose = true;
        cEvent = closeEvents.back();
        closeEvents.pop_back();
        curY = cEvent.yval;
      }
      else
      {
        onClose = false;
        queue.pop_back();
      }
      if (curY < sweepline)
        break;

      if (onClose)
      {
        // DEBUG ONLY
        if (!cEvent.arcNode) throw std::runtime_error("Close Event invalid");
        if (cEvent.arcNode->live)
        {
          // TODO edge finalization
          auto newEvents = beachline::remove(cEvent.arcNode, cEvent.point, curY);
          for (auto&& e : newEvents)
          {
            if (e.yval < curY - 0.000001 || std::abs(e.yval - curY) < 1e-6) // Simplify?
              sortedInsert(e, closeEvents);
          }
        }
      }
      else
      {
        // Add Event
        auto packet = getEventPacket(event, queue);
        auto newEvents = beachline::add(packet);
        for (auto&& e : newEvents)
        {
          if (e.yval < curY - 0.000001 || std::abs(e.yval - curY) < 1e-6) // Simplify?
            sortedInsert(e, closeEvents);
        }
      }
    }

    std::cout << "Count:" << count << std::endl;
    // TODO get the result as a vector of edge results
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
    fortune(polygons, -0.9);
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
