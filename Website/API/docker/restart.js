const Docker = require('dockerode');
const UserSchema = require("../../Database/Schema/user.js");

module.exports = (router, client) => {
  router.post('/restart', async (req, res) => {
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
    const container = docker.getContainer(dockerid.slice(0, 12));

    container.restart((err) => {
      if (err) {
        return res.status(500).json({
          error: 'Error restarting container',
          statusCode: 500,
        });
      }

      return res.status(200).json({
        message: 'Container restarted',
        statusCode: 200,
      });
    });
  });
};
