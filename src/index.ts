import 'module-alias/register';

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import treeRoutes from './routes/tree.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/trees', treeRoutes);

app.get('/', (_req, res) => {
  res.send('TreeByte API is running 🌱');
});

app.listen(PORT, () => {
  console.log(`🌿 TreeByte server is growing strong on port ${PORT}!`);
  console.log('🌱 Planting trust, one tree at a time.');
  console.log('🌳 Backend running...');
});

