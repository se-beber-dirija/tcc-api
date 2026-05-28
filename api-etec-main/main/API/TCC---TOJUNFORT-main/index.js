require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

const allowedRoles = ['ADMIN', 'VOLUNTARIO', 'DIRETORIA'];

const userValidationRules = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('usuario').trim().notEmpty().withMessage('Usuário é obrigatório'),
  body('email').trim().isEmail().withMessage('Email válido é obrigatório'),
  body('senha').isLength({ min: 8 }).withMessage('Senha deve ter ao menos 8 caracteres'),
  body('role').optional().isIn(allowedRoles).withMessage('Role inválido. Use ADMIN, VOLUNTARIO ou DIRETORIA.'),
  body('rgFuncional').optional().matches(/^F\d{10}$/).withMessage('RG funcional inválido. Formato esperado: F1234567890'),
];

const loginValidationRules = [
  body('usuario').trim().notEmpty().withMessage('Usuário é obrigatório'),
  body('email').trim().isEmail().withMessage('Email válido é obrigatório'),
  body('senha').notEmpty().withMessage('Senha é obrigatória'),
];

function buildValidationError(errors) {
  return {
    error: errors[0]?.msg || 'Dados inválidos',
    details: errors.map(err => ({ field: err.param, message: err.msg }))
  };
}

app.post('/api/users', userValidationRules, async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json(buildValidationError(validationErrors.array()));
  }

  try {
    const { nome, usuario, email, senha, role, rgFuncional } = req.body;
    const normalizedRole = role ? String(role).toUpperCase() : 'VOLUNTARIO';
    const isDiretoria = normalizedRole === 'DIRETORIA' || normalizedRole === 'ADMIN';
    const hashedPassword = await bcrypt.hash(senha, 10);

    const data = { nome, usuario, email, senha: hashedPassword };
    if (isDiretoria && rgFuncional) {
      data.rgFuncional = String(rgFuncional).toUpperCase().replace(/[^0-9F]/g, '');
    }

    if (isDiretoria) {
      const diret = await prisma.diretoria.create({ data });
      const { senha: _, ...safeUser } = diret;
      return res.status(201).json({ ...safeUser, role: normalizedRole });
    }

    const volunt = await prisma.voluntario.create({ data });
    const { senha: _, ...safeUser } = volunt;
    return res.status(201).json({ ...safeUser, role: 'VOLUNTARIO' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Usuário ou email já cadastrado.' });
    }
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

app.post('/api/login', loginValidationRules, async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json(buildValidationError(validationErrors.array()));
  }

  try {
    const { usuario, email, senha } = req.body;

    let user = await prisma.diretoria.findFirst({ where: { usuario, email } });
    if (user) {
      const passwordMatches = await bcrypt.compare(senha, user.senha);
      if (!passwordMatches) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      const { senha: _senha, ...safeUser } = user;
      return res.json({ ...safeUser, role: 'DIRETORIA' });
    }

    user = await prisma.voluntario.findFirst({ where: { usuario, email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const passwordMatches = await bcrypt.compare(senha, user.senha);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const { senha: _senha2, ...safeUser2 } = user;
    res.json({ ...safeUser2, role: 'VOLUNTARIO' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao validar login' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/users', async (req, res) => {
  try {
    const diret = await prisma.diretoria.findMany();
    const volunt = await prisma.voluntario.findMany();
    const users = [
      ...diret.map(u => ({ ...u, role: 'DIRETORIA' })),
      ...volunt.map(u => ({ ...u, role: 'VOLUNTARIO' }))
    ];
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

app.get('/api/users/:usuario', async (req, res) => {
  try {
    const rawUsuario = req.params.usuario || '';
    const usuario = String(rawUsuario).replace(/^@/, '').trim().toLowerCase();
    const [diret, volunt] = await Promise.all([
      prisma.diretoria.findMany(),
      prisma.voluntario.findMany(),
    ]);

    const normalize = (value) => String(value || '').trim().toLowerCase();

    const foundDiret = diret.find(user =>
      normalize(user.usuario) === usuario || normalize(user.email) === usuario
    );
    if (foundDiret) {
      const { senha, ...safeUser } = foundDiret;
      return res.json({ ...safeUser, role: 'DIRETORIA' });
    }

    const foundVolunt = volunt.find(user =>
      normalize(user.usuario) === usuario || normalize(user.email) === usuario
    );
    if (!foundVolunt) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { senha, ...safeUser } = foundVolunt;
    res.json({ ...safeUser, role: 'VOLUNTARIO' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

app.get('/api/user', async (req, res) => {
  try {
    const rawUsuario = req.query.usuario || req.query.email || '';
    const usuario = String(rawUsuario).replace(/^@/, '').trim().toLowerCase();
    if (!usuario) {
      return res.status(400).json({ error: 'Parâmetro usuario é obrigatório' });
    }

    const [diret, volunt] = await Promise.all([
      prisma.diretoria.findMany(),
      prisma.voluntario.findMany(),
    ]);

    const normalize = (value) => String(value || '').trim().toLowerCase();

    const foundDiret = diret.find(user =>
      normalize(user.usuario) === usuario || normalize(user.email) === usuario
    );
    if (foundDiret) {
      const { senha, ...safeUser } = foundDiret;
      return res.json({ ...safeUser, role: 'DIRETORIA' });
    }

    const foundVolunt = volunt.find(user =>
      normalize(user.usuario) === usuario || normalize(user.email) === usuario
    );
    if (!foundVolunt) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { senha, ...safeUser } = foundVolunt;
    res.json({ ...safeUser, role: 'VOLUNTARIO' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Rotas de Pesquisa

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

app.get('/api/search/:termo', async (req, res) => {
  const { termo } = req.params;
  console.log('Received search request for:', termo);
  try {
    const normalizedTerm = normalizeSearchText(termo);

    const [voluntarios, diretores] = await Promise.all([
      prisma.voluntario.findMany(),
      prisma.diretoria.findMany(),
    ]);

    const matchesSearch = (user) => {
      return [user.nome, user.usuario, user.email]
        .some(field => normalizeSearchText(field).includes(normalizedTerm));
    };

    res.json({
      voluntarios: voluntarios.filter(matchesSearch),
      diretores: diretores.filter(matchesSearch),
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Erro ao buscar perfis', details: String(error.message) });
  }
});

app.get('/api/voluntarios/search/:termo', async (req, res) => {
  try {
    const { termo } = req.params;
    const voluntarios = await prisma.voluntario.findMany({
      where: {
        OR: [
          { nome: { contains: termo } },
          { usuario: { contains: termo } },
          { email: { contains: termo } },
        ],
      },
    });
    res.json(voluntarios);
  } catch (error) {
    console.error('Voluntarios search error:', error);
    res.status(500).json({ error: 'Erro ao buscar voluntários', details: String(error.message) });
  }
});

app.get('/api/diretoria/search/:termo', async (req, res) => {
  try {
    const { termo } = req.params;
    const diretores = await prisma.diretoria.findMany({
      where: {
        OR: [
          { nome: { contains: termo } },
          { usuario: { contains: termo } },
          { email: { contains: termo } },
        ],
      },
    });
    res.json(diretores);
  } catch (error) {
    console.error('Diretoria search error:', error);
    res.status(500).json({ error: 'Erro ao buscar diretores', details: String(error.message) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 API rodando na porta ${port}`);
});

