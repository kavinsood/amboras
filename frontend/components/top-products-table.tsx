import { EmptyState } from "@/components/empty-state";

type TopProduct = {
  id: string;
  name: string;
  revenue: string;
  orders: number;
  share: string;
};

type TopProductsTableProps = {
  items: TopProduct[];
};

export function TopProductsTable({ items }: TopProductsTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        compact
        title="No ranked products yet"
        message="Once purchase revenue lands for this window, the leading products will appear here."
      />
    );
  }

  return (
    <div className="table-shell" role="table" aria-label="Top products">
      <div className="table-header-row" role="row">
        <span role="columnheader">Product</span>
        <span role="columnheader">Orders</span>
        <span role="columnheader">Revenue</span>
      </div>

      <div className="table-body">
        {items.map((item, index) => (
          <div key={item.id} className="table-row" role="row">
            <div className="table-product-cell">
              <span className="table-rank">#{index + 1}</span>
              <div>
                <strong>{item.name}</strong>
                <p>{item.share} of ranked revenue</p>
              </div>
            </div>
            <div className="table-mobile-metric">
              <span className="table-mobile-label">Orders</span>
              <span className="table-number">{item.orders}</span>
            </div>
            <div className="table-mobile-metric">
              <span className="table-mobile-label">Revenue</span>
              <span className="table-revenue">{item.revenue}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
