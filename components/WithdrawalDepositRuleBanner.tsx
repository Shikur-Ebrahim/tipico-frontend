type Props = {
  minDepositRequired: number;
  totalDeposits: number;
  met?: boolean;
};

/** Rule 1: minimum total approved deposits (admin Deposit Rule). */
export default function WithdrawalDepositRuleBanner({
  minDepositRequired,
  totalDeposits,
  met = false,
}: Props) {
  if (met) {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Rule 1 — Total deposit</p>
        <p className="mt-1 text-sm font-black text-emerald-950">Requirement met</p>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-900/90">
          Your approved deposits are{' '}
          <span className="font-black">{totalDeposits.toFixed(2)} ETB</span> (minimum{' '}
          <span className="font-black">{minDepositRequired} ETB</span>).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-red-700">Rule 1 — Total deposit</p>
      <p className="mt-1 text-sm font-black text-red-950">Withdrawal not available yet</p>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-red-900/90">
        To withdraw in Tipico betting, your total approved deposits must reach{' '}
        <span className="font-black">{minDepositRequired} ETB</span>. You have deposited{' '}
        <span className="font-black">{totalDeposits.toFixed(2)} ETB</span> so far.
      </p>
    </div>
  );
}
