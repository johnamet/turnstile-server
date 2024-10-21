/**
 * Tickets management service
 *
 * This class provides methods to manage and validate event
 * tickets using JWT tokens and Redis for caching.
 * It ensures that tickets are verified, validated,
 * and prevents issues such as duplicate entry, blacklisted tickets, and capacity overflows.
 */

import jwt, { TokenExpiredError } from 'jsonwebtoken';
import cache from '../util/cache';

class Tickets {
  /**
   * Verifies the JWT token passed
   *
   * This method decodes and verifies the given JWT token
   * using the secret key stored in the environment.
   * It throws an error if the token is invalid or expired.
   *
   * @param {string} token - The JWT token to verify.
   * @returns {Object} - The decoded JWT payload if verification is successful.
   * @throws {Error} - Throws an error if the token is invalid or expired.
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new Error('Token has expired');
      } else {
        throw new Error('Invalid token');
      }
    }
  }

  /**
   * Validates the JWT token's issuer.
   * @param {Object} decode - The decoded token.
   * @throws {Error} - Throws an error if the issuer is invalid.
   */
  static validateIssuer(decode) {
    if (decode.issuer !== process.env.ISS) {
      throw new Error(`Ticket was not issued by ${process.env.ISS}`);
    }
  }

  /**
   * Checks if the ticket is expired.
   * @param {Object} decode - The decoded token.
   * @throws {Error} - Throws an error if the ticket is expired.
   */
  static checkTicketExpiry(decode) {
    if (new Date(decode.valid_until).getTime() < Date.now()) {
      throw new Error('Ticket has expired');
    }
  }

  /**
   * Validates the event ID against the current event.
   * @param {Object} decode - The decoded token.
   * @param {Object} event - The current event data.
   * @throws {Error} - Throws an error if the event ID does not match.
   */
  static validateEventId(decode, event) {
    if (decode.event_id !== event.id) {
      throw new Error('The event ID does not match the current event');
    }
  }

  /**
   * Checks if the ticket is blacklisted.
   * @param {string} ticketId - The ticket ID.
   * @throws {Error} - Throws an error if the ticket is blacklisted.
   */
  static async checkBlacklisted(ticketId) {
    const isBlacklisted = await cache.get(`blacklist:${ticketId}`);
    if (isBlacklisted) {
      throw new Error('Ticket has been blacklisted');
    }
  }

  /**
   * Checks if the ticket has been revoked.
   * @param {string} ticketId - The ticket ID.
   * @throws {Error} - Throws an error if the ticket is revoked.
   */
  static async checkRevoked(ticketId) {
    const isRevoked = await cache.get(`revoked:${ticketId}`);
    if (isRevoked) {
      throw new Error('This ticket has been revoked');
    }
  }

  /**
   * Checks for concurrent processing on the ticket.
   * @param {string} ticketId - The ticket ID.
   * @throws {Error} - Throws an error if the ticket is being processed.
   */
  static async checkConcurrentProcessing(ticketId) {
    const checkLock = await cache.get(`lock:${ticketId}`);
    if (checkLock) {
      throw new Error('Ticket is being processed, please wait');
    }
  }

  /**
   * Handles the validation of tickets for an event.
   *
   * @param {string} token - The JWT token holding the data of the ticket.
   * @param {string} deviceKey - The scanning device serial number
   * @param {string} time - The time qr code was scanned
   * @returns {Promise<Object>} - An object containing the ticket's
   * validity information or an error message.
   * @throws {Error} - Throws an error if any validation step fails.
   */
  static async verifyTicket(token, deviceKey, time) {
    let decode; // Decoded token data
    try {
      // Fetch the current event data from cache
      const event = await cache.hGetAll('current_event');
      if (!event) throw new Error('No current event found');

      // Decode and verify the ticket's token
      decode = await Tickets.verifyToken(token);

      // Validate issuer, expiry, and event ID
      Tickets.validateIssuer(decode);
      Tickets.checkTicketExpiry(decode);
      Tickets.validateEventId(decode, event);

      // Check blacklist and revoked status
      await Tickets.checkBlacklisted(decode.ticket_id);
      await Tickets.checkRevoked(decode.ticket_id);

      // Prevent concurrent processing
      await Tickets.checkConcurrentProcessing(decode.ticket_id);

      // Lock the ticket for processing
      await cache.set(`lock:${decode.ticket_id}`, decode.ticket_id, { ttl: 30 });

      // Check if the event is at full capacity
      const attendeesCount = await cache.get('current_attendees_count') || 0;
      if (attendeesCount >= event.max_capacity) {
        throw new Error('Event is at full capacity');
      }

      // Retrieve ticket information from Redis
      const checkValidity = await cache.hGetAll(`ticket:${decode.ticket_id}`);

      // If ticket data does not exist, create a new entry in Redis
      if (!checkValidity || Object.keys(checkValidity).length === 0) {
        const newTicketData = {
          ...decode,
          status: 'valid',
          scanned: new Date(time),
          device_id: deviceKey,
          entry_status: 'in',
          entry_count: 1, // Initialize entry count for first entry
        };

        // Save the new ticket data in Redis
        await cache.hSet(`ticket:${decode.ticket_id}`, newTicketData);

        // Increment the attendee count for the event
        await cache.set('current_attendees_count', attendeesCount + 1);

        return newTicketData; // Return the newly created ticket data
      }

      // Handle tickets that have already been scanned and are valid
      if (checkValidity.status === 'valid') {
        if (checkValidity.entry_status === 'in') {
          // If the ticket holder is already inside the event
          throw new Error('Ticket has already been used for entry. The client is still inside the event center');
        } else if (checkValidity.entry_count >= event.max_entries) {
          // If the ticket has reached its maximum allowed entries
          throw new Error('Ticket has reached the maximum number of allowed entries');
        } else {
          // Allow re-entry, update the ticket's status and increment the entry count
          checkValidity.entry_status = 'in';
          checkValidity.entry_count += 1;

          // Update the ticket data in Redis
          await cache.hSet(`ticket:${checkValidity.ticket_id}`, checkValidity);

          // Increment the attendees count again for re-entry
          await cache.set('current_attendees_count', attendeesCount + 1);

          return checkValidity; // Return the updated ticket data
        }
      }

      // If the ticket is invalid or revoked, throw an error
      throw new Error('Ticket is invalid or has been revoked');
    } catch (error) {
      console.error(`Ticket validation failed: ${error.message}`);
      throw error;
    } finally {
      // Ensure the lock is always removed after processing
      if (decode) {
        await cache.del(`lock:${decode.ticket_id}`);
      }
    }
  }
}

export default Tickets;
