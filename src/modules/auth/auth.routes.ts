import { Router } from 'express';
import * as ctrl from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.put('/change-password', authenticate, ctrl.changePassword);
router.get('/sessions', authenticate, ctrl.getSessions);
router.delete('/sessions/:tokenFamily', authenticate, ctrl.revokeSession);

export default router;
