/**
 * AgentCart TestNet setup script - ONE command:
 *   1. Checks ALGO balance of payer + receiver
 *   2. Funds ALGO via AlgoKit Dispenser API (if ALGOKIT_DISPENSER_ACCESS_TOKEN set),
 *      otherwise prints exact faucet URLs
 *   3. Opts both accounts into TestNet USDC (ASA 10458941)
 *   4. Prints final balances
 *
 * Usage:
 *   ALGOKIT_DISPENSER_ACCESS_TOKEN=<token> npm run testnet:setup
 *   (without token: prints faucet links to fund manually, then opts in)
 */
import { config } from 'dotenv';
import algosdk, { Algodv2 } from 'algosdk';
import { TestNetDispenserApiClient } from '@algorandfoundation/algokit-utils';
import { seedFromMnemonic } from '@algorandfoundation/algokit-utils/algo25';

config();

const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const USDC_TESTNET_ASA = 10458941; // TestNet USDC
const MIN_ALGO = 0.2; // enough for opt-in fee + a few payments

// Accounts from the x402 test setup
const RECEIVER = {
  address: 'RO2CBOWPYD33AURIZ3H5UGHHVD3F4ATC32AS5RWUYCOIGEMFV42G34EDJE',
  mnemonic:
    'verb grant fashion know gown dress throw stereo fun text pipe spare alter sock inspire kiwi always nice hope mean wine rough surprise able try',
};
const PAYER = {
  address: 'W3DK5D3F7BVYAT5M2YS5NOP4N5ZHEVCIYPCD2PYQKX7IFYWL5ZCRF5IEZA',
  mnemonic:
    'indoor divorce best belt own tooth please harbor term stumble symbol aerobic rack catalog parade resist remember engage dream swim broom able satisfy abandon summer',
};

const algod = new Algodv2('', ALGOD_SERVER, '');

function fmtAlgo(µAlgo: number | bigint): string {
  return (Number(µAlgo) / 1e6).toFixed(4);
}

async function getBalances(address: string) {
  try {
    const info = await algod.accountInformation(address).do();
    const usdc = (info.assets || []).find((a: any) => a['asset-id'] === USDC_TESTNET_ASA);
    return {
      algo: Number(info.amount) / 1e6,
      usdc: usdc ? Number(usdc.amount) / 1e6 : 0,
      optedIn: Boolean(usdc),
    };
  } catch (e: any) {
    console.error(`  (could not fetch balance for ${address}: ${e.message})`);
    return { algo: 0, usdc: 0, optedIn: false };
  }
}

async function fundWithDispenser(address: string, amountAlgo: number) {
  const client = new TestNetDispenserApiClient();
  const res = await client.fund(address, Math.round(amountAlgo * 1e6));
  console.log(`  ✓ funded ${amountAlgo} ALGO -> ${address} (tx ${res.txId})`);
}

async function optIntoUSDC(account: { address: string; mnemonic: string }) {
  const seed = seedFromMnemonic(account.mnemonic);
  const key = algosdk.mnemonicToSecretKey(account.mnemonic);
  const suggested = await algod.getTransactionParams().do();
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: account.address,
    receiver: account.address,
    assetIndex: USDC_TESTNET_ASA,
    amount: 0,
    suggestedParams: suggested,
  });
  const signed = txn.signTxn(key.sk);
  const { txId } = await algod.sendRawTransaction(signed).do();
  // wait for confirmation
  await algosdk.waitForConfirmation(algod, txId, 4);
  console.log(`  ✓ opted ${account.address} into USDC (${USDC_TESTNET_ASA}) - tx ${txId}`);
  void seed;
}

async function main() {
  console.log('=== AgentCart TestNet setup ===');
  console.log(`Node: ${ALGOD_SERVER}`);
  console.log(`USDC ASA: ${USDC_TESTNET_ASA}\n`);

  const hasToken = Boolean(process.env.ALGOKIT_DISPENSER_ACCESS_TOKEN);

  for (const [label, acc] of [
    ['Receiver (payTo)', RECEIVER],
    ['Payer (agent)', PAYER],
  ] as const) {
    console.log(`--- ${label}: ${acc.address} ---`);
    const bal = await getBalances(acc.address);
    console.log(`  ALGO: ${bal.algo.toFixed(4)}  |  USDC: ${bal.usdc.toFixed(4)}  |  USDC opted-in: ${bal.optedIn}`);

    if (bal.algo < MIN_ALGO) {
      const needed = MIN_ALGO - bal.algo;
      if (hasToken) {
        try {
          await fundWithDispenser(acc.address, Math.ceil(needed * 2)); // top up with margin
        } catch (e: any) {
          console.error(`  ✗ dispenser failed: ${e.message}`);
          console.log('  → Manual fallback: https://lora.algokit.io/testnet/fund');
        }
      } else {
        console.log(`  ⚠ needs ~${needed.toFixed(2)} ALGO. Fund manually:`);
        console.log('    → https://lora.algokit.io/testnet/fund  (Google login + reCAPTCHA, ~10 ALGO)');
        console.log('    → or run with ALGOKIT_DISPENSER_ACCESS_TOKEN set (algokit dispenser login --ci)');
      }
    }

    if (!bal.optedIn) {
      try {
        await optIntoUSDC(acc);
      } catch (e: any) {
        console.error(`  ✗ USDC opt-in failed: ${e.message} (needs ALGO balance for the fee)`);
      }
    } else {
      console.log('  USDC already opted in ✓');
    }
    console.log();
  }

  console.log('=== Final balances ===');
  for (const [label, acc] of [
    ['Receiver (payTo)', RECEIVER],
    ['Payer (agent)', PAYER],
  ] as const) {
    const bal = await getBalances(acc.address);
    console.log(`  ${label}: ALGO ${bal.algo.toFixed(4)} | USDC ${bal.usdc.toFixed(4)}`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
