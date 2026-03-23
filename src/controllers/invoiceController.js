const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const Invoice = require("../models/invoiceSchema");

const deleteFile = (filePath) => {
  if (!filePath) return;
  const abs = path.join(__dirname, "../../", filePath);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
};

exports.viewInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.id });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (!invoice.htmlPath) return res.status(404).json({ message: "Invoice not available" });

    return res.status(200).json({ url: `http://localhost:5000/${invoice.htmlPath}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.id });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (!invoice.pdfPath) return res.status(404).json({ message: "PDF not available" });

    const absPath = path.join(__dirname, "../../", invoice.pdfPath);
    res.download(absPath, `${invoice.invoiceId}.pdf`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.id });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    invoice.status = invoice.status === "Unpaid" ? "Paid" : "Unpaid";
    await invoice.save();

    return res.status(200).json({ message: "Status updated", status: invoice.status });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    deleteFile(invoice.htmlPath);
    deleteFile(invoice.pdfPath);

    return res.status(200).json({ message: "Invoice deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [total, invoices, recentTransactions, paidAgg, unpaidAgg] = await Promise.all([
      Invoice.countDocuments({ user: userId }),
      Invoice.find({ user: userId })
        .populate("product", "name price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments({ user: userId, createdAt: { $gte: sevenDaysAgo } }),
      Invoice.aggregate([
        { $match: { user: userId, status: "Paid" } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } },
      ]),
      Invoice.aggregate([
        { $match: { user: userId, status: "Unpaid" } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } },
      ]),
    ]);

    const paidCount = paidAgg[0]?.count || 0;
    const paidAmount = paidAgg[0]?.amount || 0;
    const unpaidCount = unpaidAgg[0]?.count || 0;
    const unpaidAmount = unpaidAgg[0]?.amount || 0;

    return res.status(200).json({
      invoices,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      stats: {
        recentTransactions,
        totalInvoices: total,
        paidCount,
        paidAmount,
        unpaidCount,
        unpaidAmount,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
