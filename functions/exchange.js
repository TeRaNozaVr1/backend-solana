// netlify/functions/exchange.js

const { Connection, PublicKey, Keypair, Transaction, SystemProgram } = require('@solana/web3.js');

// Підключення до Solana через Ankr
const SOLANA_RPC_URL = "https://rpc.ankr.com/solana";  // Використовуємо Ankr для підключення до Solana
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Використовуємо секретний ключ для облікового запису
const SERVICE_WALLET_SECRET = process.env.SERVICE_WALLET_SECRET; // Ви можете зберігати секрет в змінній середовища
const serviceWallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(SERVICE_WALLET_SECRET)));

// Адреси токенів, які ми будемо використовувати
const USDT_MINT_ADDRESS = new PublicKey("Es9vMFrzrQZsjAFVUtzz5N7Z9WhwZ1x7pH2aVttYhf5d");  // адреса USDT
const USDC_MINT_ADDRESS = new PublicKey("Es9vMFrzrQZsjAFVUtzz5N7Z9WhwZ1x7pH2aVttYhf5d");  // адреса USDC
const TOKEN_ACCOUNT = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"); // Ваш токен-аккаунт

exports.handler = async (event, context) => {
  // Отримуємо дані з тіла запиту
  const { amount, tokenType } = JSON.parse(event.body);

  if (!amount || !tokenType) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' })
    };
  }

  try {
    // Створюємо транзакцію для переведення
    const transaction = new Transaction();

    let tokenToSend;
    if (tokenType === "USDT") {
      tokenToSend = USDT_MINT_ADDRESS;
    } else if (tokenType === "USDC") {
      tokenToSend = USDC_MINT_ADDRESS;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unsupported token type' })
      };
    }

    // Створюємо операцію для переведення
    const transferTransaction = SystemProgram.transfer({
      fromPubkey: serviceWallet.publicKey,
      toPubkey: TOKEN_ACCOUNT,
      lamports: amount * 1_000_000  // Припускаємо, що 1 USDT = 1_000_000 lamports
    });

    transaction.add(transferTransaction);

    // Підписуємо транзакцію
    const signature = await connection.sendTransaction(transaction, [serviceWallet]);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, txid: signature })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};