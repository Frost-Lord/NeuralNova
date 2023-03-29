module.exports = (router, client) => {
    router.post("/login", async (req, res) => {
        let UserSchema = require("../../Database/Schema/user.js");
        let { email, password } = req.body;
        let localuser = await UserSchema.findOne({ email: email });
        if (localuser) {
            if (localuser.password !== password) {
                return res.status(200).json({
                    error: "Invalid Password",
                    statusCode: 400,
                });
            }
            if (localuser.password === password) {
                if (!req.session) {
                    req.session = {};
                }
                req.session.user = localuser;
                req.session.save();
                return res.json({ localuser });
            }
        } else {
            return res.status(200).json({
                error: "Invalid User",
                statusCode: 400,
            });
        }
    });
}