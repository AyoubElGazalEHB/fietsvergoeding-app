import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function EmployeeOverview() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [rides, setRides] = useState([]);
  const [editingTariff, setEditingTariff] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRides = async (employeeId) => {
    try {
      const res = await api.get(`/api/employees/${employeeId}/rides`);
      setRides(res.data);
      setSelectedEmployee(employeeId);
    } catch (error) {
      console.error(error);
    }
  };

  const updateTariff = async (employeeId, tariff) => {
    try {
      await api.patch(`/api/employees/${employeeId}/tariff`, { custom_tariff: tariff });
      fetchEmployees();
      setEditingTariff(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Employee Overview</h2>
      
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Land</th>
            <th className="p-2 border">Total KM</th>
            <th className="p-2 border">Total Amount</th>
            <th className="p-2 border">Custom Tariff</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td className="p-2 border">{emp.name}</td>
              <td className="p-2 border">{emp.land}</td>
              <td className="p-2 border">{emp.total_km}</td>
              <td className="p-2 border">€{emp.total_amount}</td>
              <td className="p-2 border">
                {editingTariff === emp.id ? (
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={emp.custom_tariff}
                    onBlur={(e) => updateTariff(emp.id, e.target.value)}
                    className="border px-2 py-1"
                  />
                ) : (
                  <span onClick={() => setEditingTariff(emp.id)} className="cursor-pointer">
                    {emp.custom_tariff ? `€${emp.custom_tariff}` : 'Set'}
                  </span>
                )}
              </td>
              <td className="p-2 border">
                <button onClick={() => fetchRides(emp.id)} className="bg-blue-500 text-white px-3 py-1 rounded">
                  View Rides
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedEmployee && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Rides</h3>
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Direction</th>
                <th className="p-2 border">KM</th>
                <th className="p-2 border">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rides.map(ride => (
                <tr key={ride.id}>
                  <td className="p-2 border">{ride.ride_date}</td>
                  <td className="p-2 border">{ride.direction}</td>
                  <td className="p-2 border">{ride.km_total}</td>
                  <td className="p-2 border">€{ride.amount_euro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}