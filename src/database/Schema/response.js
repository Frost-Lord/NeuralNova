const mongoose = require("mongoose");

module.exports = mongoose.model("Response", new mongoose.Schema({
    code: { type: String, required: true },
    title: { type: String, required: true },
    response: { type: String, required: true },
}));