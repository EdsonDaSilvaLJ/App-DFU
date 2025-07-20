//criação da minha instância de autenticação

const admin = require('firebase-admin');
const serviceAcount = require('./dfu-app1-firebase-adminsdk-fbsvc-64e7a9d78e.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAcount),
  storageBucket: 'dfu-app1.appspot.com'
});

module.exports = admin;