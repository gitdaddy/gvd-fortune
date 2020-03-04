{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ 
        "addon.cc", 
        "fortune.cc",
        "dataset.cc",
        "utils.cc",
        "nodeInsert.cc",
        "math.cc",
        "types.cc"
        ], 
      "cflags": ["-Wall", "-std=c++14" ], # TODO optimization flags
      "cflags!": [ '-fno-exceptions' ],
      "cflags_cc!": [ '-fno-exceptions' ],
      # "include_dirs" : ["<!(node -e \"require('nan')\")", "<!(node -e \"require('streaming-worker-sdk')\")"]
    }
  ]
}
