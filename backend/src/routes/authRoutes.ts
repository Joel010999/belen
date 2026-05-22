import express from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { machine: true }
    });

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // In a real app, we would return a JWT. 
    // For this simple industrial system, we'll return the user info.
    res.json({
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

export default router;
