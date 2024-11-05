import React, { useEffect, useState } from 'react';
import { fetchEquityHubs } from './apiService';
import { PieChart, Pie, Cell, Tooltip, LabelList } from 'recharts';

interface EquityHub {
    stock_No: number;
    symbol: string;
    name: string;
    dividend_yield: number;
    price: number;
    shares_owned: number;
    industry: string;
}

const Analysis: React.FC = () => {
    const [equityHubs, setEquityHubs] = useState<EquityHub[]>([]);
    const [groupedData, setGroupedData] = useState<{ [key: string]: EquityHub[] }>({});

    // 初期データを取得
    useEffect(() => {
        fetchEquityHubs(setEquityHubs);
    }, []);

    // industryを基にequityHubsをグループ化
    useEffect(() => {
        const groupedData = equityHubs.reduce((acc, equityHub) => {
            if (!acc[equityHub.industry]) {
                acc[equityHub.industry] = [];
            }
            acc[equityHub.industry].push(equityHub);
            return acc;
        }, {} as { [key: string]: EquityHub[] });
        setGroupedData(groupedData);
    }, [equityHubs]);

    // 金額をフォーマットする
    const formatCurrency = (value: number) => {
        return `${value.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    // 業種ごとの合計額を計算
    const industryTotals = Object.entries(groupedData).map(([industry, stocks]) => {
        const totalAmount = stocks.reduce((acc, stock) => {
            return acc + (stock.price * (stock.dividend_yield / 100) * stock.shares_owned);
        }, 0);
        return { industry, totalAmount };
    });

    // 総合計を計算
    const grandTotal = industryTotals.reduce((acc, { totalAmount }) => acc + totalAmount, 0);


    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6347', '#8A2BE2', '#3CB371'];

    return (
        <div className="container-fluid h-100 mt-3 d-flex">
            <div className="list-container" style={{ flex: 1 }}>
                <h4 className="mb-3">Stock Analysis List by Sector</h4>
                {Object.entries(groupedData).map(([industry, stocks]) => (
                    <div key={industry} className="industry-group m-3">
                        <h5>{industry}</h5>
                        <ul>
                            {stocks.map(stock => (
                                <li key={stock.stock_No}>
                                    {stock.symbol} - {stock.name} - {formatCurrency(stock.price * (stock.dividend_yield / 100) * stock.shares_owned)} JPN
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* 円グラフの表示 */}
            {industryTotals.length > 0 && (
                <div className="chart-container" style={{ flex: 1 }}>
                    <PieChart width={800} height={600}>
                        <Pie
                            data={industryTotals}
                            dataKey="totalAmount"
                            nameKey="industry"
                            cx="50%"
                            cy="50%"
                            outerRadius={150}
                            label={(entry) => {
                                const percentage = ((entry.totalAmount / grandTotal) * 100).toFixed(2);
                                return `${entry.industry} (${percentage}%)`;
                            }}
                        >
                        {industryTotals.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                        </Pie>
                        <LabelList dataKey="industry"/>
                        <Tooltip />
                    </PieChart>
                </div>
            )}
        </div>
    );
}

export default Analysis;
