const app = require("./src/app");
const connectDB = require("./src/config/db");
const runProductCron = require("./src/jobs/productCron");

const PORT = process.env.PORT || 5000;

connectDB();
runProductCron();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
