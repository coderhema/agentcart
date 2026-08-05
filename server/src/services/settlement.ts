import algosdk from 'algosdk';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export interface SettlementPayment {
  item_id: string;
  title: string;
  amount_usdc: number;
  seller_payto: string;
}

export interface SettlementResult {
  success: boolean;
  txn_group_id?: string;
  txids?: string[];
  round?: number;
  error?: string;
}

const NETWORKS = {
  testnet: 'https://testnet-api.algonode.cloud',
  mainnet: 'https://mainnet-api.algonode.cloud',
};

export class SettlementService {
  private algod: algosdk.Algodv2;
  private payerAccount: algosdk.Account;

  constructor(payerMnemonic: string) {
    const url = NETWORKS[config.algorand.network as keyof typeof NETWORKS] || NETWORKS.testnet;
    this.algod = new algosdk.Algodv2('', url);
    this.payerAccount = algosdk.mnemonicToSecretKey(payerMnemonic);
  }

  get payerAddress(): string {
    return this.payerAccount.addr;
  }

  /**
   * Builds one Algorand atomic transaction group that splits a single payment
   * across multiple sellers. All transfers settle together or none do.
   */
  async settleAtomicSplit(payments: SettlementPayment[]): Promise<SettlementResult> {
    if (payments.length === 0) {
      return { success: false, error: 'No payments to settle' };
    }

    const asaId = config.algorand.usdcAsaId;
    const params = await this.algod.getTransactionParams().do();

    const txs: algosdk.Transaction[] = payments.map((payment) => {
      const amount = Math.round(payment.amount_usdc * 1_000_000);
      if (amount <= 0) {
        throw new Error(`Invalid amount for item '${payment.title}'`);
      }

      const note = algosdk.encodeObj({
        protocol: 'agentcart',
        item: payment.item_id,
        title: payment.title,
        v: 1,
      });

      return algosdk.makeAssetTransferTxnWithSuggestedParams(
        this.payerAccount.addr,
        payment.seller_payto,
        undefined,
        undefined,
        amount,
        note,
        asaId,
        params,
      );
    });

    const grouped = algosdk.assignGroupID(txs);
    const signed = grouped.map((tx) => tx.signTxn(this.payerAccount.sk));
    const txids = grouped.map((tx) => tx.txID());

    try {
      const { txId, round } = await this.algod.sendRawTransaction(signed).do();
      logger.info(`Atomic group settled: ${txId}, round ${round}, ${payments.length} payments`);
      return { success: true, txn_group_id: txId, txids, round };
    } catch (error) {
      logger.error('Atomic group settlement failed', error);
      return { success: false, error: (error as Error).message, txids };
    }
  }
}