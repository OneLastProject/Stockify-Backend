const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    image: {
      type: String,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    productId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    thresholdValue: {
      type: Number,
      required: true,
    },
    stockDetails: {
      type: String,
      enum: ["In-stock", "Low stock", "Out of stock", "Expired"],
      default: "In-stock",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-calculate stockDetails before every save (skip if already Expired)
productSchema.pre("save", function (next) {
  if (this.stockDetails === "Expired") return next();
  if (this.unit <= 0) {
    this.stockDetails = "Out of stock";
  } else if (this.unit <= this.thresholdValue) {
    this.stockDetails = "Low stock";
  } else {
    this.stockDetails = "In-stock";
  }
  next();
});

// Also recalculate on findOneAndUpdate
productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  const unit = update.unit;
  const thresholdValue = update.thresholdValue;

  if (unit !== undefined && thresholdValue !== undefined) {
    if (unit <= 0) {
      update.stockDetails = "Out of stock";
    } else if (unit <= thresholdValue) {
      update.stockDetails = "Low stock";
    } else {
      update.stockDetails = "In-stock";
    }
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
