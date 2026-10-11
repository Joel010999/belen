import express from 'express';
import prisma from '../lib/prisma';
import { verifyPassword, hashPassword, needsPasswordUpgrade } from '../utils/passwordUtils';
import { createSessionToken } from '../utils/tokenUtils';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contrasena son requeridos' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { machine: true }
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Progressive migration: Upgrade legacy plain text passwords to scrypt automatically on valid login
    if (needsPasswordUpgrade(user.passwordHash)) {
      try {
        const secureHash = hashPassword(password);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: secureHash }
        });
      } catch (upgradeErr) {
        // Log non-fatal upgrade error; do not block login
        console.warn(`Could not upgrade password hash for user ${user.username}:`, upgradeErr);
      }
    }

    // Generate signed, expiring session token
    const token = createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      machineId: user.machineId
    });

    res.json({
      token,
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      machine: user.machine
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        machine: true
      }
    });

    if (!user || !user.active) {
      return res.status(404).json({ error: 'Usuario no encontrado o inactivo' });
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/change-password', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Contraseña actual y nueva requeridas' });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
    }

    const secureHash = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: secureHash }
    });

    res.json({ success: true, message: 'Contraseña actualizada correctamente con hash seguro scrypt' });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Error al actualizar contraseña' });
  }
});

export default router;
