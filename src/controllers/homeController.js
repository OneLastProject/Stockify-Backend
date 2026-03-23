const mongoose = require("mongoose");
const Statistics = require("../models/statisticsSchema");
const Product = require("../models/productSchema");

exports.getChartData = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const period = req.query.period || "weekly";
    const SLOTS = 12;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const now = new Date();
    let slots = [];
    let groupBy;

    if (period === "weekly") {
      // Last 12 weeks, label = "Mon DD"
      for (let i = SLOTS - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        slots.push({
          key: `${d.getFullYear()}-W${String(Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 604800000) + 1).padStart(2, "0")}`,
          label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          year: d.getFullYear(),
          week: Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 604800000) + 1,
        });
      }
      groupBy = {
        year: { $year: "$createdAt" },
        week: { $week: "$createdAt" },
      };
    } else if (period === "monthly") {
      // Last 12 months
      for (let i = SLOTS - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        slots.push({
          key: `${d.getFullYear()}-${d.getMonth() + 1}`,
          label: months[d.getMonth()],
          year: d.getFullYear(),
          month: d.getMonth() + 1,
        });
      }
      groupBy = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
    } else {
      // Last 12 years
      for (let i = SLOTS - 1; i >= 0; i--) {
        const y = now.getFullYear() - i;
        slots.push({ key: String(y), label: String(y), year: y });
      }
      groupBy = { year: { $year: "$createdAt" } };
    }

    const startDate = new Date(now);
    if (period === "weekly") startDate.setDate(startDate.getDate() - (SLOTS - 1) * 7);
    else if (period === "monthly") startDate.setMonth(startDate.getMonth() - (SLOTS - 1));
    else startDate.setFullYear(startDate.getFullYear() - (SLOTS - 1));
    startDate.setHours(0, 0, 0, 0);

    const [purchaseData, sellData] = await Promise.all([
      Statistics.aggregate([
        { $match: { user: userId, status: "Purchase", createdAt: { $gte: startDate } } },
        { $group: { _id: groupBy, amount: { $sum: "$amount" } } },
      ]),
      Statistics.aggregate([
        { $match: { user: userId, status: "Sell", createdAt: { $gte: startDate } } },
        { $group: { _id: groupBy, amount: { $sum: "$amount" } } },
      ]),
    ]);

    const keyOfId = (id) => {
      if (period === "weekly") return `${id.year}-W${String(id.week).padStart(2, "0")}`;
      if (period === "monthly") return `${id.year}-${id.month}`;
      return String(id.year);
    };

    const purchaseMap = {};
    purchaseData.forEach((d) => { purchaseMap[keyOfId(d._id)] = Math.round(d.amount); });
    const sellMap = {};
    sellData.forEach((d) => { sellMap[keyOfId(d._id)] = Math.round(d.amount); });

    const chartData = slots.map((s) => ({
      period: s.label,
      purchase: purchaseMap[s.key] || 0,
      sales: sellMap[s.key] || 0,
    }));

    return res.status(200).json({ chartData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getHomeStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [sellAgg, purchaseAgg, allProducts, categories, topProductIds] = await Promise.all([
      Statistics.aggregate([
        { $match: { user: userId, status: "Sell" } },
        { $group: { _id: null, totalUnits: { $sum: "$unit" }, totalAmount: { $sum: "$amount" } } },
      ]),
      Statistics.aggregate([
        { $match: { user: userId, status: "Purchase" } },
        { $group: { _id: null, totalUnits: { $sum: "$unit" }, totalAmount: { $sum: "$amount" } } },
      ]),
      Product.find({ createdBy: req.user.id }, "unit"),
      Product.distinct("category", { createdBy: req.user.id }),
      Statistics.aggregate([
        { $match: { user: userId, status: "Sell" } },
        { $group: { _id: "$product", totalUnits: { $sum: "$unit" } } },
        { $sort: { totalUnits: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [currSell, prevSell, currPurchase] = await Promise.all([
      Statistics.aggregate([
        { $match: { user: userId, status: "Sell", createdAt: { $gte: thisMonthStart } } },
        { $group: { _id: null, totalUnits: { $sum: "$unit" }, totalAmount: { $sum: "$amount" } } },
      ]),
      Statistics.aggregate([
        { $match: { user: userId, status: "Sell", createdAt: { $gte: prevMonthStart, $lt: thisMonthStart } } },
        { $group: { _id: null, totalUnits: { $sum: "$unit" }, totalAmount: { $sum: "$amount" } } },
      ]),
      Statistics.aggregate([
        { $match: { user: userId, status: "Purchase", createdAt: { $gte: thisMonthStart } } },
        { $group: { _id: null, totalUnits: { $sum: "$unit" } } },
      ]),
    ]);

    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? null : 0; // null = infinite
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    const currRevenue = currSell[0]?.totalAmount || 0;
    const prevRevenue = prevSell[0]?.totalAmount || 0;
    const currSoldUnits = currSell[0]?.totalUnits || 0;
    const prevSoldUnits = prevSell[0]?.totalUnits || 0;
    const currPurchaseUnits = currPurchase[0]?.totalUnits || 0;

    const revenue = sellAgg[0]?.totalAmount || 0;
    const salesUnits = sellAgg[0]?.totalUnits || 0;
    const salesCost = parseFloat((revenue / 1.15).toFixed(2));
    const profit = parseFloat((revenue - salesCost).toFixed(2));

    const purchaseUnits = purchaseAgg[0]?.totalUnits || 0;
    const purchaseCost = purchaseAgg[0]?.totalAmount || 0;

    const inStock = allProducts.reduce((sum, p) => sum + p.unit, 0);

    const topProductIdList = topProductIds.map((t) => t._id);
    const topProductDocs = await Product.find({ _id: { $in: topProductIdList } }, "name _id");
    const nameMap = {};
    topProductDocs.forEach((p) => { nameMap[p._id.toString()] = p.name; });
    const topProducts = topProductIds.map((t) => ({ name: nameMap[t._id.toString()] || "Unknown" }));

    return res.status(200).json({
      salesUnits,
      revenue,
      salesCost,
      profit,
      purchaseUnits,
      purchaseCost,
      inStock,
      categories: categories.length,
      topProducts,
      monthlyChange: {
        revenue: calcChange(currRevenue, prevRevenue),
        soldUnits: calcChange(currSoldUnits, prevSoldUnits),
        inStock: calcChange(inStock, inStock + currSoldUnits - currPurchaseUnits),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
