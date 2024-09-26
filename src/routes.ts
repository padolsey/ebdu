// src/routes/index.ts
import { Router } from 'express';
import embeddingsController from './controllers/embeddingsController';
import uiController from './controllers/uiController';

const router = Router();

router.get('/search', embeddingsController.search);
router.get('/ui', uiController.renderForm);
router.post('/ui', uiController.handleFormSubmission);

export default router;
