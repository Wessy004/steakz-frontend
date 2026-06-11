import { CircleX, PlusCircle, Utensils } from "lucide-react";
import { useMemo, useState } from "react";

type TableState = {
  label: string;
  detail: string;
  status: "available" | "order" | "wait";
};

type OrderItem = {
  name: string;
  meta: string;
  price: number;
};

const initialTables: TableState[] = [
  { label: "T01", detail: "4 seats", status: "available" },
  { label: "T02", detail: "12 min", status: "order" },
  { label: "T03", detail: "waiting", status: "wait" },
  { label: "T04", detail: "", status: "available" },
  { label: "T05", detail: "", status: "available" },
  { label: "T06", detail: "late", status: "wait" },
  { label: "T07", detail: "", status: "available" },
  { label: "T08", detail: "", status: "order" }
];

export function WaiterConsolePage() {
  const [tables, setTables] = useState<TableState[]>(initialTables);
  const [selected, setSelected] = useState("T02");
  const [items, setItems] = useState<OrderItem[]>([
    { name: "Signature Ribeye", meta: "Medium rare + peppercorn", price: 54 },
    { name: "Mashed Potatoes", meta: "Double garlic", price: 12 }
  ]);
  const [notice, setNotice] = useState("Floor map synced.");
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);

  function selectTable(label: string): void {
    setSelected(label);
    setNotice(`${label} loaded into order panel.`);
  }

  function addSide(): void {
    setItems([...items, { name: "House Fries", meta: "Rosemary salt", price: 5.5 }]);
    setNotice("House Fries added to active order.");
  }

  function sendToKitchen(): void {
    setTables(tables.map((table) => table.label === selected ? { ...table, status: "wait", detail: "sent" } : table));
    setNotice(`${selected} sent to kitchen.`);
  }

  function pickup(): void {
    setTables(tables.map((table) => table.label === selected ? { ...table, status: "available", detail: "served" } : table));
    setItems([]);
    setNotice(`${selected} order picked up and table marked served.`);
  }

  return (
    <section className="page waiter-console">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Live shift</span>
          <h1>Waiter Console</h1>
        </div>
        <div className="status-pill"><span /> Floor map</div>
      </div>
      <div className="inline-notice">{notice}</div>

      <div className="waiter-grid">
        <article className="floor-map">
          <div className="section-heading">
            <div>
              <h2>Main Dining Hall</h2>
              <p>Tap a table to create or update a dine-in order.</p>
            </div>
          </div>
          <div className="table-map">
            {tables.map(({ label, detail, status }) => (
              <button className={`table-tile ${status} ${selected === label ? "selected" : ""}`} key={label} type="button" onClick={() => selectTable(label)}>
                <span>{label.replace("T", "")}</span>
                <strong>{label}</strong>
                <small>{detail}</small>
              </button>
            ))}
          </div>
        </article>

        <aside className="order-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">New order</span>
              <h2>Table #{selected.replace("T", "")}</h2>
            </div>
            <button className="icon-inline" type="button" onClick={() => setItems([])} aria-label="Clear order"><CircleX size={22} /></button>
          </div>
          {items.map((item, index) => (
            <div className={index === 0 ? "order-row hot" : "order-row"} key={`${item.name}-${index}`}><div><strong>{item.name}</strong><span>{item.meta}</span></div><b>£{item.price.toFixed(2)}</b></div>
          ))}
          <button className="add-item" type="button" onClick={addSide}><PlusCircle size={20} /> Tap items to add</button>
          <div className="receipt-total"><span>Total est.</span><strong>£{total.toFixed(2)}</strong></div>
          <button className="primary action-wide" type="button" onClick={sendToKitchen} disabled={items.length === 0}>Send to Kitchen</button>
          <div className="pickup-card"><Utensils size={28} /><div><strong>Order ready</strong><span>Order #45 at Station 1</span></div><button type="button" onClick={pickup}>Pickup</button></div>
        </aside>
      </div>
    </section>
  );
}
