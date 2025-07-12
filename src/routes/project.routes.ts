import { Router } from 'express';
import { registerProjectController } from '@/controllers/project.controller'; 

const router = Router();

router.post('/register', registerProjectController); 

export default router;
