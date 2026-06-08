const user = { id: 'user_1' };
const partnerData = { id: 'partner_1' };
const mySplitPercentage = 50;

let myBalance = 16.99; // User owes 16.99 in May
let futureGlobalBalance = myBalance;
let initialSign = Math.sign(myBalance);
let isSettled = false;
let settledMonthName = '';

const futureExpenses = [
  // User owes 16.99
  // June: Partner pays 10 for dinner
  { date: '2026-06-05T12:00:00Z', amount: 10, is_transfer: false, is_refundable: false, paid_by: 'partner_1' },
  // User owes 16.99 + 5 = 21.99
  // User settles month in June!
  { date: '2026-06-06T12:00:00Z', amount: 21.99, is_transfer: true, is_refundable: false, paid_by: 'user_1' }
];

for (const exp of futureExpenses) {
  const amount = Number(exp.amount)
  if (exp.is_transfer) {
    if (exp.paid_by === user.id) futureGlobalBalance -= amount
    else futureGlobalBalance += amount
  } else if (exp.is_refundable) {
    if (exp.paid_by === user.id) futureGlobalBalance -= amount
    else futureGlobalBalance += amount
  } else {
    const myShare = amount * (mySplitPercentage / 100)
    if (exp.paid_by === user.id) futureGlobalBalance += (myShare - amount)
    else futureGlobalBalance += myShare
  }
  
  console.log('After expense', exp.amount, 'futureGlobalBalance is', futureGlobalBalance);
  
  if (Math.abs(futureGlobalBalance) < 0.5 || Math.sign(futureGlobalBalance) !== initialSign) {
    isSettled = true
    settledMonthName = new Date(exp.date).getMonth() + 1
    break
  }
}

console.log('isSettled:', isSettled, 'settledMonthName:', settledMonthName);
