import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { analyticsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

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

  const loadData = async (nextType: "monthly" | "category") => {
    setLoading(true);
    setError("");
    try {
      const res = await analyticsAPI.get(nextType);
      setData(res.data || []);
    } catch (e: any) {
      setError(e.message || "Failed to load analytics");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!user?.is_admin) {
      navigate("/");
      return;
    }
    loadData(type);
  }, [type, isAuthenticated, user?.is_admin]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Sales Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setType("monthly")}
            className={`px-3 py-1.5 rounded text-sm ${type === "monthly" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setType("category")}
            className={`px-3 py-1.5 rounded text-sm ${type === "category" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            Category
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-16 text-gray-500">Loading analytics...</div>}
      {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}

      {!loading && !error && data.length === 0 && (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">No analytics data available.</div>
      )}

      {!loading && !error && data.length > 0 && type === "monthly" && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Average Order</th>
                <th className="px-4 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data as MonthlyRow[]).map((row) => (
                <tr key={row.PERIOD} className="border-t">
                  <td className="px-4 py-3">{row.PERIOD}</td>
                  <td className="px-4 py-3">{row.TOTAL_ORDERS}</td>
                  <td className="px-4 py-3">${Number(row.AVG_ORDER_VALUE).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold">${Number(row.TOTAL_REVENUE).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && data.length > 0 && type === "category" && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data as CategoryRow[]).map((row) => (
                <tr key={row.CATEGORY_NAME} className="border-t">
                  <td className="px-4 py-3">{row.CATEGORY_NAME}</td>
                  <td className="px-4 py-3">{row.TOTAL_ORDERS}</td>
                  <td className="px-4 py-3 font-semibold">${Number(row.TOTAL_REVENUE).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
