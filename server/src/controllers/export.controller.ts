import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';
import { stringify } from 'csv-stringify/sync';

export const exportToCSV = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
        let transactions;
        if (userRole === 'ADMIN') {
            transactions = await prisma.transaction.findMany({
                include: {
                    user: { select: { email: true, name: true } },
                    category: { select: { name: true } }
                },
                orderBy: { date: 'desc' }
            });
        } else {
            transactions = await prisma.transaction.findMany({
                where: { userId },
                include: {
                    user: { select: { email: true, name: true } },
                    category: { select: { name: true } }
                },
                orderBy: { date: 'desc' }
            });
        }

        const totalIncome = transactions.filter((t: any) => t.type === 'INCOME').reduce((acc: number, t: any) => acc + t.amount, 0);
        const totalExpenses = transactions.filter((t: any) => t.type === 'EXPENSE').reduce((acc: number, t: any) => acc + t.amount, 0);
        const balance = totalIncome - totalExpenses;

        const data = transactions.map((t: any) => ({
            Date: (t.date as Date).toISOString().split('T')[0],
            Type: t.type,
            Category: t.category?.name || 'N/A',
            Amount: `$${Number(t.amount).toFixed(2)}`,
            Description: t.description,
            User: t.user?.email || 'Self'
        }));

        const csv = stringify(data, { header: true });

        // Add summary rows
        const summaryRows = [
            '',
            '',
            'SUMMARY',
            `Total Income,$${totalIncome.toFixed(2)}`,
            `Total Expenses,$${totalExpenses.toFixed(2)}`,
            `Net Balance,$${balance.toFixed(2)}`,
            '',
            `Report Generated,${new Date().toLocaleString()}`,
            `Total Transactions,${transactions.length}`
        ].join('\n');

        const bom = '\uFEFF';
        console.log(`Exporting ${data.length} transactions as CSV`);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.status(200).send(bom + csv + '\n' + summaryRows);
    } catch (error) {
        console.error('Export CSV Error:', error);
        res.status(500).json({ message: 'Error exporting data' });
    }
};

export const exportToHTML = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
        let transactions;
        let userName = '';
        if (userRole === 'ADMIN') {
            transactions = await prisma.transaction.findMany({
                include: {
                    user: { select: { email: true, name: true } },
                    category: { select: { name: true } }
                },
                orderBy: { date: 'desc' }
            });
            userName = 'Admin';
        } else {
            transactions = await prisma.transaction.findMany({
                where: { userId },
                include: {
                    user: { select: { email: true, name: true } },
                    category: { select: { name: true } }
                },
                orderBy: { date: 'desc' }
            });
            if (transactions.length > 0) {
                userName = (transactions[0] as any).user?.name || (transactions[0] as any).user?.email || 'User';
            }
        }

        const totalIncome = transactions.filter((t: any) => t.type === 'INCOME').reduce((acc: number, t: any) => acc + t.amount, 0);
        const totalExpenses = transactions.filter((t: any) => t.type === 'EXPENSE').reduce((acc: number, t: any) => acc + t.amount, 0);
        const balance = totalIncome - totalExpenses;

        // Category breakdown
        const categoryBreakdown: Record<string, { income: number; expense: number }> = {};
        transactions.forEach((t: any) => {
            const catName = t.category?.name || 'Unknown';
            if (!categoryBreakdown[catName]) categoryBreakdown[catName] = { income: 0, expense: 0 };
            if (t.type === 'INCOME') categoryBreakdown[catName].income += t.amount;
            else categoryBreakdown[catName].expense += t.amount;
        });

        const reportDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const categoryRows = Object.entries(categoryBreakdown).map(([name, data]) => `
            <tr>
                <td style="padding: 10px 16px; font-weight: 500;">${name}</td>
                <td style="padding: 10px 16px; color: #10b981; text-align: right;">$${data.income.toFixed(2)}</td>
                <td style="padding: 10px 16px; color: #ef4444; text-align: right;">$${data.expense.toFixed(2)}</td>
                <td style="padding: 10px 16px; text-align: right; font-weight: 600; color: ${(data.income - data.expense) >= 0 ? '#10b981' : '#ef4444'};">$${(data.income - data.expense).toFixed(2)}</td>
            </tr>
        `).join('');

        const transactionRows = transactions.map((t: any, i: number) => `
            <tr style="background: ${i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}; transition: background 0.2s;">
                <td style="padding: 12px 16px; color: #94a3b8;">${(t.date as Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td style="padding: 12px 16px;">${t.description}</td>
                <td style="padding: 12px 16px;">
                    <span style="background: rgba(99, 102, 241, 0.15); color: #818cf8; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${t.category?.name || 'N/A'}</span>
                </td>
                <td style="padding: 12px 16px;">
                    <span style="background: ${t.type === 'INCOME' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; color: ${t.type === 'INCOME' ? '#34d399' : '#f87171'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${t.type}</span>
                </td>
                <td style="padding: 12px 16px; text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; color: ${t.type === 'INCOME' ? '#10b981' : '#ef4444'};">
                    ${t.type === 'INCOME' ? '+' : '-'}$${Number(t.amount).toFixed(2)}
                </td>
                ${userRole === 'ADMIN' ? `<td style="padding: 12px 16px; color: #94a3b8; font-size: 13px;">${t.user?.email || '—'}</td>` : ''}
            </tr>
        `).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ExpenseTracker — Financial Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0a0e1a;
            color: #e2e8f0;
            min-height: 100vh;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .report-wrapper {
            max-width: 1100px;
            margin: 0 auto;
            padding: 40px 24px;
        }

        /* Header */
        .report-header {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
            border-radius: 20px;
            padding: 48px 40px;
            margin-bottom: 32px;
            position: relative;
            overflow: hidden;
        }

        .report-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
            border-radius: 50%;
        }

        .report-header::after {
            content: '';
            position: absolute;
            bottom: -30%;
            left: -10%;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
            border-radius: 50%;
        }

        .header-content {
            position: relative;
            z-index: 1;
        }

        .brand {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #a5b4fc;
            margin-bottom: 8px;
            font-weight: 600;
        }

        .report-title {
            font-size: 36px;
            font-weight: 800;
            background: linear-gradient(135deg, #fff, #c7d2fe);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 4px;
        }

        .report-meta {
            color: #a5b4fc;
            font-size: 14px;
            margin-top: 12px;
        }

        .report-meta span {
            margin-right: 24px;
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
            border: 1px solid rgba(99, 102, 241, 0.15);
            border-radius: 16px;
            padding: 28px 24px;
            text-align: center;
            backdrop-filter: blur(20px);
        }

        .stat-card.income { border-color: rgba(16, 185, 129, 0.3); }
        .stat-card.expense { border-color: rgba(239, 68, 68, 0.3); }
        .stat-card.balance { border-color: rgba(99, 102, 241, 0.3); }

        .stat-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #64748b;
            margin-bottom: 8px;
            font-weight: 600;
        }

        .stat-value {
            font-size: 32px;
            font-weight: 800;
            font-variant-numeric: tabular-nums;
        }

        .stat-value.income-val { color: #10b981; }
        .stat-value.expense-val { color: #ef4444; }
        .stat-value.balance-val { color: #818cf8; }

        .stat-count {
            font-size: 12px;
            color: #475569;
            margin-top: 4px;
        }

        /* Section */
        .section {
            background: linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8));
            border: 1px solid rgba(99, 102, 241, 0.1);
            border-radius: 16px;
            padding: 28px;
            margin-bottom: 24px;
            backdrop-filter: blur(20px);
        }

        .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-title .icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead th {
            text-align: left;
            padding: 12px 16px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #64748b;
            font-weight: 600;
            border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        thead th:last-child,
        thead th:nth-last-child(${userRole === 'ADMIN' ? '2' : '1'}) {
            text-align: right;
        }

        tbody tr {
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        tbody tr:last-child {
            border-bottom: none;
        }

        /* Footer */
        .report-footer {
            text-align: center;
            padding: 32px 0 16px;
            color: #475569;
            font-size: 12px;
        }

        .report-footer .logo {
            font-weight: 700;
            color: #6366f1;
            font-size: 14px;
            margin-bottom: 4px;
        }

        /* Print styles */
        @media print {
            body { background: #fff; color: #1e293b; }
            .report-header { background: #4338ca !important; }
            .section { border-color: #e2e8f0; background: #fff; }
            .stat-card { background: #f8fafc; }
            tbody tr { background: transparent !important; }
        }

        @page {
            margin: 0.5in;
            size: A4 landscape;
        }
    </style>
</head>
<body>
    <div class="report-wrapper">
        <!-- Header -->
        <div class="report-header">
            <div class="header-content">
                <div class="brand">ExpenseTracker</div>
                <div class="report-title">Financial Report</div>
                <div class="report-meta">
                    <span>📅 ${reportDate}</span>
                    <span>👤 ${userName}</span>
                    <span>📊 ${transactions.length} transactions</span>
                </div>
            </div>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card income">
                <div class="stat-label">Total Income</div>
                <div class="stat-value income-val">+$${totalIncome.toFixed(2)}</div>
                <div class="stat-count">${transactions.filter((t: any) => t.type === 'INCOME').length} transactions</div>
            </div>
            <div class="stat-card expense">
                <div class="stat-label">Total Expenses</div>
                <div class="stat-value expense-val">-$${totalExpenses.toFixed(2)}</div>
                <div class="stat-count">${transactions.filter((t: any) => t.type === 'EXPENSE').length} transactions</div>
            </div>
            <div class="stat-card balance">
                <div class="stat-label">Net Balance</div>
                <div class="stat-value balance-val">${balance >= 0 ? '+' : '-'}$${Math.abs(balance).toFixed(2)}</div>
                <div class="stat-count">${balance >= 0 ? 'Surplus' : 'Deficit'}</div>
            </div>
        </div>

        <!-- Category Breakdown -->
        <div class="section">
            <div class="section-title">
                <div class="icon" style="background: rgba(99, 102, 241, 0.15);">📂</div>
                Category Breakdown
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th style="text-align: right;">Income</th>
                        <th style="text-align: right;">Expenses</th>
                        <th style="text-align: right;">Net</th>
                    </tr>
                </thead>
                <tbody>
                    ${categoryRows}
                </tbody>
            </table>
        </div>

        <!-- Transactions -->
        <div class="section">
            <div class="section-title">
                <div class="icon" style="background: rgba(16, 185, 129, 0.15);">💳</div>
                All Transactions
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th style="text-align: right;">Amount</th>
                        ${userRole === 'ADMIN' ? '<th>User</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${transactionRows}
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <div class="report-footer">
            <div class="logo">ExpenseTracker</div>
            <div>Generated on ${new Date().toLocaleString()} • Premium Finance Management</div>
        </div>
    </div>
</body>
</html>`;

        console.log(`Exporting ${transactions.length} transactions as HTML report`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=expense-report.html');
        res.status(200).send(html);
    } catch (error) {
        console.error('Export HTML Error:', error);
        res.status(500).json({ message: 'Error exporting report' });
    }
};
