type Props = {
  minDepositRequired: number;
  totalDeposits: number;
};

export default function WithdrawalDepositRuleBanner({ minDepositRequired, totalDeposits }: Props) {
  return (
    <div className="mb-4 rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm">
      <p className="text-sm font-black text-red-950">Withdrawal not available yet</p>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-red-900/90">
        To withdraw in Tipico betting, your total approved deposits must reach{' '}
        <span className="font-black">{minDepositRequired} ETB</span>. You have deposited{' '}
        <span className="font-black">{totalDeposits.toFixed(2)} ETB</span> so far.
      </p>
    </div>
  );
}
