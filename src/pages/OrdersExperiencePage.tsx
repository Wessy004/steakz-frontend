import { Flame, Plus, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";

type MenuItem = {
  name: string;
  meta: string;
  price: number;
  featured?: boolean;
};

const items: MenuItem[] = [
  { name: "Signature Ribeye", meta: "Medium rare | peppercorn", price: 54, featured: true },
  { name: "Steakz Burger", meta: "House relish | smoked cheddar", price: 14.5 },
  { name: "Truffle Mac", meta: "Extra shavings", price: 18.5 },
  { name: "Old Fashioned", meta: "Smoked oak base", price: 18 }
];

export function OrdersExperiencePage() {
  const [cart, setCart] = useState<MenuItem[]>([items[0], items[2]]);
  const [notice, setNotice] = useState("Menu synced with kitchen.");
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  function addItem(item: MenuItem): void {
    setCart([...cart, item]);
    setNotice(`${item.name} added to current order.`);
  }

  function placeOrder(): void {
    setNotice(`Order placed. Estimated total £${total.toFixed(2)} sent to kitchen.`);
    setCart([]);
  }

  return (
    <section className="page customer-experience">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Guest Experience</span>
          <h1>Order & Pay</h1>
        </div>
        <div className="status-pill"><span /> Kitchen online</div>
      </div>
      <div className="inline-notice">{notice}</div>

      <div className="customer-grid">
        <article className="menu-feature">
          <Flame size={30} />
          <span className="eyebrow">Chef selected</span>
          <h2>Wood-fired ribeye, finished over flame</h2>
          <p>Premium cut, bone marrow butter, crisp fries, peppercorn sauce.</p>
          <strong>£54.00</strong>
        </article>

        <div className="menu-list">
          {items.map((item) => (
            <article className={item.featured ? "menu-item featured" : "menu-item"} key={item.name}>
              <div>
                <h3>{item.name}</h3>
                <p>{item.meta}</p>
              </div>
              <strong>£{item.price.toFixed(2)}</strong>
              <button type="button" aria-label={`Add ${item.name}`} onClick={() => addItem(item)}><Plus size={18} /></button>
            </article>
          ))}
        </div>

        <aside className="order-drawer">
          <ShoppingBag size={24} />
          <span className="eyebrow">Current Order</span>
          {cart.length > 0 ? cart.map((item, index) => (
            <div className="receipt-line" key={`${item.name}-${index}`}><span>{item.name}</span><strong>£{item.price.toFixed(2)}</strong></div>
          )) : <div className="empty-state">No active items.</div>}
          <div className="receipt-total"><span>Total est.</span><strong>£{total.toFixed(2)}</strong></div>
          <button className="primary action-wide" type="button" onClick={placeOrder} disabled={cart.length === 0}>Place Order</button>
        </aside>
      </div>
    </section>
  );
}
