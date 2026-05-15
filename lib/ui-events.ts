/** Dispatched after login/signup stores token + user (see auth-modal). */
export const TIPICO_AUTH_SUCCESS_EVENT = 'tipico_auth_success';

/** Dispatched when wallet balance should refresh everywhere (e.g. after bet). */
export const TIPICO_WALLET_UPDATED_EVENT = 'tipico_wallet_updated';

/** Dispatched after a bet is placed so bet history can refresh in the background. */
export const TIPICO_BET_PLACED_EVENT = 'tipico_bet_placed';

/** Dispatched after a deposit proof is submitted so upload history can refresh. */
export const TIPICO_DEPOSIT_PROOF_SUBMITTED_EVENT = 'tipico_deposit_proof_submitted';

/** Same-origin tabs (e.g. admin approves deposit, user home open) can listen for instant wallet refresh. */
export const TIPICO_WALLET_BROADCAST_CHANNEL = 'tipico_wallet_broadcast';

export function broadcastWalletSyncAcrossTabs(): void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
  try {
    const bc = new BroadcastChannel(TIPICO_WALLET_BROADCAST_CHANNEL);
    bc.postMessage({ type: 'wallet_sync' });
    bc.close();
  } catch {
    /* private mode / unsupported */
  }
}
