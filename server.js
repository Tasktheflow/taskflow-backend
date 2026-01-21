const http = require("http");
const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./src/app");

require("./src/cron/cleanup.cron");

const PORT = process.env.PORT 
const MONGO_URI = process.env.MONGO_URI;

const server = http.createServer(app);

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    //require("./src/cron/cleanup.tasks");
      //require("./src/cron/cleanup.projects");
      
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));


