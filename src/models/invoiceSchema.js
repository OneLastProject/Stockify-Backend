const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      unique: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    unitsBought: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
    dueDate: {
      type: Date,
    },
    pdfPath: {
      type: String,
    },
    htmlPath: {
      type: String,
    },
  },
  { timestamps: true }
);

invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceId) {
    const last = await mongoose.model("Invoice").findOne({}, {}, { sort: { createdAt: -1 } });
    const lastNumber = last ? parseInt(last.invoiceId.split("-")[1]) : 1000;
    this.invoiceId = `INV-${lastNumber + 1}`;
  }

  if (!this.dueDate) {
    const due = new Date(this.createdAt || Date.now());
    due.setDate(due.getDate() + 10);
    this.dueDate = due;
  }

  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);
