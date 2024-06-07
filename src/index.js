import dotenv from "dotenv";
import connectedDB from "./db/connection.js";
import app from "./app.js";

// Config Env Variable
dotenv.config({ path: "./env" });
// Run database connection when app is load
connectedDB()
  .then(() => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`Server is listing on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB Connection Error`, error);
  });
