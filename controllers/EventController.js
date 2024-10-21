import cache from '../util/cache';

/**
 * EventController handles the management of events for ticket validation.
 * It provides methods to set, get, and delete the current event from the cache.
 */
class EventController {
  /**
   * Sets the current event in the cache.
   *
   * @param {Object} req - The request object containing the event data.
   * @param {Object} res - The response object used to send responses back to the client.
   *
   * @returns {Promise<void>} - Returns a promise that resolves to void.
   *
   * @throws {Error} - Throws an error if any unexpected issue occurs while setting the event.
   */
  // eslint-disable-next-line consistent-return
  static setEvent(req, res) {
    try {
      const {
        // eslint-disable-next-line camelcase
        event_id, capacity, event_name, event_validity,
      } = req.body;

      // Validate required fields
      // eslint-disable-next-line camelcase
      if (!event_id || !capacity || !event_name || !event_validity) {
        return res.status(400).send({
          error: 'One or more required fields not set: capacity, event_id, event_name, or event_validity',
          success: false,
        });
      }

      // Set the event in cache
      cache.hSet('current_event', {
        // eslint-disable-next-line camelcase
        id: event_id,
        // eslint-disable-next-line camelcase
        name: event_name,
        max_capacity: capacity,
        // eslint-disable-next-line camelcase
        validity: event_validity,
      }).then(() => res.status(200).send({
        msg: 'Current event updated',
        success: true,
      })).catch((error) => {
        console.error(`Error setting event: ${error}`);
        return res.status(500).send({
          error: 'Something went wrong while updating the event',
          success: false,
        });
      });
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
      return res.status(500).send({
        error: 'Something went wrong',
        success: false,
      });
    }
  }

  /**
   * Retrieves the current event from the cache.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object used to send responses back to the client.
   *
   * @returns {Promise<void>} - Returns a promise that resolves to void.
   *
   * @throws {Error} - Throws an error if any unexpected issue occurs while retrieving the event.
   */
  static async getEvent(req, res) {
    try {
      const event = await cache.hGetAll('current_event');
      if (!event) {
        return res.status(404).send({
          error: 'No current event found',
          success: false,
        });
      }

      return res.status(200).send({
        event,
        success: true,
      });
    } catch (error) {
      console.error(`Error retrieving event: ${error}`);
      return res.status(500).send({
        error: 'Something went wrong while retrieving the event',
        success: false,
      });
    }
  }

  /**
   * Deletes the current event from the cache.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object used to send responses back to the client.
   *
   * @returns {Promise<void>} - Returns a promise that resolves to void.
   *
   * @throws {Error} - Throws an error if any unexpected issue occurs while deleting the event.
   */
  static async deleteEvent(req, res) {
    try {
      await cache.del('current_event');
      return res.status(200).send({
        msg: 'Current event deleted successfully',
        success: true,
      });
    } catch (error) {
      console.error(`Error deleting event: ${error}`);
      return res.status(500).send({
        error: 'Something went wrong while deleting the event',
        success: false,
      });
    }
  }
}

export default EventController;
