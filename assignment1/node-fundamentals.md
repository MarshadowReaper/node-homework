# Node.js Fundamentals

## What is Node.js?

Node is like javascript that runs on your computer instead of your browser sandbox. Node also works on the backend.

## How does Node.js differ from running JavaScript in the browser?

Node doesn't run inside a browser rather it runs from your pc then sends the info into the browser.

## What is the V8 engine, and how does Node use it?

It's an engine that is programmed to read JavaScript and turns it into instructions the computer can run.

## What are some key use cases for Node.js?

It works with files, processes, servers, and backend APIs

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

The difference lies in the syntax, The syntax in Es module will require us to use "import" to pull things from another file or package. CommonJS has us use require() which loads another file or package and destructuring pulls from the specific value
**CommonJS (default in Node.js):**

```js
const { register, logoff } = require("../controllers/userController");
```

**ES Modules (supported in modern Node.js):**

```js
import { useState, useEffect } from "react";
```
