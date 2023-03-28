const mongoose = require("mongoose");

module.exports = mongoose.model("Generation", new mongoose.Schema({
    id: { type: Number, required: true, default: "1" },
    Generation: { type: Number, required: true },
    CPUhours: { type: Number, required: true, default: 0 },
    Lastmessage: { type: String, required: true },
    Lastintent: { type: String, required: true },
}));