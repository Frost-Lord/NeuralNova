const Docker = require('dockerode');
const UserSchema = require("../../Database/Schema/user.js");

module.exports = (router, client) => {
  router.post('/start', async (req, res) => {
    const { dockerid, userid } = req.body;
    if (!dockerid || !userid) {
      return res.status(400).json({
        error: 'Please fill all fields',
        statusCode: 400,
      });
    }

    const user = await UserSchema.findOne({ id: userid });
    if (!user) {
      return res.status(400).json({
        error: 'Invalid User',
        statusCode: 400,
      });
    }

    const docker = new Docker();
    const container = await docker.getContainer(dockerid.slice(0, 12));

    container.start((err) => {
      if (err) {
        return res.status(200).json({
          error: 'Error starting container',
          statusCode: 500,
        });
      }

      console.log('Container Started');
      return res.status(200).json({
        message: 'Container Started successfully',
        statusCode: 200,
      });
    });
  });
};
