import { Flame, Timer, Trash2, UtensilsCrossed } from "lucide-react";
import { useState } from "react";

type Ticket = {
  id: string;
  table: string;
  status: "Confirmed" | "Preparing" | "Ready";
  items: string[];
  time: string;
};

const initialTickets: Ticket[] = [
  { id: "#45", table: "T02", status: "Preparing", items: ["Signature Ribeye", "Mashed Potatoes"], time: "12m" },
  { id: "#46", table: "T06", status: "Ready", items: ["Steakz Burger", "Fries"], time: "08m" },
  { id: "#47", table: "T03", status: "Confirmed", items: ["Ribeye 14oz", "Truffle Mac"], time: "04m" }
];

export function KitchenBoardPage() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [notice, setNotice] = useState("Kitchen board synced.");

  function advance(ticketId: string): void {
    setTickets(tickets.map((ticket) => {
      if (ticket.id !== ticketId) {
        return ticket;
      }
      const status = ticket.status === "Confirmed" ? "Preparing" : "Ready";
      setNotice(`${ticket.id} marked ${status.toLowerCase()}.`);
      return { ...ticket, status };
    }));
  }

  function clear(ticketId: string): void {
    setTickets(tickets.filter((ticket) => ticket.id !== ticketId));
    setNotice(`${ticketId} cleared from the kitchen board.`);
  }

  return (
    <section className="page kitchen-board">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Kitchen display</span>
          <h1>Kitchen Orders</h1>
        </div>
        <div className="status-pill"><span /> Fire line active</div>
      </div>
      <div className="inline-notice">{notice}</div>
      <div className="ticket-grid">
        {tickets.map((ticket) => (
          <article className="ticket-card" key={ticket.id}>
            <div className="tag-row">
              <span className={ticket.status === "Ready" ? "tag hot" : "tag"}>{ticket.id}</span>
              <span className="ticket-time"><Timer size={16} /> {ticket.time}</span>
            </div>
            <h2>{ticket.table}</h2>
            <span className="eyebrow">{ticket.status}</span>
            <ul>
              {ticket.items.map((item) => <li key={item}><UtensilsCrossed size={16} /> {item}</li>)}
            </ul>
            <button className="primary action-wide" type="button" onClick={() => advance(ticket.id)} disabled={ticket.status === "Ready"}>
              <Flame size={18} />
              {ticket.status === "Confirmed" ? "Start Preparing" : "Mark Ready"}
            </button>
            <button className="secondary-wide" type="button" onClick={() => clear(ticket.id)}><Trash2 size={18} /> Clear Ticket</button>
          </article>
        ))}
      </div>
    </section>
  );
}
