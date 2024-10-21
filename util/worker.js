/**
 * Manage queues and jobs when verify blacklisting tickets;
 */
import Tickets from '../services/tickets';

const Queue = require('bull');

const ticketVerificationQueue = new Queue('verification_queue');

// eslint-disable-next-line jest/require-hook
ticketVerificationQueue.process(async (job) => {
  console.log(`Processing job ${job.id}`);

  return Tickets.verifyTicket(job.data);
}).then(() => {
  console.log('Job done');
});

export default ticketVerificationQueue;
