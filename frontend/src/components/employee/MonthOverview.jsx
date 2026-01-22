import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function MonthOverview() {
    const { user } = useContext(AuthContext);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [rides, setRides] = useState([]);
    const [summary, setSummary] = useState(null);
    const [isPastDeadline, setIsPastDeadline] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [chartData, setChartData] = useState([]);

    // Generate months for selector (current + previous 6)
    const getMonthOptions = () => {
        const months = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push(d);
        }
        return months;
    };

    // Check if past deadline
    useEffect(() => {
        const checkDeadline = async () => {
    try {
        const response = await api.get(`/api/config/${user.land}`);
        const config = response.data;
        const deadlineDay = config.deadline_day;
        const today = new Date();
        
        // Calculate deadline in NEXT month after selected month
        let nextMonth = selectedMonth.getMonth() + 1;
        let nextYear = selectedMonth.getFullYear();
        
        if (nextMonth > 11) {
            nextMonth = 0;
            nextYear++;
        }
        
        const deadline = new Date(nextYear, nextMonth, deadlineDay);
        
        // Check if today is past the deadline for the selected month
        setIsPastDeadline(today > deadline);
    } catch (error) {
        console.error('Error checking deadline', error);
    }
};
        checkDeadline();
    }, [selectedMonth, user.land]);

    // Fetch rides for selected month
    useEffect(() => {
        const fetchRides = async () => {
            try {
                setLoading(true);
                setError('');
                
                // Ensure selectedMonth is valid
                if (!selectedMonth || !(selectedMonth instanceof Date)) {
                    throw new Error('Invalid month selected');
                }
                
                const yearMonth = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
                const response = await api.get(`/api/rides/month/${yearMonth}`);
                
                setRides(response.data.rides);
                setSummary(response.data.summary);

                // Prepare chart data (km per day)
                const kmPerDay = {};
                response.data.rides.forEach(ride => {
                    const date = new Date(ride.ride_date).toLocaleDateString();
                    kmPerDay[date] = (kmPerDay[date] || 0) + parseFloat(ride.km_total);
                });
                
                const chartDataArray = Object.entries(kmPerDay).map(([date, km]) => ({
                    date,
                    km: parseFloat(km).toFixed(2)
                }));
                setChartData(chartDataArray);
            } catch (err) {
                setError('Failed to load rides data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRides();
    }, [selectedMonth]);

    const handleMonthChange = (e) => {
        const newDate = new Date(e.target.value);
        setSelectedMonth(newDate);
    };

    const monthOptions = getMonthOptions();
    const monthString = selectedMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Monthly Overview</h2>

            {/* Month Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
                <select
                    value={selectedMonth.toISOString().slice(0, 7)}
                    onChange={handleMonthChange}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {monthOptions.map(month => (
                        <option key={month.toISOString()} value={month.toISOString().slice(0, 7)}>
                            {month.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </option>
                    ))}
                </select>
            </div>

            {/* Past Deadline Indicator */}
            {isPastDeadline && (
                <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
                    <strong>⚠️ Past Deadline:</strong> This month is read-only. No new rides can be registered.
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">Loading rides...</p>
                </div>
            ) : (
                <>
                    {/* Summary Card */}
                    {summary && (
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-600">Total Rides</p>
                                <p className="text-2xl font-bold text-blue-600">{rides.length}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                                <p className="text-sm text-gray-600">Total km</p>
                                <p className="text-2xl font-bold text-green-600">{summary.total_km}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="text-2xl font-bold text-purple-600">€{summary.total_amount}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">Status</p>
                                <p className="text-2xl font-bold text-gray-600 capitalize">{summary.status}</p>
                            </div>
                        </div>
                    )}

                    {/* Chart */}
                    {chartData.length > 0 && (
                        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">km per Day</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="km" stroke="#3b82f6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Rides Table */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trajectory</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Direction</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Portion</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">km</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rides.length > 0 ? (
                                    rides.map((ride, index) => (
                                        <tr key={ride.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {new Date(ride.ride_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {ride.trajectory_id}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                                                {ride.direction.replace('_', ' ')}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                                                {ride.portion}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {ride.km_total}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                €{ride.amount_euro}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-3 text-center text-gray-500">
                                            No rides recorded for this month
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
