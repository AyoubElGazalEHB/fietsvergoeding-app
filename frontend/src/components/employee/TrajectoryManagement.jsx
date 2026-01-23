import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

export default function TrajectoryManagement() {
    const { user } = useContext(AuthContext);
    const [trajectories, setTrajectories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const fetchTrajectories = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/trajectories');
            setTrajectories(response.data);
        } catch (err) {
            setError('Failed to load trajectories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrajectories();
    }, []);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            // Validate declaration is signed
            if (!data.declaration_signed) {
                setError('U moet de verklaring op eer bevestigen');
                setLoading(false);
                return;
            }

            await api.post('/api/trajectories', {
                ...data,
                km_single_trip: parseFloat(data.km_single_trip),
                type: 'volledig', // Default type matching database enum ('volledig' or 'gedeeltelijk')
                declaration_signed: true
            });

            setSuccess('Traject succesvol toegevoegd met verklaring op eer');
            reset();
            fetchTrajectories();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Fout bij toevoegen traject');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this trajectory?')) return;

        try {
            await api.delete(`/api/trajectories/${id}`);
            fetchTrajectories();
            setSuccess('Trajectory deleted');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete trajectory');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">My Trajectories</h2>

            {/* Notification Area */}
            {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded border border-red-300">{error}</div>}
            {success && <div className="mb-4 p-4 bg-green-100 text-green-700 rounded border border-green-300">{success}</div>}

            <div className="grid md:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">Add New Trajectory</h3>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name (e.g., Home to Work)</label>
                            <input
                                {...register('name', { required: 'Name is required' })}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                placeholder="My Daily Commute"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Location</label>
                                <input
                                    {...register('start_location', { required: 'Required' })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                    placeholder="Home Address"
                                />
                                {errors.start_location && <p className="text-red-500 text-xs mt-1">{errors.start_location.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Location</label>
                                <input
                                    {...register('end_location', { required: 'Required' })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                    placeholder="Office Address"
                                />
                                {errors.end_location && <p className="text-red-500 text-xs mt-1">{errors.end_location.message}</p>}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Enkele reis afstand (km)</label>
                            <input
                                type="number"
                                step="0.1"
                                {...register('km_single_trip', {
                                    required: 'Afstand is verplicht',
                                    min: { value: 0.1, message: 'Moet groter zijn dan 0' }
                                })}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                placeholder="15.5"
                            />
                            <p className="text-xs text-gray-500 mt-1">Op basis van verklaring op eer</p>
                            {errors.km_single_trip && <p className="text-red-500 text-xs mt-1">{errors.km_single_trip.message}</p>}
                        </div>

                        {/* Declaration of Honor */}
                        <div className="mb-6 border border-amber-300 rounded-md p-4 bg-amber-50">
                            <h4 className="font-semibold mb-2 text-amber-900">Verklaring op eer <span className="text-red-500">*</span></h4>

                            <div className="bg-white p-3 mb-3 border border-gray-200 rounded text-sm">
                                <p className="mb-2 font-medium">Ik verklaar op eer dat:</p>
                                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
                                    <li>De ingevoerde afstand correct is gemeten of geschat</li>
                                    <li>Dit traject regelmatig door mij wordt afgelegd</li>
                                    <li>De start- en eindlocaties correct zijn</li>
                                    <li>Onjuiste informatie kan leiden tot intrekking van de vergoeding</li>
                                </ul>
                            </div>

                            <label className="flex items-start cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('declaration_signed', {
                                        required: 'U moet de verklaring op eer bevestigen'
                                    })}
                                    className="mt-1 mr-2"
                                />
                                <span className="text-sm font-medium">Ik bevestig deze verklaring op eer</span>
                            </label>
                            {errors.declaration_signed && (
                                <p className="text-red-500 text-xs mt-1">{errors.declaration_signed.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                        >
                            {loading ? 'Bezig...' : 'Traject Toevoegen'}
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">Existing Trajectories</h3>
                    {trajectories.length === 0 ? (
                        <p className="text-gray-500 italic">No trajectories found. Please add one.</p>
                    ) : (
                        <div className="space-y-4">
                            {trajectories.map((traj) => (
                                <div key={traj.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 hover:shadow-md transition">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg text-blue-800">{traj.name}</h4>
                                            <p className="text-sm text-gray-600">{traj.start_location} ➝ {traj.end_location}</p>
                                            <p className="text-sm font-medium mt-1">{traj.km_single_trip} km <span className="text-xs text-gray-400">(one-way)</span></p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(traj.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
