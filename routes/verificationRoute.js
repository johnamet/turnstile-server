/**
 * Router to verify tickets
 */
import { Router } from 'express';
import VerificationController from '../controllers/VerificationController';

const verificationRoute = Router();

verificationRoute.post('/verify-ticket', VerificationController.verifyTicket);

export default verificationRoute;