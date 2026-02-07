import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Plus, Trash2 } from 'lucide-react';

interface Transaction {
    id: string;
    amount: number;
    description: string;
    category: string;
    type: 'INCOME' | 'EXPENSE';
    date: string;
    user?: { name: string; email: string };
}

const COLORS = ['#10b981', '#ef4444', '#6366f1', '#f59e0b', '#ec4899'];

const DashboardPage = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ amount: '', description: '', category: 'General', type: 'EXPENSE', date: new Date().toISOString().split('T')[0] });

    const fetchTransactions = async () => {
        try {
            const { data } = await api.get('/transactions');
            setTransactions(data);
        } catch {
            console.error('Failed to fetch transactions');
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchTransactions();
    }, []);

    const stats = useMemo(() => {
        const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, current) => acc + current.amount, 0);
        const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, current) => acc + current.amount, 0);
        return { income, expenses, balance: income - expenses };
    }, [transactions]);

    const chartData = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const daily = transactions.filter(t => t.date.split('T')[0] === date);
            return {
                date,
                income: daily.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0),
                expenses: daily.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0)
            };
        });
    }, [transactions]);

    const categoryData = useMemo(() => {
        const cats: Record<string, number> = {};
        transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
            cats[t.category] = (cats[t.category] || 0) + t.amount;
        });
        return Object.keys(cats).map(key => ({ name: key, value: cats[key] }));
    }, [transactions]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/transactions', formData);
            setShowForm(false);
            setFormData({ amount: '', description: '', category: 'General', type: 'EXPENSE', date: new Date().toISOString().split('T')[0] });
            fetchTransactions();
        } catch {
            alert('Failed to add transaction');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/transactions/${id}`);
            fetchTransactions();
        } catch {
            alert('Failed to delete');
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/transactions/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'transactions.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            alert('Export failed');
        }
    };

    return (
        <div>
            <Navbar />
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1>Dashboard</h1>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> Add Transaction
                        </button>
                        <button className="btn-primary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#475569' }}>
                            <Download size={18} /> Export CSV
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div className="glass" style={{ padding: '24px', marginBottom: '30px', animation: 'fadeIn 0.3s' }}>
                        <h2>New Transaction</h2>
                        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                            <div className="input-group">
                                <label>Amount</label>
                                <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label>Description</label>
                                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label>Category</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option>General</option>
                                    <option>Food</option>
                                    <option>Rent</option>
                                    <option>Transport</option>
                                    <option>Entertainment</option>
                                    <option>Salary</option>
                                    <option>Freelance</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Type</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}>
                                    <option value="INCOME">Income</option>
                                    <option value="EXPENSE">Expense</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Date</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                            </div>
                            <div style={{ alignSelf: 'end', marginBottom: '20px' }}>
                                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Save</button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
                    <div className="glass stat-card">
                        <p style={{ color: 'var(--text-muted)' }}>Total Balance</p>
                        <p className="stat-value">${stats.balance.toFixed(2)}</p>
                    </div>
                    <div className="glass stat-card">
                        <p style={{ color: 'var(--text-muted)' }}>Income</p>
                        <p className="stat-value income">+${stats.income.toFixed(2)}</p>
                    </div>
                    <div className="glass stat-card">
                        <p style={{ color: 'var(--text-muted)' }}>Expenses</p>
                        <p className="stat-value expense">-${stats.expenses.toFixed(2)}</p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="glass" style={{ padding: '24px', height: '400px' }}>
                        <h3 style={{ marginBottom: '20px' }}>Activity (Last 7 Days)</h3>
                        <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                                <YAxis stroke="var(--text-muted)" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid var(--glass-border)', color: '#fff' }} />
                                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" />
                                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass" style={{ padding: '24px', height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ alignSelf: 'flex-start', marginBottom: '20px' }}>Expenses by Category</h3>
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass" style={{ marginTop: '40px', padding: '24px', overflowX: 'auto' }}>
                    <h3 style={{ marginBottom: '20px' }}>Recent Transactions</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Amount</th>
                                {transactions[0]?.user && <th>User</th>}
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id}>
                                    <td>{new Date(t.date).toLocaleDateString()}</td>
                                    <td>{t.description}</td>
                                    <td><span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>{t.category}</span></td>
                                    <td><span className={t.type === 'INCOME' ? 'income' : 'expense'}>{t.type}</span></td>
                                    <td style={{ fontWeight: 600 }}>${t.amount.toFixed(2)}</td>
                                    {t.user && <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.user.name}</td>}
                                    <td>
                                        <button onClick={() => handleDelete(t.id)} style={{ color: 'var(--danger)', background: 'none' }}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No transactions yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
