const Docker = require('dockerode');
const UserSchema = require('../../Database/Schema/user.js');

module.exports = (router, client) => {
  router.post('/logs', async (req, res) => {
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

    const logs = [];
    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    logStream.on('data', (chunk) => {
      logs.push(chunk.toString('utf8'));
    });

    logStream.on('end', () => {
      return res.status(200).json({
        logs: logs.join(''),
        statusCode: 200,
      });
    });
  });
};
