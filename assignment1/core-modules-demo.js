const os = require("os");
const path = require("path");
const fsPromises = require("fs/promises");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
const platform = os.platform();
const architecture = os.arch();
const cpus = os.cpus();
const cpuModel = cpus[0].model;

const bytesToGB = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(2);
const totalMemory = bytesToGB(os.totalmem());
console.log(`Platform:     ${platform} (${architecture})`);
console.log(`CPU:    ${cpuModel}`);
console.log(`Total Memory: ${totalMemory} GB`);
// Path module
const myPath = path.join(sampleFilesDir, "demo.txt");
console.log("Joined path:", myPath);
// fs.promises API
async function demo() {
  try {
    await fsPromises.writeFile(myPath, "Hello from fs.promises!");
    const data = await fsPromises.readFile(myPath, "utf8");
    console.log("fs.promises read:", data);
  } catch (err) {
    console.log("File operation failed:", err.message);
  }
}
demo();
// Streams for large files- log first 40 chars of each chunk
