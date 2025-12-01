import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

// API Configuration
const API_BASE_URL = "YOUR_API_BASE_URL"; // Replace with actual API URL

const SalesDashboard = () => {
  // State Management
  const [token, setToken] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [beforeToken, setBeforeToken] = useState(null);
  const [afterToken, setAfterToken] = useState(null);
  const [paginationHistory, setPaginationHistory] = useState([]);

  // Sorting States
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // Cache for filters
  const [cache, setCache] = useState({});

  // Get Authorization Token
  useEffect(() => {
    const getAuthorization = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/getAuthorize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Add required auth fields here
            // username: 'your_username',
            // password: 'your_password',
          }),
        });

        const data = await response.json();
        setToken(data.token || data.authorization); // Adjust based on actual response
      } catch (err) {
        setError("Failed to get authorization");
        console.error(err);
      }
    };

    getAuthorization();
  }, []);

  // Fetch Sales Data
  const fetchSalesData = async (options = {}) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    // Create cache key
    const cacheKey = JSON.stringify({
      startDate,
      endDate,
      minPrice,
      customerEmail,
      phoneNumber,
      before: options.before,
      after: options.after,
      sortField,
      sortDirection,
    });

    // Check cache first
    if (cache[cacheKey]) {
      setSalesData(cache[cacheKey].data);
      setBeforeToken(cache[cacheKey].beforeToken);
      setAfterToken(cache[cacheKey].afterToken);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        limit: "50",
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(minPrice && { min_price: minPrice }),
        ...(customerEmail && { customer_email: customerEmail }),
        ...(phoneNumber && { phone_number: phoneNumber }),
        ...(options.before && { before: options.before }),
        ...(options.after && { after: options.after }),
        ...(sortField && { sort_by: sortField }),
        ...(sortDirection && { sort_order: sortDirection }),
      });

      const response = await fetch(`${API_BASE_URL}/sales?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      setSalesData(data.sales || data.data || []);
      setBeforeToken(data.before || null);
      setAfterToken(data.after || null);

      // Update cache
      setCache((prev) => ({
        ...prev,
        [cacheKey]: {
          data: data.sales || data.data || [],
          beforeToken: data.before || null,
          afterToken: data.after || null,
        },
      }));
    } catch (err) {
      setError("Failed to fetch sales data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when token is available
  useEffect(() => {
    if (token) {
      fetchSalesData();
    }
  }, [token]);

  // Handle filter changes
  const handleFilterChange = () => {
    setCurrentPage(1);
    setPaginationHistory([]);
    fetchSalesData();
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
    setPaginationHistory([]);
  };

  // Effect for sorting
  useEffect(() => {
    if (sortField && token) {
      fetchSalesData();
    }
  }, [sortField, sortDirection]);

  // Handle pagination
  const handleNextPage = () => {
    if (afterToken) {
      setPaginationHistory((prev) => [
        ...prev,
        { before: beforeToken, after: afterToken },
      ]);
      setCurrentPage((prev) => prev + 1);
      fetchSalesData({ after: afterToken });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newHistory = [...paginationHistory];
      const previousState = newHistory.pop();
      setPaginationHistory(newHistory);
      setCurrentPage((prev) => prev - 1);

      if (previousState) {
        fetchSalesData({ before: previousState.before });
      } else {
        fetchSalesData();
      }
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!salesData.length) return [];

    // Group sales by date
    const groupedByDate = salesData.reduce((acc, sale) => {
      const date = new Date(sale.date || sale.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, totalSales: 0 };
      }
      acc[date].totalSales += parseFloat(sale.price || sale.amount || 0);
      return acc;
    }, {});

    return Object.values(groupedByDate).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [salesData]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track and analyze your sales data
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Price
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Customer Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Apply Filters Button */}
            <div className="flex items-end">
              <button
                onClick={handleFilterChange}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Sales Over Time
          </h2>
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalSales"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Total Sales"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Sales Records
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("date")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          Date
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("price")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          Price
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.length > 0 ? (
                      salesData.map((sale, index) => (
                        <tr key={sale.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.id || index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(
                              sale.date || sale.created_at
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.customer_email || sale.email || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.phone_number || sale.phone || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            $
                            {parseFloat(sale.price || sale.amount || 0).toFixed(
                              2
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {sale.product_name || sale.product || "N/A"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No sales data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">Page {currentPage}</div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={!afterToken}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
