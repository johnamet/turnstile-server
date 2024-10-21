/**
 * Route for event management
 */
import { Router } from 'express';
import EventController from '../controllers/EventController';

const eventRoute = Router();

eventRoute.post('/set-event/', EventController.setEvent);
eventRoute.delete('/delete-event', EventController.deleteEvent);
eventRoute.get('/event', EventController.getEvent);

export default eventRoute;