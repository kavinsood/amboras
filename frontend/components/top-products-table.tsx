type TopProduct = {
  id: string;
  name: string;
  revenue: string;
  orders: number;
};

type TopProductsTableProps = {
  items: TopProduct[];
};

export function TopProductsTable({ items }: TopProductsTableProps) {
  if (items.length === 0) {
    return <div className="empty-state">No product revenue yet for this time window.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--muted)" }}>
            <th style={{ padding: "10px 8px" }}>Product</th>
            <th style={{ padding: "10px 8px" }}>Orders</th>
            <th style={{ padding: "10px 8px" }}>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ borderTop: "1px solid var(--line)" }}>
              <td style={{ padding: "14px 8px", fontWeight: 600 }}>{item.name}</td>
              <td style={{ padding: "14px 8px" }}>{item.orders}</td>
              <td style={{ padding: "14px 8px" }}>{item.revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
