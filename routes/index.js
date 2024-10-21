import { Router } from 'express';
import AppController from '../controllers/AppController';

const router = Router();

/**
 * Routes for checking the health of the server
 */
router.get('/health', AppController.health);

export default router;
