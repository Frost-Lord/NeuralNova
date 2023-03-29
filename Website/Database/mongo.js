UserSchema = require("./Schema/user.js");

module.exports.fetchTraining = async function (key) {
    let user = await UserSchema.findOne({ id: key });

    if (user) {
        return user;
    } else {
        user = new UserSchema({
            id: key,
            registeredAt: Date.now()
        })
        await user.save().catch(err => console.log(err));
        return user;
    }
};