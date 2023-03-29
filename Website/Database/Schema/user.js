const mongoose = require("mongoose");

module.exports = mongoose.model("User", new mongoose.Schema({
    id: { type: String, default: null },
    name: { type: String, default: null },
    password: { type: String, default: null },
    email: { type: String, default: null },
    instances: { type: Array, default: [] },
    registeredAt: { type: Number, default: Date.now() },
}));