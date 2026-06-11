import { Banknote, CreditCard, Printer, ReceiptText, Utensils } from "lucide-react";
import { useMemo, useState } from "react";

type PaymentMethod = "Steakz App" | "Credit/Debit" | "Cash";

const bill = [
  { name: "Ribeye 14oz x2", price: 124 },
  { name: "Truffle Mac", price: 18.5 },
  { name: "Wagyu Burger", price: 28 },
  { name: "Old Fashioned x4", price: 72 }
];

export function CashierTerminalPage() {
  const subtotal = useMemo(() => bill.reduce((sum, item) => sum + item.price, 0), []);
  const service = subtotal * 0.15;
  const total = subtotal + service;
  const [amount, setAmount] = useState(total.toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>("Credit/Debit");
  const [splitMode, setSplitMode] = useState("Single Bill");
  const [notice, setNotice] = useState("Payment terminal ready.");

  function pressKey(key: string): void {
    if (key === "backspace") {
      setAmount(amount.slice(0, -1) || "0");
      return;
    }
    if (key === "." && amount.includes(".")) {
      return;
    }
    setAmount(amount === "0" ? key : `${amount}${key}`);
  }

  function printReceipt(): void {
    setNotice("Receipt sent to printer queue.");
  }

  function completePayment(): void {
    setNotice(`${method} payment of £${Number(amount).toFixed(2)} completed using ${splitMode.toLowerCase()}.`);
  }

  return (
    <section className="page cashier-terminal">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Cashier Terminal</span>
          <h1>Checkout System</h1>
        </div>
        <div className="status-pill"><span /> Table 12 active</div>
      </div>
      <div className="inline-notice">{notice}</div>

      <div className="cashier-grid">
        <article className="bill-panel">
          <div className="panel-title"><h2>Table 12</h2><span className="tag hot">Active</span></div>
          <div className="split-tabs">
            {["Single Bill", "Split by Item", "Split by Guest"].map((mode) => (
              <button className={splitMode === mode ? "active" : ""} key={mode} type="button" onClick={() => {
                setSplitMode(mode);
                setNotice(`${mode} selected.`);
              }}>{mode}</button>
            ))}
          </div>
          {bill.map((item) => <div className="receipt-line" key={item.name}><span>{item.name}</span><strong>£{item.price.toFixed(2)}</strong></div>)}
          <div className="receipt-line muted-line"><span>Service charge (15%)</span><strong>£{service.toFixed(2)}</strong></div>
          <div className="receipt-total mega"><span>Total</span><strong>£{total.toFixed(2)}</strong></div>
        </article>

        <article className="keypad-panel">
          <div className="panel-title"><span className="eyebrow">Payment amount</span><button type="button" onClick={() => setAmount("0")}>Clear All</button></div>
          <div className="amount-display">£{Number(amount || "0").toFixed(2)}</div>
          <div className="keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((key) => <button key={key} type="button" onClick={() => pressKey(key)}>{key}</button>)}
            <button type="button" onClick={() => pressKey("backspace")}>⌫</button>
          </div>
          <div className="payment-methods">
            <button className={method === "Steakz App" ? "selected" : ""} type="button" onClick={() => setMethod("Steakz App")}><Utensils size={22} /> Steakz App</button>
            <button className={method === "Credit/Debit" ? "selected" : ""} type="button" onClick={() => setMethod("Credit/Debit")}><CreditCard size={22} /> Credit/Debit</button>
            <button className={method === "Cash" ? "selected" : ""} type="button" onClick={() => setMethod("Cash")}><Banknote size={22} /> Cash</button>
          </div>
        </article>

        <aside className="paper-receipt">
          <ReceiptText size={26} />
          <h2>STEAKZ</h2>
          <span>Premium Hospitality Systems</span>
          {bill.map((item) => <div className="paper-line" key={item.name}><span>{item.name}</span><strong>£{item.price.toFixed(2)}</strong></div>)}
          <div className="paper-total"><span>Total due</span><strong>£{Number(amount || "0").toFixed(2)}</strong></div>
          <button type="button" onClick={printReceipt}><Printer size={18} /> Print</button>
          <button className="primary" type="button" onClick={completePayment}>Complete</button>
        </aside>
      </div>
    </section>
  );
}
