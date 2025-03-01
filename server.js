const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const {json} = require("body-parser");
const multer = require("multer");
const {post} = require("axios");

const app = express();
app.use(express.json());

const basePath = path.join(__dirname, '_books'); // Certifique-se de que essa linha está presente

const axios = require('axios');


// Verifica se a pasta de uploads existe, se não, cria
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Pasta "uploads" criada com sucesso.');
}

// Configuração do armazenamento do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Pasta onde os arquivos serão salvos temporariamente
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Mantém o nome original do arquivo
  }
});

// Configuração do multer com limites e armazenamento
const upload = multer({
  storage: storage,
  limits: {
    fileSize: Infinity,    // Limite para o tamanho do arquivo
    fieldSize: Infinity     // Limite para o tamanho dos campos
  }
});
const port = 8000;

// Ativar CORS
app.use(cors());

// Permitir que o servidor aceite requisições JSON
app.use(express.json());

// Para JSON
app.use(json({ limit: '512mb' })); // Ajuste o limite conforme necessário
app.use(express.urlencoded({ limit: '512mb', extended: true }));

// Rota para salvar um novo poema dentro de "Poemas.json"
app.post('/salvar_poema', (req, res) => {
  const poema = req.body;

  // Ajusta para garantir que o backend aceite ambos os formatos
  const title = poema.title || poema.poema;
  const strophes = poema.strophes || poema.estrofes; // Aceita ambos os nomes

  if (!title || !Array.isArray(strophes) || strophes.length === 0) {
    return res.status(400).json({ error: "O poema deve ter um título e estrofes válidas." });
  }

  const dirPath = path.join(__dirname, '_books/poemas');
  const filePath = path.join(dirPath, 'poemas.json');

  fs.mkdir(dirPath, { recursive: true }, (err) => {
    if (err) {
      console.error("❌ Erro ao criar pasta:", err);
      return res.status(500).json({ error: "Erro ao criar diretório." });
    }

    let poemas = { Poemas: [] };

    // Lê o JSON existente se houver
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      try {
        poemas = JSON.parse(fileContent);
        if (!poemas.Poemas || !Array.isArray(poemas.Poemas)) {
          poemas.Poemas = [];
        }
      } catch (error) {
        console.error("❌ Erro ao parsear JSON:", error);
      }
    }

    // Adiciona o poema garantindo que será salvo corretamente
    poemas.Poemas.push({
      title: title,
      strophes: strophes // Sempre salvar como "strophes" no JSON
    });

    // Atualiza o campo `lastUpdated` com a data/hora atual
    poemas.lastUpdated = new Date().toISOString();

    // Salva no arquivo
    fs.writeFile(filePath, JSON.stringify(poemas, null, 2), (err) => {
      if (err) {
        console.error("❌ Erro ao salvar poema:", err);
        return res.status(500).json({ error: "Erro ao salvar poema." });
      }
      console.log(`✅ Poema "${title}" salvo com sucesso no JSON!`);
      res.json({ success: "Poema salvo com sucesso!", poema: { title, strophes }, lastUpdated: poemas.lastUpdated });
    });
  });
});




// Função para formatar nome do livro
function formatarNomeLivro(nome) {
  const acentuacao = /[\u00C0-\u00C6\u00E0-\u00E6\u00C7\u00E7\u00D0\u00F0\u00C8-\u00CB\u00E8-\u00EB\u00CC-\u00CF\u00EC-\u00EF\u00D2-\u00D6\u00F2-\u00F6\u00D9-\u00DC\u00F9-\u00FC]/g;
  const semAcento = nome.normalize("NFD").replace(acentuacao, '');
  return semAcento.replace(/\s+/g, '_');
}


// Rota para salvar o livro
app.post('/salvar_livro', upload.single('coverImage'), (req, res) => {
  console.log('Dados recebidos:', req.body); // Exibe os dados recebidos
  console.log('Arquivo recebido:', req.file); // Exibe o arquivo recebido

  // Captura os dados do body
  const title = req.body.book;
  const genre = req.body.genre;
  const sinopse = req.body.sinopse;

  // Captura os novos campos
  const protagonist = req.body.protagonist;
  const characters = req.body.characters ? JSON.parse(req.body.characters) : [];
  const location = req.body.location;
  const year = req.body.year;
  const tone = req.body.tone;

  // Captura as páginas como um array
  let pages;
  try {
    pages = JSON.parse(req.body.page); // Tente parsear a página corretamente
  } catch (error) {
    console.error('Erro ao fazer parse de pages:', error);
    return res.status(400).json({ error: 'Erro ao processar as páginas.' });
  }

  const coverImage = req.file;

  // Verifica se todos os campos estão preenchidos
  if (!title || !genre || !sinopse || !protagonist || !characters || !location || !year || !tone || !pages || !coverImage) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  // Formatar o título para uso em caminhos de diretórios e arquivos
  const formattedTitle = formatarNomeLivro(title);

  // Criar o caminho do arquivo
  const booksDir = path.join(__dirname, `_books/${formattedTitle}`);
  const filePath = path.join(booksDir, `${formattedTitle}.json`);

  // Verifica se a pasta books existe, se não, cria
  if (!fs.existsSync(booksDir)) {
    fs.mkdirSync(booksDir, { recursive: true });
    console.log('Pasta "books" criada com sucesso.');
  }

  // Caminho da imagem na pasta books
  const coverImagePath = path.join(booksDir, `${formattedTitle}_cover.png`); // Usa o título do livro formatado para o nome da imagem

  let dateAdded = new Date().toISOString(); // Data atual
  if (fs.existsSync(filePath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      dateAdded = existingData.dateAdded || dateAdded; // Mantém a data original se já existir
    } catch (error) {
      console.error('❌ Erro ao ler livro existente:', error);
    }
  }

  // Se a imagem estiver em PNG ou JPEG, converte e salva
  if (coverImage.mimetype === 'image/png' || coverImage.mimetype === 'image/jpeg') {
    // Lê a imagem
    fs.copyFile(coverImage.path, coverImagePath, (err) => {
      if (err) {
        console.error('Erro ao salvar a imagem:', err);
        return res.status(500).send('Erro ao salvar a imagem.');
      }

      // Dados a serem salvos
      const bookData = {
        title: formattedTitle, // Usar título formatado
        genre,
        sinopse,
        protagonist,
        characters, // Adicionando personagens
        location, // Adicionando localização
        year, // Adicionando ano
        tone, // Adicionando tom
        page: pages, // Mantém a estrutura original da página
        coverImage: coverImagePath, // Caminho do arquivo de imagem
        dateAdded: dateAdded, // Mantém a data original
        lastUpdated: new Date().toISOString() // Atualiza a cada modificação
      };

      // Escrever dados no arquivo JSON
      fs.writeFile(filePath, JSON.stringify(bookData, null, 2), (err) => {
        if (err) {
          console.error('Erro ao salvar livro:', err);
          return res.status(500).send('Erro ao salvar livro.');
        }

        res.send('Livro salvo com sucesso.');
      });
    });
  } else {
    return res.status(400).send('Formato de imagem inválido. Aceito apenas PNG ou JPEG.');
  }
});

app.post('/gerar_pagina/:bookName', (req, res) => {
  const { genre, additionalInfo } = req.body;
  const bookName = req.params.bookName;

  // Caminho do arquivo JSON do livro
  const filePath = path.join(__dirname, `_books/${bookName}/${bookName}.json`);
  console.log('Caminho do arquivo:', filePath);

  // Lê os dados do livro
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Erro ao ler o livro: ' + err.message);
    }

    let bookData;
    try {
      bookData = JSON.parse(data);
    } catch (parseError) {
      return res.status(500).send('Erro ao analisar o JSON: ' + parseError.message);
    }

    // Verifica a estrutura correta
    if (!bookData.page || typeof bookData.page !== 'object') {
      return res.status(500).send('Estrutura do livro inválida: "page" não encontrada ou não é um objeto.');
    }

    const lastPageNumber = Object.keys(bookData.page).length; // Número da última página
    console.log('Último número da página:', lastPageNumber);

    // Obter o conteúdo das duas últimas páginas (se existirem)
    const lastPageText = lastPageNumber > 0 ? bookData.page[lastPageNumber.toString()] : '';
    const secondLastPageText = lastPageNumber > 1 ? bookData.page[(lastPageNumber - 1).toString()] : '';

    // Mensagem para o modelo
    const message = `
Aqui estão os eventos que ocorreram até agora no livro "${bookData.title}":

**Sinopse:**
${bookData.sinopse}

**Última página:**
${lastPageText}

Agora, por favor, continue a história. A próxima página deve ter entre 3 e 5 parágrafos e manter a continuidade da trama de forma natural.

**Instruções:**
- Escreva a página ${lastPageNumber + 1}.
- Mantenha a linguagem simples e evite o uso de palavras em inglês.
- O gênero da história é "${bookData.genre}" e o tom é ${typeof bookData.tone === 'string' ? bookData.tone.toLowerCase() : 'Tom não especificado'}. Mantenha esses elementos consistentes na narrativa.
- Lembre-se de que a história se passa em ${bookData.location}, com os seguintes personagens: ${Array.isArray(bookData.characters) ? bookData.characters.join(', ') : 'Personagens não encontrados'}.

Use as informações acima para seguir com a continuidade da história de maneira coesa e consistente com o que já foi apresentado.
`;

    // Envia a mensagem ao modelo
    axios.post(`${environment.mainUrl}/send-message`, { message })
      .then(response => {
        if (response.data && response.data.content && response.data.content[0] && response.data.content[0].parts) {
          // Cria os dados da nova página
          const newPageData = response.data.content[0].parts[0].text.replace(/## Página \d+/g, '').trim()

          // Adiciona a nova página à história
          bookData.page[lastPageNumber + 1] = newPageData;

          // **Atualiza o campo `lastUpdated`**
          bookData.lastUpdated = new Date().toISOString();

          // Escrever de volta o arquivo JSON
          fs.writeFile(filePath, JSON.stringify(bookData, null, 2), 'utf8', (err) => {
            if (err) {
              console.error('Erro ao salvar a nova página:', err);
              return res.status(500).send('Erro ao salvar a nova página.');
            }
            res.json(newPageData); // Retorna o objeto com a nova página gerada
          });
        } else {
          console.error('Formato inesperado da resposta da API:', response.data);
          res.status(500).send('Formato inesperado da resposta da API.');
        }
      })
      .catch(err => {
        console.error('Erro ao enviar mensagem ao modelo:', err);
        res.status(500).send('Erro ao gerar a próxima página.');
      });
  });
});


// Rota para listar os livros
app.get('/api/livros', (req, res) => {
  const basePath = path.join(__dirname, '_books');
  console.log('Caminho base:', basePath); // Verifique o caminho

  fs.readdir(basePath, (err, folders) => {
    if (err) {
      console.error('Erro ao ler os livros:', err.message);
      return res.status(500).send('Erro ao ler os livros: ' + err.message);
    }

    console.log('Pastas encontradas:', folders); // Log das pastas encontradas

    const books = [];
    let foldersProcessed = 0;

    const readFilesInFolder = (folder) => {
      const folderPath = path.join(basePath, folder);
      fs.readdir(folderPath, (err, files) => {
        if (err) {
          console.error(`Erro ao ler a pasta ${folder}:`, err.message);
          foldersProcessed++;
          if (foldersProcessed === folders.length) {
            res.json(books);
          }
          return;
        }

        let filesProcessed = 0; // Contador para arquivos processados

        files.forEach(file => {
          if (file.endsWith('.json')) {
            console.log('Arquivo JSON encontrado:', file); // Log dos arquivos JSON
            const filePath = path.join(folderPath, file);
            fs.readFile(filePath, 'utf8', (err, data) => {
              if (err) {
                console.error(`Erro ao ler o arquivo ${file}:`, err.message);
                filesProcessed++;
                return;
              }

              try {
                const bookData = JSON.parse(data);
                // Aqui, removemos o título da sinopse
                const sinopse = bookData.sinopse
                  ? bookData.sinopse
                    .replace(/^##.*\r?\n\r?\n/, '') // Remove o título se começar com "##"
                    .replace(/(?:\*\*Sinopse:\*\*\s*|\*\*Sinopse:\s*)/i, '') // Remove "**Sinopse:**" no início, se existir
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove o texto em negrito, mantendo o conteúdo
                    .trim() // Remove espaços em branco no início e no final
                  : ''; // Se não houver sinopse, atribui uma string vazia

                books.push({
                  title: bookData.title || path.basename(file, '.json'),
                  folder: folder,
                  sinopse: sinopse
                });
                console.log(`Livro adicionado: ${bookData.title}, Sinopse: ${sinopse}`);
              } catch (jsonError) {
                console.error(`Erro ao parsear o arquivo ${file}:`, jsonError.message);
              }

              filesProcessed++;
              if (filesProcessed === files.length) {
                foldersProcessed++;
                if (foldersProcessed === folders.length) {
                  res.json(books);
                }
              }
            });
          } else {
            filesProcessed++;
            if (filesProcessed === files.length) {
              foldersProcessed++;
              if (foldersProcessed === folders.length) {
                res.json(books);
              }
            }
          }
        });

        if (files.length === 0) {
          foldersProcessed++;
          if (foldersProcessed === folders.length) {
            res.json(books);
          }
        }
      });
    };

    if (folders.length === 0) {
      res.json(books);
    } else {
      folders.forEach(folder => readFilesInFolder(folder));
    }
  });
});



app.get('/livro/:title', (req, res) => {
  const title = req.params.title
  const filePath = path.join(__dirname, `_books/${title}/${title}.json`);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo:', err);
      return res.status(404).send('Livro não encontrado.');
    }
    res.json(JSON.parse(data));
  });
});


app.post('/send-message', async (req, res) => {
  const message = req.body.message;

  // Verifica se a mensagem foi recebida
  if (!message) {
    return res.status(400).send('Mensagem não fornecida.');
  }

  try {
    // Faz a chamada à API externa
    const response = await post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBt8HKkyoOXYlZrME7quFMBVMwmEovsjEA', {
      contents: [{
        parts: [{ text: message }]
      }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Log da resposta da API para visualização
    console.log('Resposta da API:', response.data);

    // Verifica se há candidatos na resposta
    if (response.data.candidates && response.data.candidates.length > 0) {
      // Formata a resposta para incluir informações relevantes
      const formattedResponse = {
        content: response.data.candidates.map(candidate => candidate.content),
        finishReason: response.data.candidates[0].finishReason,
        usageMetadata: response.data.usageMetadata
      };

      // Envia a resposta formatada de volta ao cliente
      return res.json(formattedResponse);
    } else {
      return res.status(500).send('Nenhum candidato encontrado na resposta da API.');
    }
  } catch (err) {
    console.error('Erro ao enviar a mensagem:', err);
    res.status(500).send('Erro ao enviar a mensagem.');
  }
});


// Função para adicionar uma nova página ao livro
function addPageToBook(bookTitle, generatedContent) {
  const filePath = path.join(__dirname, '_books', bookTitle, `${bookTitle}.json`);

  // Lê o arquivo existente
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo:', err);
      return;
    }

    // Faz o parsing do JSON existente
    const bookData = JSON.parse(data);

    // Determina o próximo número da página
    const newPageNumber = Object.keys(bookData.page).length + 1;

    // Extrai o texto do generatedContent
    // Adiciona a nova página ao objeto
    bookData.page[newPageNumber] = generatedContent.content[0].parts[0].text;

    // Salva o arquivo atualizado
    fs.writeFile(filePath, JSON.stringify(bookData, null, 2), (err) => {
      if (err) {
        console.error('Erro ao salvar o arquivo:', err);
      } else {
        console.log('Página adicionada com sucesso!');
      }
    });
  });
}

app.post('/add-page', (req, res) => {
  const { book, generatedContent } = req.body; // Supondo que você esteja enviando esses dados no corpo da requisição

  addPageToBook(book, generatedContent); // Chama a função para adicionar a página

  res.send({ message: `Página adicionada ao livro ${book}` });
});

app.get('/api/poemas', (req, res) => {
  const filePath = path.join(__dirname, '_books/poemas/poemas.json');

  if (!fs.existsSync(filePath)) {
    return res.json({ Poemas: [] }); // Retorna um array vazio caso o arquivo não exista
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo de poemas:', err);
      return res.status(500).send('Erro ao carregar os poemas.');
    }

    try {
      const poemas = JSON.parse(data);
      res.json(poemas);
    } catch (error) {
      console.error('Erro ao parsear JSON de poemas:', error);
      res.status(500).send('Erro ao processar os poemas.');
    }
  });
});

app.get('/livro/:title', (req, res) => {
  const title = req.params.title;

  let bookFolder;
  let filePath;

  if (title === 'poemas') {
    // Se for "poemas", vamos retornar TODOS os poemas como páginas individuais
    bookFolder = '_books/poemas';
    filePath = path.join(__dirname, bookFolder);

    fs.readdir(filePath, (err, files) => {
      if (err) {
        console.error(`Erro ao acessar a pasta de poemas: ${err.message}`);
        return res.status(500).json({ error: 'Erro ao carregar poemas' });
      }

      let poems = {};

      // Filtrar apenas arquivos .json
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      if (jsonFiles.length === 0) {
        return res.status(404).json({ error: 'Nenhum poema encontrado' });
      }

      let processedFiles = 0;

      jsonFiles.forEach(file => {
        const poemPath = path.join(filePath, file);
        fs.readFile(poemPath, 'utf8', (err, data) => {
          if (!err) {
            try {
              const poemData = JSON.parse(data);
              poems[file.replace('.json', '')] = poemData.strophes.join("\n\n"); // Junta as estrofes
            } catch (jsonError) {
              console.error(`Erro ao parsear o poema ${file}: ${jsonError.message}`);
            }
          }

          processedFiles++;

          // Quando todos os arquivos forem lidos, responde com os poemas
          if (processedFiles === jsonFiles.length) {
            res.json({
              title: 'Poemas',
              genre: 'Poesia',
              page: poems
            });
          }
        });
      });
    });
  } else {
    // Para livros normais
    bookFolder = `_books/${title}`;
    filePath = path.join(__dirname, `${bookFolder}/${title}.json`);

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Erro ao ler o livro ${title}: ${err.message}`);
        return res.status(404).send('Livro não encontrado.');
      }
      res.json(JSON.parse(data));
    });
  }
});

console.log('Servindo arquivos da pasta:', path.join(__dirname, '_books'));
app.use('/_books', express.static(path.join(__dirname, '_books')));


// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);

});

