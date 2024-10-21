/* eslint-disable jest/require-hook */
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import router from './routes';
import eventRoute from './routes/eventRoute';
import verificationRoute from './routes/verificationRoute';

const app = express();

// eslint-disable-next-line jest/require-hook
app.use(express.json());

app.use(helmet());

app.use(morgan('tiny'));
dotenv.config();

const corsOptions = {
  origin: '*', // Allows all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowable methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

app.use('/turnstile-callback', cors(corsOptions));

app.use((req, res, next) => {
  const originalSend = res.send;
  // eslint-disable-next-line func-names
  res.send = function (body) {
    if (typeof body === 'object') {
      // eslint-disable-next-line no-param-reassign
      body = JSON.stringify(body, null, 2); // Pretty-print with 4 spaces
      res.setHeader('Content-Type', 'application/json');
    }
    originalSend.call(this, body);
  };
  next();
});

app.use('/turnstile-callback', router);
app.use('/turnstile-callback', eventRoute);
app.use('/turnstile-callback', verificationRoute);

app.listen(9000, () => {
  console.log('Server is running on port 9000');
});

export default app;
