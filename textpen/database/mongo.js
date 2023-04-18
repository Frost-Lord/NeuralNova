TrainingSchema = require("./Schema/training.js");
ResponseSchema = require("./Schema/response.js");
MessageSchema = require("./Schema/messages.js");
GenerationSchema = require("./Schema/generation.js");

module.exports.fetchTraining = async function (key) {
    let TrainingData = await TrainingSchema.findOne({ name: key });

    if (TrainingData) {
        return TrainingData;
    } else {
        TrainingData = new TrainingSchema({
            text: key,
            registeredAt: Date.now()
        })
        await TrainingData.save().catch(err => console.log(err));
        return TrainingData;
    }
};

module.exports.fetchResponse = async function (key) {
    let Code = await ResponseSchema.findOne({ name: key });

    if (Code) {
        return Code;
    } else {
        Code = new ResponseSchema({
            code: key,
            registeredAt: Date.now()
        })
        await Code.save().catch(err => console.log(err));
        return Code;
    }
};

module.exports.fetchMessages = async function (key) {
    let message = await MessageSchema.findOne({ name: key });

    if (message) {
        return message;
    } else {
        message = new MessageSchema({
            messageid: key,
            registeredAt: Date.now()
        })
        await message.save().catch(err => console.log(err));
        return message;
    }
};

module.exports.fetchGen = async function (key) {
    let gen = await MessageSchema.findOne({ id: key });

    if (gen) {
        return gen;
    } else {
        gen = new MessageSchema({
            id: key,
            registeredAt: Date.now()
        })
        await gen.save().catch(err => console.log(err));
        return gen;
    }
};