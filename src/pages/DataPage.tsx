import { useEffect, useState } from "react";
import { api } from "../api/client.js";

type Row = Record<string, unknown>;

export function DataPage({ title, endpoint }: { title: string; endpoint: string }) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    async function load(): Promise<void> {
      const response = await api.get<{ success: boolean; data: unknown }>(endpoint);
      if (response.data.success && Array.isArray(response.data.data)) {
        setRows(response.data.data as Row[]);
      } else if (response.data.success) {
        setRows([response.data.data as Row]);
      }
    }

    void load();
  }, [endpoint]);

  const keys = rows[0] ? Object.keys(rows[0]).filter((key) => key !== "items") : [];

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Steakz MIS</span>
          <h1>{title}</h1>
        </div>
        <div className="status-pill">
          <span />
          Synced
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{keys.map((key) => <th key={key}>{key}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={String(row.id ?? index)}>
                {keys.map((key) => <td key={key}>{String(row[key] ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
