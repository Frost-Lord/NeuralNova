const mongoose = require("mongoose");

module.exports = mongoose.model("Training", new mongoose.Schema({
    text: { type: String, required: true },
    intent: { type: String, required: true },
}));