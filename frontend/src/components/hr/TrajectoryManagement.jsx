import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function TrajectoryManagement() {
  const [trajectories, setTrajectories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    km_single_trip: '',
    type: 'volledig'
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trajRes, empRes] = await Promise.all([
        api.get('/api/hr/all-trajectories'),
        api.get('/api/hr/employees')
      ]);
      setTrajectories(trajRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      setError('Laden mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/api/hr/trajectories', formData);
      setSuccess('Traject toegevoegd');
      setFormData({ employee_id: '', km_single_trip: '', type: 'volledig' });
      setShowForm(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Fout bij toevoegen');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Traject verwijderen?')) return;

    try {
      await api.delete(`/api/hr/trajectories/${id}`);
      setSuccess('Traject verwijderd');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Kan niet verwijderen');
    }
  };

  if (loading) return <div className="p-6">Laden...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Trajecten Beheer</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? 'Annuleer' : '+ Nieuw Traject'}
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 border rounded">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Werknemer</label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Selecteer werknemer</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Kilometers (enkele reis)</label>
            <input
              type="number"
              step="0.01"
              value={formData.km_single_trip}
              onChange={(e) => setFormData({ ...formData, km_single_trip: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="volledig"
                  checked={formData.type === 'volledig'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mr-2"
                />
                Volledig per fiets
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="gedeeltelijk"
                  checked={formData.type === 'gedeeltelijk'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mr-2"
                />
                Gedeeltelijk (multimodaal)
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Toevoegen
          </button>
        </form>
      )}

      <div className="bg-white border rounded shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Werknemer</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Kilometers</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Acties</th>
            </tr>
          </thead>
          <tbody>
            {trajectories.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-6 text-center text-gray-500">
                  Geen trajecten gevonden
                </td>
              </tr>
            ) : (
              trajectories.map(traj => (
                <tr key={traj.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {traj.employee_name}<br/>
                    <span className="text-xs text-gray-500">{traj.email}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{traj.km_single_trip} km</td>
                  <td className="px-4 py-3 text-sm">{traj.type}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleDelete(traj.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Verwijder
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}