const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const testProfiles = {
  voluntarios: [
    {
      nome: 'João Silva',
      usuario: 'joao.silva',
      email: 'joao@example.com',
      senha: 'senha123',
    },
    {
      nome: 'Maria Santos',
      usuario: 'maria.santos',
      email: 'maria@example.com',
      senha: 'senha123',
    },
    {
      nome: 'Pedro Oliveira',
      usuario: 'pedro.oliveira',
      email: 'pedro@example.com',
      senha: 'senha123',
    },
    {
      nome: 'Ana Costa',
      usuario: 'ana.costa',
      email: 'ana@example.com',
      senha: 'senha123',
    },
    {
      nome: 'Carlos Mendes',
      usuario: 'carlos.mendes',
      email: 'carlos@example.com',
      senha: 'senha123',
    },
    {
      nome: 'Jessica Lima',
      usuario: 'jessica.lima',
      email: 'jessica@example.com',
      senha: 'senha123',
    },
    {
      nome: 'Rafael Gomes',
      usuario: 'rafael.gomes',
      email: 'rafael@example.com',
      senha: 'senha123',
    },
    {
      nome: 'Lucia Ferreira',
      usuario: 'lucia.ferreira',
      email: 'lucia@example.com',
      senha: 'senha123',
    },
  ],
  diretores: [
    {
      nome: 'Director José',
      usuario: 'jose.director',
      email: 'jose@diretoria.com',
      senha: 'senha123',
      rgFuncional: 'RG001234',
    },
    {
      nome: 'Director Ana Maria',
      usuario: 'anamaria.director',
      email: 'anamaria@diretoria.com',
      senha: 'senha123',
      rgFuncional: 'RG005678',
    },
    {
      nome: 'Director Paulo',
      usuario: 'paulo.director',
      email: 'paulo@diretoria.com',
      senha: 'senha123',
      rgFuncional: 'RG009012',
    },
  ],
};

async function main() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    await prisma.voluntario.deleteMany();
    await prisma.diretoria.deleteMany();

    console.log(' Inserindo voluntários...');
    for (const voluntario of testProfiles.voluntarios) {
      await prisma.voluntario.create({
        data: voluntario,
      });
    }

    console.log(' Inserindo diretores...');
    for (const diretor of testProfiles.diretores) {
      await prisma.diretoria.create({
        data: diretor,
      });
    }

    console.log(' Seed concluído com sucesso!');
    console.log(` ${testProfiles.voluntarios.length} voluntários inseridos`);
    console.log(` ${testProfiles.diretores.length} diretores inseridos`);
  } catch (error) {
    console.error(' Erro ao executar seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
