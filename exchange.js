const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, Token } = require('@solana/spl-token');

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
  // Встановлюємо CORS заголовки
  const headers = {
    "Access-Control-Allow-Origin": "*",  // Дозволяє доступ з будь-якої доменної зони
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",  // Дозволяє запити GET, POST та OPTIONS
    "Access-Control-Allow-Headers": "Content-Type, Authorization"  // Дозволяє вказані заголовки
  };

  // Якщо запит є OPTIONS (preflight запит для CORS), повертаємо тільки заголовки
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: headers
    };
  }

  // Отримуємо дані з тіла запиту
  const { amount, tokenType, walletAddress } = JSON.parse(event.body);

  if (!amount || !tokenType || !walletAddress) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' }),
      headers: headers
    };
  }

  try {
    // Створюємо транзакцію для переведення
    const transaction = new Transaction();

    let tokenMintAddress;
    if (tokenType === "USDT") {
      tokenMintAddress = USDT_MINT_ADDRESS;
    } else if (tokenType === "USDC") {
      tokenMintAddress = USDC_MINT_ADDRESS;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unsupported token type' }),
        headers: headers
      };
    }

    // Отримуємо токен-аккаунт для переведення
    const token = new Token(connection, tokenMintAddress, TOKEN_PROGRAM_ID, serviceWallet);

    // Отримуємо обліковий запис для токену
    const fromTokenAccount = await token.getOrCreateAssociatedAccountInfo(serviceWallet.publicKey);
    const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(new PublicKey(walletAddress));

    // Створюємо операцію для переведення токенів SPL
    const transferTransaction = Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      fromTokenAccount.address,
      toTokenAccount.address,
      serviceWallet.publicKey,
      [],
      amount * 1_000_000  // Припускаємо, що 1 USDT або 1 USDC = 1_000_000 lamports (1 токен)
    );

    // Додаємо операцію до транзакції
    transaction.add(transferTransaction);

    // Підписуємо транзакцію
    const signature = await connection.sendTransaction(transaction, [serviceWallet]);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, txid: signature }),
      headers: headers
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: headers
    };
  }
};
