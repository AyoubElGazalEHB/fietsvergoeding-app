import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function MonthlyDashboard() {
    const { user } = useContext(AuthContext);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [ridesData, setRidesData] = useState([]);
    const [employeeSummary, setEmployeeSummary] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMonthlyData();
    }, [selectedMonth]);

    const fetchMonthlyData = async () => {
        try {
            setLoading(true);
            setError('');
            const year = selectedMonth.getFullYear();
            const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
            const response = await api.get(`/api/hr/dashboard/${year}/${month}`);

            setRidesData(response.data.rides || []);
            // Convert array to object for backward compatibility
            const summaryObj = {};
            if (Array.isArray(response.data.summary)) {
                response.data.summary.forEach(emp => {
                    summaryObj[emp.id] = emp;
                });
            } else {
                Object.assign(summaryObj, response.data.summary || {});
            }
            setEmployeeSummary(summaryObj);
        } catch (err) {
            setError(err.response?.data?.message || 'Fout bij laden van gegevens');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const year = selectedMonth.getFullYear();
            const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
            
            const response = await api.get(`/api/hr/export-csv/${year}/${month}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rides_${year}_${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            setError('Fout bij downloaden CSV');
        }
    };

    const handlePreviousMonth = () => {
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
    };

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Maandelijks Dashboard</h2>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={handlePreviousMonth}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    ← Vorige maand
                </button>
                <h3 className="text-xl font-semibold">
                    {selectedMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                    onClick={handleNextMonth}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Volgende maand →
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">Laden...</p>
                </div>
            ) : (
                <>
                    {/* Summary Statistics */}
                    {Object.keys(employeeSummary).length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-600">Totaal ritten</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {Object.values(employeeSummary).reduce((sum, emp) => sum + (emp.ride_count || 0), 0)}
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-sm text-gray-600">Totaal km</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {Object.values(employeeSummary).reduce((sum, emp) => sum + parseFloat(emp.total_km || 0), 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <p className="text-sm text-gray-600">Totaal bedrag</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    €{Object.values(employeeSummary).reduce((sum, emp) => sum + parseFloat(emp.total_amount || 0), 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <p className="text-sm text-gray-600">Werknemers</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {Object.keys(employeeSummary).length}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Export Button */}
                    <div className="mb-6 flex gap-4">
                        <button
                            onClick={handleExportCSV}
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                        >
                            📥 Exporteer als CSV
                        </button>
                    </div>

                    {/* Rides Table */}
                    {ridesData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Werknemer</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Datum</th>
                                        <th className="border border-gray-300 px-4 py-2 text-right">Afstand (km)</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Richting</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                                        <th className="border border-gray-300 px-4 py-2 text-right">Bedrag (€)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ridesData.map((ride) => (
                                        <tr key={ride.id} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-2">{ride.employee_name}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {new Date(ride.ride_date).toLocaleDateString('nl-NL')}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-right">{parseFloat(ride.km_total).toFixed(2)}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {ride.direction === 'heen' && 'Heenreis'}
                                                {ride.direction === 'terug' && 'Terugreis'}
                                                {ride.direction === 'heen_terug' && 'Heen & Terug'}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {ride.portion === 'volledig' && 'Volledig per fiets'}
                                                {ride.portion === 'gedeeltelijk' && 'Gedeeltelijk'}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                                                €{parseFloat(ride.amount_euro).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-600">
                            Geen ritten voor deze maand
                        </div>
                    )}

                    {/* Employee Summary Table */}
                    {Object.keys(employeeSummary).length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">Samenvatting per werknemer</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Werknemer</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right">Aantal ritten</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right">Totaal km</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right">Totaal bedrag</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(employeeSummary).map(([employeeId, data]) => (
                                            <tr key={employeeId} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-4 py-2">{data.employee_name}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right">{data.ride_count}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right">{parseFloat(data.total_km).toFixed(2)}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                                                    €{parseFloat(data.total_amount).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
