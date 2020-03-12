
## GVD Exact Computation use the Sweepline Algorithm

To run code with the built-in node server you will need nodejs and some basic packages installed

### Needed npm packages:
open, fs, express, node-gyp

Linux:
sudo apt-get nodejs
sudo apt-get node-gyp
//packages
npm install <package>

Mac:
brew install node
brew install node-gyp

### Build the GVD C++ Addon
``` cd gvd2.0 ```

``` node-gyp configure build ```

### Run the software
``` nodejs nodeServer.js ```