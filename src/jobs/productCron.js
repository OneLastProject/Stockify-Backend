const cron = require("node-cron");
const Product = require("../models/productSchema");

const runProductCron = () => {
  // Runs every day at 11:59:59 PM
  cron.schedule("59 59 23 * * *", async () => {
    try {
      const now = new Date();

      // Mark expired products
      const expiredResult = await Product.updateMany(
        { expiryDate: { $lt: now }, stockDetails: { $ne: "Expired" } },
        { $set: { stockDetails: "Expired" } }
      );

      // Delete out-of-stock products
      const deleteResult = await Product.deleteMany({ unit: { $lte: 0 } });

      console.log(
        `[Cron] Marked ${expiredResult.modifiedCount} product(s) as Expired. Deleted ${deleteResult.deletedCount} out-of-stock product(s).`
      );
    } catch (error) {
      console.error("[Cron] Error running product cron:", error.message);
    }
  });

  console.log("[Cron] Product cron job scheduled at 23:59:59 daily.");
};

module.exports = runProductCron;
