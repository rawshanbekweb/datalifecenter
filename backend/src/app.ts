import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';
import { UPLOADS_ROOT } from './config/uploads';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Yuklangan fayllar — nomlari tasodifiy bo'lgani uchun uzoq keshlash xavfsiz
app.use('/uploads', express.static(UPLOADS_ROOT, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
