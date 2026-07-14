import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { api } from './routes.js';
import { seed } from './seed.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin/no-origin (curl, health checks) and configured origins.
      if (!origin || config.corsOrigins.includes(origin) || config.corsOrigins.includes('*'))
        return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use('/api', api);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler — never leak stack traces to clients.
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.message === 'Not allowed by CORS') return res.status(403).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  },
);

seed();

app.listen(config.port, () => {
  console.log(`✔ FacilityFlow API listening on http://localhost:${config.port}`);
  console.log(`  Health check: http://localhost:${config.port}/api/health`);
});
