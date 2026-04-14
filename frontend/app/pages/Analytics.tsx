import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { analyticsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type MonthlyRow = {
  PERIOD: string;
  TOTAL_REVENUE: number;
  TOTAL_ORDERS: number;
  AVG_ORDER_VALUE: number;
};

type CategoryRow = {
  CATEGORY_NAME: string;
  TOTAL_REVENUE: number;
  TOTAL_ORDERS: number;
};

export default function Analytics() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [type, setType] = useState<"monthly" | "category">("monthly");
  const [data, setData] = useState<MonthlyRow[] | CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const monthlyData = type === "monthly" ? (data as MonthlyRow[]) : [];
  const categoryData = type === "category" ? (data as CategoryRow[]) : [];
  const totalRevenue = categoryData.reduce((sum, item) => sum + item.TOTAL_REVENUE, 0);
  const categoryDataWithColor = categoryData.map((item, i) => ({
    ...item,
    percentage: ((item.TOTAL_REVENUE / totalRevenue) * 100).toFixed(1),
    fill: [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
      '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
    ][i % 10],
  }));
  const formatMoney = (value?: number) => (value ?? 0).toFixed(2);
  const formatYAxis = (value: number | string): string => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return String(value);
    if (numericValue >= 1_000_000) return `${(numericValue / 1_000_000).toFixed(1)}M`;
    if (numericValue >= 1_000) return `${(numericValue / 1_000).toFixed(1)}K`;
    return numericValue.toString();
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{data.CATEGORY_NAME}</p>
          <p className="text-blue-600 font-medium">
            Revenue: ${formatMoney(data.TOTAL_REVENUE)}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Orders: {data.TOTAL_ORDERS}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Share: {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  // frontend cache
  const [cache, setCache] = useState<{
    monthly?: MonthlyRow[];
    category?: CategoryRow[];
  }>({});

  const loadData = async (nextType: "monthly" | "category") => {
    if (cache[nextType]) {
      setData(cache[nextType]!);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await analyticsAPI.get(nextType);
      setCache((prev) => ({ ...prev, [nextType]: res.data }));
      setData(res.data || []);
    } catch (e: any) {
      setError(e.message || "Failed to load analytics");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!isAuthenticated) return navigate("/login");
      if (!user?.is_admin) return navigate("/");
      await loadData(type);
    };

    run();
  }, [type, isAuthenticated, user?.is_admin, navigate]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc: any, cur: any) => {
        acc.orders += cur.TOTAL_ORDERS || 0;
        acc.revenue += cur.TOTAL_REVENUE || 0;
        return acc;
      },
      { orders: 0, revenue: 0 }
    );
  }, [data]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sales Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Track performance and revenue insights
          </p>
        </div>

        {/* TOGGLE */}
        <div className="flex gap-2">
          {["monthly", "category"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition
                ${
                  type === t
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 shadow">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Orders
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totals.orders}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-gray-800 shadow">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Revenue
          </p>
          <p className="text-2xl font-bold text-blue-600">
            ${formatMoney(totals.revenue)}
          </p>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* CONTENT */}
      {!loading && !error && data.length > 0 && (
        <>
          {/* CHART */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
            <h2 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {type === "monthly" ? "Revenue Trend" : "Revenue by Category"}
            </h2>

            {type === "monthly" ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <XAxis
                    dataKey="PERIOD"
                    interval={0}
                    tick={{ fontSize: 12, angle: 0, dy: 8 }}
                    tickFormatter={(value: any) => String(value)}
                    minTickGap={10}
                  />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="TOTAL_REVENUE"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={420}>
                <PieChart>
                  <Pie
                    data={categoryDataWithColor}
                    dataKey="TOTAL_REVENUE"
                    nameKey="CATEGORY_NAME"
                    cx="40%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    paddingAngle={2}
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {categoryDataWithColor.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ right: 0, top: '50%', transform: 'translateY(-50%)', maxHeight: 340, overflowY: 'auto' }}
                    formatter={(value, entry: any) => (
                      <span style={{ color: entry.color, fontSize: 13 }}>
                        {value} ({entry.payload.percentage}%)
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* TABLE */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
            <table className="min-w-full text-sm text-center">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  {type === "monthly" ? (
                    <>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Avg Order</th>
                      <th className="px-4 py-3">Revenue</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Revenue</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {type === "monthly" &&
                  (data as MonthlyRow[]).map((row) => (
                    <tr
                      key={row.PERIOD}
                      className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="px-4 py-3">{row.PERIOD}</td>
                      <td className="px-4 py-3">{row.TOTAL_ORDERS}</td>
                      <td className="px-4 py-3">
                        ${formatMoney(row.AVG_ORDER_VALUE)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        ${formatMoney(row.TOTAL_REVENUE)}
                      </td>
                    </tr>
                  ))}

                {type === "category" &&
                  (data as CategoryRow[]).map((row) => (
                    <tr
                      key={row.CATEGORY_NAME}
                      className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="px-4 py-3">{row.CATEGORY_NAME}</td>
                      <td className="px-4 py-3">{row.TOTAL_ORDERS}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        ${formatMoney(row.TOTAL_REVENUE)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* EMPTY */}
      {!loading && !error && data.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-10 text-center text-gray-500 dark:text-gray-400">
          No analytics data available.
        </div>
      )}
    </div>
  );
}