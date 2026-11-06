require('dotenv').config();

const { refreshInstagramToken } = require('../services/instagram-token.service');

async function main() {
  try {
    const result = await refreshInstagramToken();

    console.log('Instagram: renovación completada');
    console.log('Duración del token (segundos):', result.expires_in);
  } catch (error) {
    console.error('Instagram: renovación fallida:', error.message);
    process.exitCode = 1;
  }
}

main();
