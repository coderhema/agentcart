import 'dotenv/config';
import { USDC_MAINNET_ASA_ID, USDC_TESTNET_ASA_ID } from '@x402/avm';

// @x402/avm exports truncated CAIP-2 constants (bug in 2.19-2.24). Use the
// full canonical strings the GoPlausible facilitator accepts (from /supported).
const ALGORAND_MAINNET_CAIP2 = 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=';
const ALGORAND_TESTNET_CAIP2 = 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=';

const isMainnet = process.env.ALGORAND_NETWORK === 'mainnet';

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  x402Port: parseInt(process.env.X402_PORT || '4021'),
  nodeEnv: process.env.NODE_ENV || 'development',
  algorand: {
    network: process.env.ALGORAND_NETWORK || 'testnet',
    caip2: isMainnet ? ALGORAND_MAINNET_CAIP2 : ALGORAND_TESTNET_CAIP2,
    usdcAsaId: isMainnet ? USDC_MAINNET_ASA_ID : USDC_TESTNET_ASA_ID,
    walletAddress: process.env.AGENTCART_WALLET_ADDRESS || '',
    walletMnemonic: process.env.AGENTCART_WALLET_MNEMONIC || '',
  },
  x402: {
    facilitator: process.env.X402_FACILITATOR || 'https://facilitator.goplausible.xyz',
  },
  database: {
    url: process.env.DATABASE_URL || 'file:./data/agentcart.db',
  },
  dashboard: {
    passphrase: process.env.DASHBOARD_PASSPHRASE || 'agentcart-admin',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60'),
  },
  providers: {
    linkedin: {
      apiKey: process.env.LINKEDIN_API_KEY || '',
      baseUrl: process.env.LINKEDIN_API_BASE_URL || 'https://api.brightdata.com',
    },
    twitter: {
      bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    },
    openweather: {
      apiKey: process.env.OPENWEATHER_API_KEY || '',
    },
    email: {
      apiKey: process.env.EMAIL_VERIFICATION_API_KEY || '',
    },
  },
};