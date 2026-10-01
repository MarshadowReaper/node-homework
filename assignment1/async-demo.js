const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");

const myPath = path.join(__dirname, "sample-files", "sample.txt");
// Write a sample file for demonstration
fsPromises
  .writeFile(myPath, "Hello, async world!")
  .then(() => {
    // 1. Callback style
    fs.readFile(myPath, "utf8", (err, data) => {
      if (err) {
        console.error("File read failed:", err.message);
        return;
      }

      console.log("callback:", data);

      // Callback hell example (test and leave it in comments):
      // what this is doing is it's pointing to sample files by using path and pulling information from sample-files by using join. __dirname is also helping pointing to the name of the folder because without it it would struggle to find the post.

      // 2. Promise style
      fsPromises
        .readFile(myPath, "utf8")
        .then((data) => {
          console.log("promise:", data);

          run();
        })
        .catch((err) => {
          console.log("An error occurred:", err.message);
        });
    });
  })
  .catch((err) => {
    console.log("File creation failed:", err.message);
  });

// 3. Async/Await style
async function run() {
  try {
    const result = await fsPromises.readFile(myPath, "utf8");
    console.log("async/await:", result);
  } catch (err) {
    console.log("Something went wrong:", err.message);
  }
}
