#!/usr/bin/env node

const API_URL = process.env.AGENTCART_API_URL || 'https://agentcart.osskri.xyz/api/v1';
const WALLET = process.env.AGENT_WALLET || '';

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'list_products':
      const products = await fetch(`${API_URL}/products`, {
        headers: { 'x402-wallet': WALLET },
      });
      console.log(JSON.stringify(await products.json(), null, 2));
      break;

    case 'check_balance':
      const balance = await fetch(`${API_URL}/balance`, {
        headers: { 'x402-wallet': WALLET },
      });
      console.log(JSON.stringify(await balance.json(), null, 2));
      break;

    case 'call_api':
      const [provider, action, ...rest] = process.argv.slice(3);
      const body = rest.length ? JSON.parse(rest.join(' ')) : {};

      const res = await fetch(`${API_URL}/proxy/${provider}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x402-wallet': WALLET,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 402) {
        const paymentReq = JSON.parse(res.headers.get('x402-request') || '{}');
        console.log('Payment required:', JSON.stringify(paymentReq, null, 2));
        process.exit(1);
      }

      console.log(JSON.stringify(await res.json(), null, 2));
      break;

    case 'browser_action':
      const [bAction, ...bRest] = process.argv.slice(3);
      const bBody = bRest.length ? JSON.parse(bRest.join(' ')) : {};

      const bRes = await fetch(`${API_URL}/proxy/browser/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x402-wallet': WALLET,
        },
        body: JSON.stringify({ action: bAction, params: bBody }),
      });

      if (bRes.status === 402) {
        const bPaymentReq = JSON.parse(bRes.headers.get('x402-request') || '{}');
        console.log('Payment required:', JSON.stringify(bPaymentReq, null, 2));
        process.exit(1);
      }

      console.log(JSON.stringify(await bRes.json(), null, 2));
      break;

    default:
      console.log('Usage: agentcart-mcp <list_products|check_balance|call_api|browser_action> [args...]');
  }
}

main().catch(console.error);