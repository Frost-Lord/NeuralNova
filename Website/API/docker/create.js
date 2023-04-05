const Docker = require("dockerode");
const UserSchema = require("../../Database/Schema/user.js");

module.exports = (router, client) => {
    router.post("/create", async (req, res) => {
        const { name, orgtype, token, mongodb, file, userid } = req.body;
        if (!name || !orgtype || !token || !mongodb || !file || !userid) {
            return res.status(200).json({
                error: "Please fill all fields",
                statusCode: 400,
            });
        }

        const user = await UserSchema.findOne({ id: userid });
        if (!user) {
            return res.status(200).json({
                error: "Invalid User",
                statusCode: 400,
            });
        }


        const fileAsString = typeof file === 'object' ? JSON.stringify(file) : file;
        const docker = new Docker();
        const containerOptions = {
            Image: 'ai',
            Env: [`TOKEN=${token}`, `MONGOURI=${mongodb}`, `TRAININGDATA=${fileAsString}`],
            Tty: true,
        };

        try {
            const container = await docker.createContainer(containerOptions);
            await container.start((err) => {
                if (err) {
                  console.log('Error starting container:', err);
                  return;
                }
      
                console.log('Container started');
              });
            const containerId = container.id;

            if (!user.instances) {
                user.instances = [];
            }

            const newInstance = {
                name: name,
                orgtype: orgtype,
                token: token,
                mongodb: mongodb,
                file: file,
                containerId: containerId,
            };
            user.instances.push(newInstance);
            await user.save().catch(err => console.log(err));

            return res.status(200).json({
                success: "true",
                instance: containerId,
                statusCode: 200,
            });

        } catch (err) {
            console.log(err);
            return res.status(200).json({
                error: "Error creating container",
                statusCode: 400,
            });
        }
    });
};
