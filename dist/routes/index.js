import { Router } from 'express';
import embeddingsController from '../controllers/embeddingsController';
const router = Router();
router.get('/search', embeddingsController.search);
export default router;
//# sourceMappingURL=index.js.map