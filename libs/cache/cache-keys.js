/**
 * Generación estandarizada de cache keys
 */
export const CacheKeys = {
  // Programs
  program: (programId) => `program:${programId}`,
  programList: (periodo) => `program:list:${periodo}`,

  // Users
  user: (userId) => `user:${userId}`,
  userByEmail: (email) => `user:email:${email}`,
  userAccess: (userId) => `user:access:${userId}`,

  // Configuration
  config: (key) => `config:${key}`,
  globalConfig: () => 'config:global',

  // Banks (maintainer)
  bank: (bankId) => `bank:${bankId}`,
  bankList: () => 'bank:list',

  // Contracts
  contractPdf: (sk) => `contract:pdf:${sk}`,

  // Balances
  balanceProgram: (sk) => `balance:program:${sk}`,

  // Currency rates
  currencyRates: () => 'currency:rates',

  // TTLs recomendados por tipo (en milisegundos)
  TTL: {
    PROGRAM: 10 * 60 * 1000,        // 10 minutos
    PROGRAM_LIST: 5 * 60 * 1000,    // 5 minutos
    USER: 5 * 60 * 1000,            // 5 minutos
    USER_ACCESS: 5 * 60 * 1000,     // 5 minutos
    CONFIG: 15 * 60 * 1000,         // 15 minutos
    BANK: 30 * 60 * 1000,           // 30 minutos
    BANK_LIST: 30 * 60 * 1000,      // 30 minutos
    CONTRACT_PDF: 15 * 60 * 1000,   // 15 minutos (PDFs son inmutables)
    BALANCE: 3 * 60 * 1000,         // 3 minutos (balances cambian con pagos)
    CURRENCY_RATES: 60 * 60 * 1000  // 1 hora (tasas se actualizan cada hora)
  }
};
