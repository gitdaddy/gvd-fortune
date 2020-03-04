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
let jsonObj = gvd_Addon.ComputeGVD(1, 0.5);
// console.log(JSON.stringify(r));
// console.log(jsonObj["name"]);
// console.log("r:" + r);
console.timeEnd("c++");
