#include <iostream>
#include <node.h>

#include "fortune.hh"
#include "dataset.hh"

namespace
{
  std::vector<std::string> getDatasets()
  {
    return {"./data/maze/_files.txt",
            "./data/random_100/_files.txt",
            "./data/random_200/_files.txt",
            "./data/random_500/_files.txt",
            "./data/random_1000/_files.txt",
            "./data/holes/h_64/_files.txt",
            "./data/holes/h_128/_files.txt",
            "./data/holes/h_256/_files.txt",
            "./data/holes/h_512/_files.txt",
            "./data/holes/h_1024/_files.txt",
            "./data/holes/h_2048/_files.txt",
            "./data/holes/h_4096/_files.txt",
            "./data/holes/h_8192/_files.txt",
            "./data/holes/h_16384/_files.txt",
            "./data/holes/h_32768/_files.txt"};
    // TODO          
    // {label:"Sydney city dataset", isMap: true, filename:"Sydney_2_512.map"}, // TODO add more versions
    // {label:"Berlin city dataset", isMap: true, filename:"Berlin_0_256.map"},
    // {label:"Boston city dataset", isMap: true, filename:"Boston_0_256.map"},
    // {label:"Moscow city dataset", isMap: true, filename:"Moscow_1_256.map"},
    // {label:"Denver city dataset", isMap: true, filename:"Denver_0_256.map"}, // TODO FIX
    // {label:"Milan city dataset", isMap: true, filename:"Milan_0_256.map"}, // TODO FIX
    // {label:"NewYork city dataset", isMap: true, filename:"NewYork_1_256.map"}, // TODO FIX
    // {label:"Paris city dataset", isMap: true, filename:"Paris_0_256.map"}, // TODO FIX
    // {label:"Shanghai city dataset", isMap: true, filename:"Shanghai_2_256.map"},
  }
}

void ComputeGVD(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  try
  {
    v8::Isolate* isolate = args.GetIsolate();

    if (args.Length() < 2)
    {
      std::cout << "Compute GVD arg count too low\n";
      return;
    }

    uint32_t datasetIdx = args[0]->ToUint32()->Value();

    auto sets = getDatasets();
    if (datasetIdx > sets.size() - 1)
    {
      std::cout << "Error set idx of: " << datasetIdx << " is too large";
    }

    double sweepline = args[1]->ToNumber()->Value();
    auto polygons = processInputFiles(sets[datasetIdx]);
    auto gvdResults = fortune(polygons, sweepline);

    // TODO transfer results into v8 objects

    v8::Handle<v8::Object> result = v8::Object::New(isolate);
    result->Set(v8::String::NewFromUtf8(isolate, "name"), v8::String::NewFromUtf8(isolate, "Stackoverflow"));
    result->Set(v8::String::NewFromUtf8(isolate, "url"), v8::String::NewFromUtf8(isolate, "http://stackoverflow.com"));
    result->Set(v8::String::NewFromUtf8(isolate, "javascript_tagged"), v8::Number::New(isolate, 317566));
    args.GetReturnValue().Set(result);
  }
  catch(const std::exception& e)
  {
    std::cout << "Error " << e.what() << '\n';
    return;
  }
  
}

// TODO increment gvd perhaps

void Initalize(v8::Local<v8::Object> exports)
{
  NODE_SET_METHOD(exports, "ComputeGVD", ComputeGVD);
}

NODE_MODULE(addon, Initalize)