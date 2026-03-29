/**
 * AC ANGRY - Agente Local (Hardware Bridge) 🛠️
 * Este script simula o programa que o AGR rodaria no Windows para conectar as leitoras USB.
 * 
 * Requisitos: 
 * npm install ws
 * Rodar: node ac_agent_local.js
 */

const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

console.log('⚡ Agente Local AC ANGRY rodando em ws://localhost:8080');
console.log('Esperando conexão do portal...');

wss.on('connection', (ws) => {
  console.log('✅ Portal Conectado! Hardware pronto para uso.');

  // Simular uma captura de biometria após 10 segundos de conexão
  setTimeout(() => {
    console.log('🖐️ Biometria Detectada na Leitora USB...');
    const payload = JSON.stringify({
      type: 'BIOMETRY_CAPTURED',
      timestamp: new Date().toISOString(),
      template: 'mock_fingerprint_template_data_0123456789'
    });
    ws.send(payload);
    console.log('Dados enviados ao portal.');
  }, 10000);

  ws.on('close', () => {
    console.log('❌ Portal desconectado.');
  });
});
