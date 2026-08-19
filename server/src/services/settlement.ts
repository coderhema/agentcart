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
    return this.payerAccount.addr.toString();
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

      return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: this.payerAccount.addr.toString(),
        receiver: payment.seller_payto,
        amount,
        note,
        assetIndex: Number(asaId),
        suggestedParams: params,
      });
    });

    const grouped = algosdk.assignGroupID(txs);
    const signed = grouped.map((tx) => tx.signTxn(this.payerAccount.sk));
    const txids = grouped.map((tx) => tx.txID());

    try {
      const { txid } = await this.algod.sendRawTransaction(signed).do();
      let round: number | undefined;
      try {
        const pending = await algosdk.waitForConfirmation(this.algod, txid, 4);
        round = pending.confirmedRound !== undefined ? Number(pending.confirmedRound) : undefined;
      } catch (confirmationError) {
        logger.warn(`Group submitted (${txid}) but confirmation polling failed`, confirmationError);
      }
      logger.info(`Atomic group settled: ${txid}, round ${round}, ${payments.length} payments`);
      return { success: true, txn_group_id: txid, txids, round };
    } catch (error) {
      logger.error('Atomic group settlement failed', error);
      return { success: false, error: (error as Error).message, txids };
    }
  }
}