var express = require('express');
var router = express.Router();
const knex = require('../db/conn');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const session = require('express-session');

router.use(session({
  secret: 'voekey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Use true se estiver usando HTTPS
}));

function verificaAutenticacao(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

// Middleware de autenticação
// router.use('/', verificaAutenticacao);
// router.use('/*', verificaAutenticacao);


/* GET dashBoard page. */
router.get('/', verificaAutenticacao, function (req, res, next) {
  try {
    const candidatos = knex.select('*').from('candidatos');
    const candidatosTotal = knex('candidatos').count('* as total');
    const vagasAbertas = knex('vagas').where('status', 'Vaga em aberto').count('status as total'); // Substitua 'id' pela coluna apropriada da sua tabela
    const vagasFechadas = knex('vagas').where('status', 'Vaga fechada').count('status as total');
    const vagasCongeladas = knex('vagas').where('status', 'Vaga congelada').count('status as total');
    const triagemEntrevistaVoe = knex('candidatos').where('triagem', 'Entrevista VOE').count('triagem as total');
    const triagemEntrevistaCliente = knex('candidatos').where('triagem', 'Entrevista Cliente').count('triagem as total');

    triagemEntrevistaCliente.then((triagemEntrevistaCliente) => {
      triagemEntrevistaVoe.then((triagemEntrevistaVoe) => {
        vagasCongeladas.then((resultVagasCongeladas) => {
          vagasFechadas.then((resultVagasFechadas) => {
            vagasAbertas.then((resultVagasAbertas) => {
              candidatos.then((candidatos) => {
                // console.log('Candidatos:', candidatos);
                candidatosTotal.then((candidatosTotal) => {
                  res.render('./dashBoard/index', {
                    title: 'Express',
                    candidato: candidatos,
                    vagasAbertas: resultVagasAbertas[0].total,
                    vagasFechadas: resultVagasFechadas[0].total,
                    vagasCongeladas: resultVagasCongeladas[0].total,
                    candidatosTotal: candidatosTotal[0].total,
                    triagemEntrevistaCliente: triagemEntrevistaCliente[0].total,
                    triagemEntrevistaVoe: triagemEntrevistaVoe[0].total
                  })
                });
              })
            })
          })
        })
      })
    })
      .catch((err) => {
        console.error(err);
      });

  } catch (error) {
    console.error('Erro ao listar os posts:', error);
  }
});

/**ROTAS DO MODULO - CANDIDATO **/
/* POST Criar candidatos destino. */
router.post('/candidatos-cad', (req, res) => { 
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('Nenhum arquivo foi enviado.');
  }

  var arquivo = req.files.arquivo; // Obtenha o arquivo enviado do formulário

  var nomeArquivo = `${Date.now()}_${arquivo.name}`; // Gera um nome único para o arquivo
  var uploadDir = path.join(__dirname, '/uploads');

  // Verifica se o diretório de uploads existe, se não existir, cria-o
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  var uploadPath = path.join(uploadDir, nomeArquivo); // Caminho completo para o arquivo

  // Move o arquivo para o diretório de uploads
  arquivo.mv(uploadPath, (err) => {
    if (err) {
      console.error('Erro ao fazer upload do arquivo:', err);
      return res.status(500).send('Erro ao fazer upload do arquivo.');
    }
    console.log("Arquivo enviado:", nomeArquivo);

    // Agora que o arquivo foi salvo com sucesso,
    // você pode armazenar o caminho do arquivo no banco de dados
    var caminhoArquivo = `/uploads/${nomeArquivo}`;

    // Obtém os outros dados do formulário
    var nome = req.body.nome;
    var email = req.body.email;
    var celular = req.body.celular;
    var idade = req.body.idade;
    var genero = req.body.genero;
    var cidade = req.body.cidade;
    var estado = req.body.estado;
    var possuiDeficiencia = req.body.possuiDeficiencia;
    var tipoDeDeficiencia = req.body.tipoDeDeficiencia;
    var formacaoAcademica = req.body.formacaoAcademica;
    var experienciaProfissional = req.body.experienciaProfissional;
    var cursosExtracurriculares = req.body.cursosExtracurriculares;
    var idiomas = req.body.idiomas;
    var informacoesAdicionais = req.body.informacoesAdicionais;
    var pretencaoSalarial = req.body.pretencaoSalarial;
    var tag = req.body.tag;
    var vagaAplicada = req.body.vagaAplicada;

    function getCurrentDateTime() {
      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
      const day = String(now.getDate()).padStart(2, '0');

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      // Formato: YYYY-MM-DD HH:MM:SS
      const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

      return formattedDateTime;
    }

    // Exemplo de uso
    const dateTime = getCurrentDateTime();
    console.log(dateTime); // Saída: 2024-05-20 23:45:30 (ou qualquer que seja a data e hora atual)

    // Insere os dados do candidato no banco de dados
    knex('candidatos').insert({
      nome: nome,
      email: email,
      celular: celular,
      idade: idade,
      genero: genero,
      cidade: cidade,
      estado: estado,
      possuiDeficiencia: possuiDeficiencia,
      tipoDeDeficiencia: tipoDeDeficiencia,
      formacaoAcademica: formacaoAcademica,
      experienciaProfissional: experienciaProfissional,
      cursosExtracurriculares: cursosExtracurriculares,
      idiomas: idiomas,
      informacoesAdicionais: informacoesAdicionais,
      pretencaoSalarial: pretencaoSalarial,
      vaga_aplicada: vagaAplicada,
      created_at: dateTime,
      caminho_arquivo: caminhoArquivo // Armazena o caminho do arquivo no banco de dados
    })
      .then((candidato) => {
        // console.log('Candidato inserido com sucesso!', candidato);
        if (tag === 'formCandidato') {
          res.redirect('/conclusao'); // Move a chamada para dentro deste callback
        } else if (tag === 'formCandidato-bancoTalentos') {
          res.redirect('/conclusao-talentos'); // Move a chamada para dentro deste callback
        }
        else {
          res.redirect('/admin/candidatos-todos'); // Move a chamada para dentro deste callback
        }

      })
      .catch((error) => {
        console.error('Erro ao inserir o candidato:', error);
        res.status(500).send(`Erro ao inserir o candidato: ${error.message}`);
      });
  });

});
/* POST Atualiza candidatos destino. */
router.post('/candidato-edita/:id', (req, res) => {
  var id = req.params.id
  var nome = req.body.nome
  var email = req.body.email
  var celular = req.body.celular
  var idade = req.body.idade
  var genero = req.body.genero
  var cidade = req.body.cidade
  var estado = req.body.estado
  var possuiDeficiencia = req.body.possuiDeficiencia
  var tipoDeDeficiencia = req.body.tipoDeDeficiencia
  var formacaoAcademica = req.body.formacaoAcademica
  var experienciaProfissional = req.body.experienciaProfissional
  var cursosExtracurriculares = req.body.cursosExtracurriculares
  var idiomas = req.body.idiomas
  var informacoesAdicionais = req.body.informacoesAdicionais
  var pretencaoSalarial = req.body.pretencaoSalarial
  var triagem = req.body.triagem

  function getCurrentDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Formato: YYYY-MM-DD HH:MM:SS
    const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

    return formattedDateTime;
  }

  // Exemplo de uso
  const dateTime = getCurrentDateTime();
  console.log(dateTime);
  // Suponha que o campo caminho_arquivo armazene o caminho do arquivo carregado no banco de dados


  const validate = {
    id, nome, email, idade, genero, cidade, estado,
    possuiDeficiencia, tipoDeDeficiencia,
    formacaoAcademica, experienciaProfissional,
    cursosExtracurriculares, idiomas, informacoesAdicionais,
    pretencaoSalarial, updated_at: dateTime, 
  }

  if (validate.id && validate.nome && validate.email  && validate.idade && validate.genero && validate.cidade && validate.estado
    && validate.possuiDeficiencia && validate.tipoDeDeficiencia && validate.formacaoAcademica && validate.experienciaProfissional
    && validate.cursosExtracurriculares && validate.idiomas && validate.informacoesAdicionais && validate.pretencaoSalarial != '') {
    // console.log('Dados recebidos com sucesso', [validate])
    // Função para inserir um novo post no banco de dados
    // async function inserirCandidato(nome, email, idade, genero) {
    knex('candidatos').where({ id: id }).update(validate)
      .then(() => {
        console.log('Candidato atualizado com sucesso!', [validate]);
        res.redirect(`/admin/candidatos-editar/${validate.id}`);
      })
      .catch((error) => {
        console.error('Erro ao atualizar o candidato:', error);
        res.status(500).send('Erro ao atualizar o candidato');
      });
  } else {
    console.log('Dados incompletos no envio');
    res.status(400).send('Dados incompletos ou inválidos');
  }

})
/* GET renderiza candidatos editar page. */
router.get('/candidatos-editar/:id', verificaAutenticacao, function (req, res, next) {
  var id = req.params.id
  try {
    const candidato = knex.select('*').from('candidatos').where({ id: id }).first();
    candidato.then((candidato) => {
      if (candidato) {
        // console.log('Candidato encontrado:', candidato);
      } else {
        console.log('Nenhum post encontrado com o ID fornecido.');
      }
      res.render('./dashBoard/candidatos-editar', { title: 'Express', id: id, candidato: candidato });
    })
  } catch (error) {
    console.error('Erro ao selecionar o candidato:', error);
  }

});

router.post('/candidatos-delete', verificaAutenticacao, (req, res) => {
  var id = req.body.id

  knex('candidatos').where({ id: id }).del()
    .then(() => {
      console.log('Candidato deletado com sucesso!', id);
      res.redirect('/admin/candidatos-todos');
    })
    .catch((error) => {
      console.error('Erro ao atualizar o candidato:', error);
      res.status(500).send('Erro ao atualizar o candidato');
    })

  console.log('XXX::: ', id)
})
/* GET List candidatos page. */
router.get('/candidatos-todos', verificaAutenticacao, function (req, res, next) {
  // Função para listar todos os posts do banco de dados
  try {
    const candidatos = knex.select('*').from('candidatos');
    candidatos.then((candidatos) => {
      // console.log('Candidatos:', candidatos);
      res.render('./dashBoard/candidatos-todos', { title: 'Express', candidato: candidatos });
    })

  } catch (error) {
    console.error('Erro ao listar os posts:', error);
  }

});
/* GET create candidatos page. */
router.get('/candidatos-novo', verificaAutenticacao, function (req, res, next) {
  res.render('./dashBoard/candidatos-novo', { title: 'Express' });
});

/**** FINAL ROTAS DO MODULO CANDIDATOS ****/


/**ROTAS DO MODULO - BLOG **/
/* GET list postagens page. */
router.get('/blog-posts', verificaAutenticacao, function (req, res, next) {
  try {
    const postagemBlog = knex.select('*').from('blog');
    postagemBlog.then((postagemBlog) => {
      // console.log('Candidatos:', candidatos);
      res.render('./dashBoard/blog-posts', { title: 'Express', postagens: postagemBlog });
    })
  } catch (error) {
    console.error('Erro ao listar os posts:', error);
  }
});
/* GET create postagens page. */
router.get('/blog-novo', verificaAutenticacao, function (req, res, next) {
  res.render('./dashBoard/blog-novo', { title: 'Express' });
});
/* POST create postagens page. */
router.post('/blog-cadastro', (req, res) => {
  var titulo = req.body.titulo
  var conteudo = req.body.conteudo
  var categoria = req.body.categoria
  var autor = req.body.autor
  function getCurrentDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Formato: YYYY-MM-DD HH:MM:SS
    const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

    return formattedDateTime;
  }

  // Exemplo de uso
  const dateTime = getCurrentDateTime();
  console.log(dateTime);

  const validate = { titulo, conteudo, categoria, autor, created_at: dateTime }

  if (validate.titulo && validate.conteudo && validate.categoria && validate.autor != '') {
    console.log('Dados enviados com sucesso', [validate])
    try {
      knex('blog').insert({
        titulo: titulo,
        categoria: categoria,
        conteudo: conteudo,
        autor: autor
      }).then((validate) => {
        console.log('Postagem inserida com sucesso!', [validate]);
      })

    } catch (error) {
      console.error('Erro ao inserir o candidato:', error);
    }
    res.redirect('/admin/blog-posts')
  }
  else {
    console.log('Algo deu errado no envio dos dados')
  }

})
/* GET editar postagens page. */
router.get('/blog-editar/:id', verificaAutenticacao, function (req, res, next) {
  var id = req.params.id
  try {
    const postagemBlog = knex.select('*').from('blog').where({ id: id }).first();
    postagemBlog.then((postagemBlog) => {
      if (postagemBlog) {
        // console.log('Candidato encontrado:', candidato);
      } else {
        console.log('Nenhum post encontrado com o ID fornecido.');
      }
      res.render('./dashBoard/blog-editar', { title: 'Express', postagemBlog: postagemBlog });
    })
  } catch (error) {
    console.error('Erro ao selecionar o candidato:', error);
  }

});
/* POST Atualiza postagem destino. */
router.post('/blog-edita/:id', (req, res) => {
  var id = req.params.id
  var titulo = req.body.titulo
  var conteudo = req.body.conteudo
  var categoria = req.body.categoria
  var autor = req.body.autor
  function getCurrentDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Formato: YYYY-MM-DD HH:MM:SS
    const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

    return formattedDateTime;
  }

  // Exemplo de uso
  const dateTime = getCurrentDateTime();
  console.log(dateTime);

  const validate = {
    id, titulo, conteudo, categoria, autor, updated_at, updated_at: dateTime
  }

  if (validate.titulo && validate.id && validate.conteudo && validate.categoria && validate.autor != '') {
    // console.log('Dados recebidos com sucesso', [validate])
    // Função para inserir um novo post no banco de dados
    // async function inserirCandidato(nome, email, idade, genero) {
    knex('blog').where({ id: id }).update(validate)
      .then(() => {
        console.log('Post atualizado com sucesso!', [validate]);
        res.redirect(`/admin/blog-editar/${validate.id}`);
      })
      .catch((error) => {
        console.error('Erro ao atualizar o candidato:', error);
        res.status(500).send('Erro ao atualizar a postagem no blog');
      });
  } else {
    console.log('Dados incompletos no envio');
    // res.status(400).send('Dados incompletos ou inválidos');
  }

})
router.post('/blog-delete', (req, res) => {
  var id = req.body.id

  knex('blog').where({ id: id }).del()
    .then(() => {
      console.log('Postagem deletada com sucesso!', id);
      res.redirect('/admin/blog-posts');
    })
    .catch((error) => {
      console.error('Erro ao deletar a postagem:', error);
      res.status(500).send('Erro ao deletar a postagem');
    })

  console.log('XXX::: ', id)
})
/**** FINAL ROTAS DO MODULO  BLOG ****/


/**ROTAS DO MODULO VAGAS **/
/* GET list vagas page. */
router.get('/vagas-todas', verificaAutenticacao, function (req, res, next) {
  try {
    const postagemVagas = knex.select('*').from('vagas');
    postagemVagas
      .then((postagemVagas) => {
        console.log('Candidatos:', postagemVagas);
        res.render('./dashBoard/vagas-todas', { title: 'Express', vagas: postagemVagas });
      })
  } catch (error) {
    console.error('Erro ao listar as vagas:', error);
  }
});
/* GET create vagas page. */
router.get('/vagas-nova', verificaAutenticacao, function (req, res, next) {
  res.render('./dashBoard/vagas-nova', { title: 'Express' });
});
/* GET edite vagas page. */
router.get('/vagas-editar/:id', verificaAutenticacao, function (req, res, next) {
  var id = req.params.id
  try {
    const postagemVaga = knex.select('*').from('vagas').where({ id: id }).first();
    postagemVaga.then((postagemVaga) => {
      if (postagemVaga) {
        console.log('Vaga encontrada:', postagemVaga);
      } else {
        console.log('Nenhuma vaga encontrado com o ID fornecido.');
      }
      res.render('./dashBoard/vagas-editar', { title: 'Express', vagas: postagemVaga });
    })
  } catch (error) {
    console.error('Erro ao selecionar a vaga:', error);
  }
});

router.post('/vagas-edita/:id', (req, res) => {
  var id = req.params.id
  var cargo = req.body.cargo
  var breveDescricao = req.body.breveDescricao
  var descricao = req.body.descricao
  var empresa = req.body.empresa
  var localizacao = req.body.localizacao
  var salario = req.body.salario
  var requisitos = req.body.requisitos
  var beneficios = req.body.beneficios
  var status = req.body.status
  function getCurrentDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Formato: YYYY-MM-DD HH:MM:SS
    const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

    return formattedDateTime;
  }

  // Exemplo de uso
  const dateTime = getCurrentDateTime();
  console.log(dateTime);

  const validate = { cargo, descricao, empresa, salario, localizacao, beneficios, requisitos, breveDescricao, status, data_expiracao: dateTime }

  if (validate.cargo && validate.descricao && validate.empresa && validate.salario && validate.localizacao && validate.beneficios && validate.requisitos && validate.status != '') {
    knex('vagas').where({ id: id }).update(validate)
      .then(() => {
        console.log('Vaga atualizado com sucesso!', [validate]);
        res.redirect(`/admin/vagas-editar/${id}`);
      })
      .catch((error) => {
        console.error('Erro ao atualizar a vaga:', error);
        res.status(500).send('Erro ao atualizar a vaga');
      });
  } else {
    console.log('Dados incompletos no envio');
    // res.status(400).send('Dados incompletos ou inválidos');
  }

})
/* POST create vagas page. */
router.post('/vagas-cadastro', (req, res) => {
  var cargo = req.body.cargo
  var breveDescricao = req.body.breveDescricao
  var descricao = req.body.descricao
  var empresa = req.body.empresa
  var localizacao = req.body.localizacao
  var salario = req.body.salario
  var requisitos = req.body.requisitos
  var beneficios = req.body.beneficios
  var status = req.body.status
  function getCurrentDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Formato: YYYY-MM-DD HH:MM:SS
    const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

    return formattedDateTime;
  }

  // Exemplo de uso
  const dateTime = getCurrentDateTime();
  console.log(dateTime);

  const validate = { cargo, descricao, empresa, salario, localizacao, beneficios, requisitos, breveDescricao, status, created_at: dateTime };

  if (validate.cargo && validate.descricao && validate.empresa && validate.salario && validate.localizacao && validate.beneficios && validate.requisitos && validate.status != '') {
    console.log('Dados enviados com sucesso', [validate])
    try {
      knex('vagas').insert({
        cargo: cargo,
        descricao: descricao,
        empresa: empresa,
        salario: salario,
        localizacao: localizacao,
        beneficios: beneficios,
        requisitos: requisitos,
        breveDescricao: breveDescricao,
        status: status,
        data_publicacao: validate.created_at
      }).then((validate) => {
        console.log('Vaga criada com sucesso!', [validate]);
      })
    } catch (error) {
      console.error('Erro ao inserir a vaga:', error);
    }
    // res.redirect('/admin/blog-posts')
    res.redirect('/admin/vagas-todas')
  } else {
    console.log('Algo deu errado com o envio dos dados')
  }

})
router.post('/vaga-delete', (req, res) => {
  var id = req.body.id

  knex('vagas').where({ id: id }).del()
    .then(() => {
      console.log('Vaga deletada com sucesso!', id);
      res.redirect('/admin/vagas-todas');
    })
    .catch((error) => {
      console.error('Erro ao deletar a vaga:', error);
      res.status(500).send('Erro ao deletar a vaga');
    })

  // console.log('XXX::: ', id)
})
/**** FINAL ROTAS DO MODULO VAGAS ****/


/**ROTAS DO MODULO AVALIAÇÕES **/
router.post('/avaliacao-cadastrar', async (req, res) => {
  const { questions } = req.body;

   // Adicionar log para inspecionar o conteúdo de questions
   console.log('Conteúdo de questions:', questions);

  function getCurrentDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Formato: YYYY-MM-DD HH:MM:SS
    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    return formattedDateTime;
  }

  const dateTime = getCurrentDateTime();
  console.log(dateTime);

  try {
    const test_name = questions[0].test_name;

    await knex.transaction(async trx => {
      const questionPromises = questions.map(question => {
        const { test_name, vaga_name, type} = question;
        return trx('avaliacoes').insert({
          test_name,
          vaga_name,
          type,
          created_at: dateTime
        });
      });

      await Promise.all(questionPromises);  // Aguarde todas as promessas serem resolvidas
      res.redirect(`/admin/avaliacoes-todas`);
    });

    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao adicionar perguntas', details: error.message });
  }
});

/* GET create vagas page. */
router.get('/avaliacao-nova', verificaAutenticacao, function (req, res, next) {
  try {
    const listagemVagas = knex.select('*').from('vagas');
    listagemVagas
      .then((vagas) => {
        console.log('Candidatos:', vagas);
        res.render('./dashBoard/avaliacao-nova', { title: 'VOE', vagas: vagas });
      })
  } catch (error) {
    console.error('Erro ao listar as vagas:', error);
  }
});

router.get('/avaliacoes-todas', verificaAutenticacao, async function (req, res, next) {
  try {
    // Subconsulta para obter nomes únicos de vagas
    const subquery = knex('avaliacoes').distinct('vaga_name').as('distinct_vagas');

    // Usando a subconsulta para buscar os dados completos
    const exerciciosListados = await knex('avaliacoes')
      .select('id', 'vaga_name', 'test_name', 'created_at')
      .whereIn('vaga_name', function () {
        this.select('vaga_name').from(subquery);
      });

    console.log('Exercicios:', exerciciosListados);
    res.render('./dashBoard/avaliacao-todas', { title: 'Express', exercicio: exerciciosListados });
  } catch (error) {
    console.error('Erro ao listar os exercicios:', error);
    res.status(500).send('Erro ao listar os exercicios');
  }
});

router.get('/avaliacao-editar/:id', verificaAutenticacao, async function (req, res, next) {
  const { id } = req.params;
  try {
    const avaliacao = await knex('avaliacoes').where({ id }).first();
    if (!avaliacao) {
      return res.status(404).send('Avaliação não encontrada');
    }
    res.render('./dashBoard/avaliacao-editar', { title: 'Editar Avaliação', avaliacao });
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error);
    res.status(500).send('Erro ao buscar avaliação');
  }
});

router.post('/avaliacao-editar/:id', verificaAutenticacao, async function (req, res, next) {
  function getCurrentDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Formato: YYYY-MM-DD HH:MM:SS
    const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

    return formattedDateTime;
  }
  const dateTime = getCurrentDateTime();

  const { id } = req.params;
  const { test_name, vaga_name, type, text, options, created_at } = req.body; // Inclua os campos que deseja editar
  try {
    await knex('avaliacoes')
      .where({ id })
      .update({ test_name, vaga_name, type, text, options, created_at: dateTime });
    res.redirect(`/admin/avaliacao-editar/${id}`);
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).send('Erro ao atualizar avaliação');
  }
});

router.get('/avaliacao-delete/:id', verificaAutenticacao, async function (req, res, next) {
  const { id } = req.params;
  try {
    await knex('avaliacoes').where({ id }).del();
    res.redirect('/admin/avaliacoes-todas');
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    res.status(500).send('Erro ao deletar avaliação');
  }
});


router.get('/avaliacao-responder/:test_name', async function (req, res, next) {
  const { test_name } = req.params;
  const candidato_id = 86; // Supondo que o ID do candidato esteja disponível no objeto de autenticação
  try {
    const perguntas = await knex('avaliacoes').where({ test_name });
    if (!perguntas || perguntas.length === 0) {
      return res.status(404).send('Avaliação não encontrada');
    }
    res.render('./dashBoard/avaliacao-responder', { title: 'Responder Avaliação', perguntas, candidato_id });
  } catch (error) {
    console.error('Erro ao buscar perguntas:', error);
    res.status(500).send('Erro ao buscar perguntas');
  }
});


// Rota para obter todas as vagas
// Rota para obter todas as vagas
router.get('/api/vagas', verificaAutenticacao, async (req, res) => {
  try {
    const vagas = await knex('vagas').select('*');
    res.json(vagas);
  } catch (error) {
    console.error('Erro ao obter vagas:', error);
    res.status(500).send('Erro ao obter vagas');
  }
});

// Rota para obter as perguntas de uma avaliação
router.get('/api/avaliacoes/:avaliacaoNome/perguntas', verificaAutenticacao, async (req, res) => {
  const { avaliacaoNome } = req.params;
  try {
    // Encontre a avaliação pelo nome
    const avaliacao = await knex('avaliacoes').where({ test_name: avaliacaoNome }).first();
    if (!avaliacao) {
      return res.status(400).send('Avaliacao não existe');
    }

    // Supondo que a coluna 'pergunta' na tabela 'avaliacoes' contenha as perguntas em texto simples, separadas por uma quebra de linha
    const perguntasTexto = avaliacao.pergunta;
    const perguntas = perguntasTexto.split('\n').map((pergunta, index) => ({
      id: index + 1, // Usar o índice como ID temporário
      texto: pergunta.trim()
    }));

    res.json(perguntas);
  } catch (error) {
    console.error('Erro ao obter perguntas:', error);
    res.status(500).send('Erro ao obter perguntas');
  }
});


router.post('/avaliacao-responder/:avaliacaoNome', verificaAutenticacao, async function (req, res, next) {
  const { avaliacaoNome } = req.params;
  const { vaga_cargo, respostas } = req.body; // Inclua os campos que deseja salvar

  // Verifique se 'respostas' é um array, caso contrário, inicialize como um array vazio
  let respostasArray = Array.isArray(respostas) ? respostas : [];

  try {
    // Verifique se o avaliacaoNome existe na tabela avaliacoes
    const avaliacao = await knex('avaliacoes').where({ test_name: avaliacaoNome }).first();
    if (!avaliacao) {
      return res.status(400).send('Avaliacao não existe');
    }

    const avaliacaoId = avaliacao.id;

    // Supondo que a coluna 'pergunta' na tabela 'avaliacoes' contenha as perguntas em texto simples, separadas por uma quebra de linha
    const perguntasTexto = avaliacao.pergunta;
    const perguntas = perguntasTexto.split('\n').map((pergunta, index) => ({
      id: index + 1, // Usar o índice como ID temporário
      texto: pergunta.trim()
    }));
    if (!perguntas.length) {
      return res.status(400).send('Avaliacao não possui perguntas');
    }

    // Recupere a vaga pelo cargo
    const vaga = await knex('vagas').where({ cargo: vaga_cargo }).first();
    if (!vaga) {
      return res.status(400).send('Vaga não encontrada');
    }

    // Recupere os candidatos associados à vaga pelo cargo
    console.log(`Procurando candidatos para a vaga_cargo: ${vaga_cargo}`);
    const candidatos = await knex('candidatos').where({ vaga_aplicada: vaga.cargo }).pluck('id');
    console.log(`Candidatos encontrados: ${candidatos.length}`);

    if (!candidatos.length) {
      return res.status(400).send('Nenhum candidato encontrado para a vaga especificada');
    }

    // Para cada candidato, insira as respostas
    for (const candidato_id of candidatos) {
      for (const resposta of respostasArray) {
        // Certifique-se de que a resposta corresponde a uma das perguntas da avaliação
        const pergunta = perguntas.find(p => p.id === parseInt(resposta.pergunta_id, 10));
        if (!pergunta) {
          return res.status(400).send('Resposta para pergunta inválida');
        }

        // Log para depuração
        console.log('Inserindo resposta para candidato:', candidato_id);

        await knex('respostas').insert({
          avaliacao_id: avaliacaoId,
          candidato_id,
          pergunta_id: resposta.pergunta_id,
          texto: resposta.texto,
          opcoes: resposta.opcoes ? JSON.stringify(resposta.opcoes) : null,
        });
      }
    }

    console.log('Redirecionando para /admin/avaliacoes-todas');
    res.redirect('/admin/avaliacoes-todas');
  } catch (error) {
    console.error('Erro ao salvar resposta:', error);
    res.status(500).send('Erro ao salvar resposta');
  }
});

// -----------------------

router.post('/gerar-links/:avaliacaoNome', async function (req, res, next) {
  const { avaliacaoNome } = req.params;
  const { vaga_cargo } = req.body; // Inclua os campos que deseja salvar

  try {
    // Verifique se o avaliacaoNome existe na tabela avaliacoes
    const avaliacao = await knex('avaliacoes').where({ test_name: avaliacaoNome }).first();
    if (!avaliacao) {
      return res.status(400).send('Avaliacao não existe');
    }

    const avaliacaoId = avaliacao.id;

    // Recupere a vaga pelo cargo
    const vaga = await knex('vagas').where({ cargo: vaga_cargo }).first();
    if (!vaga) {
      return res.status(400).send('Vaga não encontrada');
    }

    // Recupere os candidatos associados à vaga pelo cargo
    const candidatos = await knex('candidatos').where({ vaga_aplicada: vaga.cargo }).select('*');
    if (!candidatos.length) {
      return res.status(400).send('Nenhum candidato encontrado para a vaga especificada');
    }

    // Gerar links únicos para cada candidato
    const links = [];
    for (const candidato of candidatos) {
      const token = uuidv4();
      const link = `http://localhost:3001/responder-avaliacao/${avaliacaoNome}/${token}`;
      links.push({ candidato, link });

      // Atualizar o candidato com o token gerado
      await knex('candidatos').where({ id: candidato.id }).update({ token });
    }

    // Aqui, você pode enviar os links para os candidatos por e-mail ou outro meio

    res.json({ links });
  } catch (error) {
    console.error('Erro ao gerar links:', error);
    res.status(500).send('Erro ao gerar links');
  }
});

router.get('/responder-avaliacao/:avaliacaoNome/:token', async function (req, res, next) {
  const { avaliacaoNome, token } = req.params;

  try {
    console.log(`Verificando token: ${token}`);
    // Verifique se o avaliacaoNome existe na tabela avaliacoes
    const avaliacao = await knex('avaliacoes').where({ test_name: avaliacaoNome }).first();
    if (!avaliacao) {
      return res.status(400).send('Avaliacao não existe');
    }

    const avaliacaoId = avaliacao.id;

    // Verifique o token e recupere o candidato correspondente
    const candidato = await knex('candidatos').where({ token }).first();
    if (!candidato) {
      return res.status(400).send('Token inválido ou expirado');
    }

    console.log(`Candidato encontrado: ${candidato.id}`);

    // Supondo que a coluna 'pergunta' na tabela 'avaliacoes' contenha as perguntas em texto simples, separadas por uma quebra de linha
    const perguntasTexto = avaliacao.pergunta;
    const perguntas = perguntasTexto.split('\n').map((pergunta, index) => ({
      id: index + 1, // Usar o índice como ID temporário
      texto: pergunta.trim()
    }));
    if (!perguntas.length) {
      return res.status(400).send('Avaliacao não possui perguntas');
    }

    // Renderize a página de resposta da avaliação para o candidato
    res.render('responder-avaliacao', { candidato, avaliacao, perguntas });
  } catch (error) {
    console.error('Erro ao carregar avaliação:', error);
    res.status(500).send('Erro ao carregar avaliação');
  }
});

router.post('/enviar-respostas/:avaliacaoNome/:token', async function (req, res, next) {
  const { avaliacaoNome, token } = req.params;
  const { respostas } = req.body;

  try {
    // Verifique se o avaliacaoNome existe na tabela avaliacoes
    const avaliacao = await knex('avaliacoes').where({ test_name: avaliacaoNome }).first();
    if (!avaliacao) {
      return res.status(400).send('Avaliacao não existe');
    }

    const avaliacaoId = avaliacao.id;

    // Verifique o token e recupere o candidato correspondente
    const candidato = await knex('candidatos').where({ token }).first();
    if (!candidato) {
      return res.status(400).send('Token inválido ou expirado');
    }

    // Verifique se 'respostas' é um array, caso contrário, inicialize como um array vazio
    let respostasArray = Array.isArray(respostas) ? respostas : [];

    // Para cada resposta, insira no banco de dados
    for (const resposta of respostasArray) {
      await knex('respostas').insert({
        avaliacao_id: avaliacaoId,
        candidato_id: candidato.id,
        pergunta_id: resposta.pergunta_id,
        texto: resposta.texto,
        opcoes: resposta.opcoes ? JSON.stringify(resposta.opcoes) : null,
      });
    }

    res.send('Respostas enviadas com sucesso');
  } catch (error) {
    console.error('Erro ao enviar respostas:', error);
    res.status(500).send('Erro ao enviar respostas');
  }
});




/**ROTAS DO MODULO PROFILE **/
/* GET profile page. */
router.get('/profile-manager', verificaAutenticacao, function (req, res, next) {
  res.render('./dashBoard/profile-manager', { title: 'Express' });
});
/**** FINAL ROTAS DO MODULO PROFILE ****/

/**ROTAS DO MODULO REGISTER **/
/* GET register page. */
router.get('/register', verificaAutenticacao, function (req, res, next) {
  res.render('./dashBoard/register', { title: 'Express' });
});

router.post('/register', async (req, res) => {
  const { userName, email, senha } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(senha, 10);

    await knex('users').insert({
      nome: userName,
      email: email,
      senha: hashedPassword
    });

    res.redirect('/admin/login')
  } catch (error) {
    console.error('Erro ao registrar o usuário:', error);
    res.status(500).send('Erro no servidor. Tente novamente mais tarde.');
  }
});

/**** FINAL ROTAS DO MODULO REGISTER ****/


/** ROTAS DO MODULO LOGIN **/
/* GET login page. */
router.get('/login', function (req, res, next) {
  res.render('./dashBoard/login', { title: 'Express' });
});

// Rota de login
// Rota de login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  // Verificação básica se email e senha foram fornecidos
  if (!email || !senha) {
    return res.status(400).send('Email e senha são obrigatórios');
  }

  try {
    // Verifique se o usuário existe no banco de dados
    const user = await knex('users').where({ email }).first();

    if (!user) {
      return res.status(400).send('Usuário não encontrado');
    }

    // Verifique se a senha do usuário está definida
    if (!user.senha) {
      return res.status(500).send('Erro do servidor: senha não encontrada');
    }

    // Verifique a senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(400).send('Senha inválida');
    }

    // Inicialize a sessão se ainda não estiver inicializada
    if (!req.session) {
      req.session = {};
    }

    // Defina a propriedade userId na sessão
    req.session.userId = user.id;

    // Redirecione para a página de dashboard
    res.redirect('/admin/');
  } catch (error) {
    console.error('Erro ao verificar o usuário:', error);
    res.status(500).send('Erro no servidor');
  }
});

/**** FINAL ROTAS DO MODULO LOGIN ****/


module.exports = router
