const mongoose = require("mongoose");

module.exports = mongoose.model("Messages", new mongoose.Schema({
    messageid: { type: String, required: true },
    correctCount: { type: Number, required: false },
    incorrectCount: { type: Number, required: false },
    adminmessageid: { type: String, required: false },
    users: { type: Array, required: false },
}));