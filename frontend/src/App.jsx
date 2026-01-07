import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
// Correct import for the modern plainjs parser
import { Parser } from '@json2csv/plainjs';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';

function App() {
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, net_balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ amount: '', category: '', type: 'income' });
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [sumRes, listRes] = await Promise.all([
        axios.get('http://localhost:8080/summary'),
        axios.get('http://localhost:8080/transactions')
      ]);
      setSummary(sumRes.data);
      setTransactions(listRes.data || []);
    } catch (error) {
      console.error("Dashboard failed to sync:", error);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (active) {
        try { await loadData(); } catch (error) { console.error("Fetch error:", error); }
      }
    };
    fetchData();
    return () => { active = false; };
  }, [loadData]);

  // 🔍 Search/Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  // 💾 CSV Export Logic using @json2csv/plainjs
  const downloadCSV = () => {
    try {
      const parser = new Parser(); // Correct usage for @json2csv/plainjs
      const csv = parser.parse(transactions);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "WealthFlow_Export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // 📈 Chart Data Processing
  const chartData = useMemo(() => {
    return [...transactions].reverse().map((t, index, reversedArray) => {
      const currentBalance = reversedArray
        .slice(0, index + 1)
        .reduce((sum, item) => item.type === 'income' ? sum + item.amount : sum - item.amount, 0);
      return { category: t.category, balance: currentBalance };
    });
  }, [transactions]);

  const pieChartData = useMemo(() => {
    const categoryTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
    return Object.keys(categoryTotals).map(key => ({ name: key, value: categoryTotals[key] }));
  }, [transactions]);

  const growthMetrics = useMemo(() => ({
    income: (summary.total_income > 0 ? 15.5 : 0), // Mock growth for UI polish
    expense: (summary.total_expenses > 0 ? 8.2 : 0)
  }), [summary]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/transactions', {
        amount: Number.parseFloat(formData.amount),
        category: formData.category,
        type: formData.type
      });
      setFormData({ amount: '', category: '', type: 'income' });
      loadData();
    } catch (error) { console.error("Save failed:", error); }
  };

  const deleteTransaction = async (id) => {
    if (window.confirm("Remove this record?")) {
      try {
        await axios.delete(`http://localhost:8080/transactions?id=${id}`);
        loadData();
      } catch (error) { console.error("Delete failed:", error); }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <h1 className="text-5xl font-black">Wealth<span className="text-indigo-600">Flow</span></h1>
          <button onClick={downloadCSV} className="bg-white border px-6 py-3 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all">
            Export CSV
          </button>
        </header>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border h-[350px]">
            <h2 className="font-black mb-4 uppercase text-[10px] tracking-widest text-slate-400">Net Worth Trend</h2>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="col" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                <Tooltip />
                <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} fill="url(#col)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-8 rounded-[40px] shadow-sm border h-[350px]">
            <h2 className="font-black mb-4 uppercase text-[10px] tracking-widest text-slate-400">Expenses</h2>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart><Pie data={pieChartData} innerRadius={60} outerRadius={80} dataKey="value">{pieChartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-3xl border shadow-sm">
            <div className="flex justify-between font-black text-[10px] text-slate-400 uppercase"><span>Revenue</span><span className="text-green-500">↑ {growthMetrics.income}%</span></div>
            <p className="text-4xl font-black mt-2">${summary.total_income.toLocaleString()}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border shadow-sm">
            <div className="flex justify-between font-black text-[10px] text-slate-400 uppercase"><span>Outflow</span><span className="text-red-500">↑ {growthMetrics.expense}%</span></div>
            <p className="text-4xl font-black mt-2">${summary.total_expenses.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
            <span className="font-black text-[10px] text-slate-400 uppercase">Net Balance</span>
            <p className="text-4xl font-black mt-2">${summary.net_balance.toLocaleString()}</p>
          </div>
        </div>

        {/* Main Grid: Form and Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 bg-white p-10 rounded-[40px] shadow-sm border h-fit">
            <h2 className="text-2xl font-black mb-8">New Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" required />
              <input type="text" placeholder="Category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" required />
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold">
                <option value="income">Income (+)</option>
                <option value="expense">Expense (-)</option>
              </select>
              <button className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Submit</button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white rounded-[40px] shadow-sm border overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black">History</h2>
              <input type="text" placeholder="Filter..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 bg-slate-50 rounded-lg text-sm font-bold border-none" />
            </div>
            <table className="w-full text-left">
              <tbody className="divide-y">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="p-6 font-bold">{t.category}</td>
                    <td className={`p-6 text-right font-black ${t.type === 'income' ? 'text-green-500' : 'text-slate-900'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                    <td className="p-6 text-right">
                      <button onClick={() => deleteTransaction(t.id)} className="text-slate-300 hover:text-red-500 font-black text-[10px] uppercase">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;