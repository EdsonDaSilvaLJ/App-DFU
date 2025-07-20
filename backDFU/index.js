const cors = require('cors');
const mongoose = require('mongoose');
const express = require('express');  // importa o express
require('dotenv').config({ path: './config/.env'});  // Carrega as variáveis de ambiente do arquivo .env


const app = express();               // cria o app
const port = 3000;                   // define a porta do servidor
app.use(cors());
app.use(express.json());

// Variável de ambiente MONGO_URI
const MONGO_URI = process.env.MONGO_URI;  // Aqui você acessa a variável do .env a qual   

//importação das rotas
const pacienteRoute = require('./routes/pacienteRoute');
const logupRoute = require('./routes/logupRoute');

// Conectar ao MongoDB Atlas usando a variável de ambiente MONGO_URI
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
  .catch((err) => console.error('Erro na conexão:', err));

/*
app.get('/ping', (req, res) => {
  res.send('pong!');
});
*/

app.use('/pacientes', pacienteRoute);
app.use('/logup', logupRoute);


// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor funcionando!');
});

// Inicia o servidor 
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});