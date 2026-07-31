import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import './PortfolioCharts.css';

const COLORS = ['#4f46e5', '#0891b2', '#16a34a', '#ea580c', '#db2777', '#7c3aed'];

export function AllocationChart({ allocation }) {
  const data = useMemo(
    () => (allocation || []).map((item) => ({ name: item.symbol, value: item.value })),
    [allocation]
  );

  if (!data.length) {
    return <div className="chart-empty">Add holdings to see allocation.</div>;
  }

  return (
    <div className="chart-card">
      <h3>Allocation</h3>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="chart-legend">
        {allocation.map((item, index) => (
          <li key={item.symbol}>
            <span style={{ background: COLORS[index % COLORS.length] }} />
            {item.symbol} · {item.percent}%
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ValueHistoryChart({ history }) {
  if (!history?.length) {
    return <div className="chart-empty">No portfolio history yet.</div>;
  }

  return (
    <div className="chart-card">
      <h3>Value over time</h3>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={70} />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Line type="monotone" dataKey="total_value" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
