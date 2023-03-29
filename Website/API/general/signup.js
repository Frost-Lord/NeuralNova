module.exports = (router, client) => {
    router.post("/register", async (req, res) => {
        let UserSchema = require("../../Database/Schema/user.js");

        let { name, password, email, key } = req.body;
        if (!name || !password || !email || !key)
          return res.status(200).send({ error: "Please fill all fields" });
        if (key !== "94th98dr0gh7d9grfh79d0gfr7hd90rfgh7d8fr7hg7")
          return res.status(200).send({ error: "Invalid key" });
      
        if (email.includes("+")) {
          return res.status(200).send({ error: "Invalid email" });
        }
      
        if (name.length < 4) {
          return res.status(200).send({ error: "Username too short" });
        }
      
        if (password.length < 6) {
          return res.status(200).send({ error: "Password too short (Must be 6)" });
        }
      
        let user = await UserSchema.findOne({ email: email });
        if (user) return res.status(200).send("User already exists");
      
        let letters = [
          "a",
          "b",
          "c",
          "d",
          "e",
          "f",
          "g",
          "h",
          "i",
          "j",
          "k",
          "l",
          "m",
          "n",
          "o",
          "p",
          "q",
          "r",
          "s",
          "t",
          "u",
          "v",
          "w",
          "x",
          "y",
          "z",
        ];
        let numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
        let usertoken = "";
        for (let i = 0; i < 50; i++) {
          let random = Math.floor(Math.random() * 2);
          if (random == 0) {
            usertoken += letters[Math.floor(Math.random() * letters.length)];
          } else {
            usertoken += numbers[Math.floor(Math.random() * numbers.length)];
          }
        }

        let localuser = new UserSchema({
            id: usertoken,
            name: name,
            password: password,
            email: email,
            instances: [],
          });
          await localuser.save();
          console.log("Event Register [Auth]: " + name);

          return res.status(200).json({
            statusCode: 404,
          });
    });
}