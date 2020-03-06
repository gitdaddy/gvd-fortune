const gvd_Addon = require("./gvd2.0/build/Release/addon.node");

// function jsSum() {
//   let a = 3.14, b = 2.78;
//   for (let i = 0; i < 100000000; ++i){
//     a += b;
//   }
//   return a;
// }

// Just as fast?
// console.time("js")
// jsSum();
// console.timeEnd("js")

console.time("c++");
let jsonObj = gvd_Addon.ComputeGVD("./data/random_100/_files.txt", 0.5);
// gvd_Addon.Increment(0.2);
console.log(JSON.stringify(jsonObj));
// console.log(jsonObj["name"]);
// console.log("r:" + r);
console.timeEnd("c++");
