/**
 * AppController handles checks on the server to make sure
 * eveything is working and active
 */
import cache from '../util/cache';

class AppController {
  static async health(req, res) {
    const redis = await cache.isLive();

    if (redis) {
      return res.status(200).send({
        status: 'Ok',
        redis,
      });
    }
    return res.status(500).send({
      status: 'error',
      message: 'Redis is not active',
    });
  }
}

export default AppController;
