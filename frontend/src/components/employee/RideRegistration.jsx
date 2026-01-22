import React, { useState, useEffect, useContext } from 'react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function RideRegistration() {
    const { user } = useContext(AuthContext);
    const { control, handleSubmit, watch, formState: { errors }, reset } = useForm({
        defaultValues: {
            ride_date: new Date(),
            trajectory_id: '',
            direction: 'heen',
            portion: 'volledig'
        }
    });
    
    const [trajectories, setTrajectories] = useState([]);
    const [calculatedAmount, setCalculatedAmount] = useState({ km: 0, amount: 0 });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [loading, setLoading] = useState(false);

    const selectedTrajectory = watch('trajectory_id');
    const selectedDirection = watch('direction');
    const selectedPortion = watch('portion');
    const selectedDate = watch('ride_date');

    // Fetch trajectories on component mount
    useEffect(() => {
        const fetchTrajectories = async () => {
            try {
                const response = await api.get('/api/trajectories');
                setTrajectories(response.data);
            } catch (error) {
                setErrorMessage('Failed to load trajectories');
            }
        };
        fetchTrajectories();
    }, []);

    // Check if form should be disabled (deadline or blocked)
    useEffect(() => {
        const checkFormStatus = async () => {
            try {
                const response = await api.get('/api/check-status');
                if (response.data.blocked || response.data.pastDeadline) {
                    setIsFormDisabled(true);
                    setErrorMessage(response.data.reason || 'Form is currently disabled');
                }
            } catch (error) {
                console.error('Error checking form status', error);
            }
        };
        checkFormStatus();
    }, []);

    // Calculate amount in real-time
    useEffect(() => {
        if (selectedTrajectory) {
            const trajectory = trajectories.find(t => t.id === parseInt(selectedTrajectory));
            if (trajectory) {
                let km = parseFloat(trajectory.km_single_trip) || 0;
                
                // Calculate km based on direction
                if (selectedDirection === 'heen_terug') {
                    km *= 2;
                }
                
                // Adjust km based on portion
                if (selectedPortion === 'gedeeltelijk') {
                    km *= 0.5;
                }
                
                // Calculate amount based on user's country tariff
                const tariff = user.land === 'BE' ? 0.27 : 0.23;
                const amount = (km * tariff).toFixed(2);
                
                setCalculatedAmount({ km: km.toFixed(2), amount });
            }
        }
    }, [selectedTrajectory, selectedDirection, selectedPortion, trajectories, user.land]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');

            const rideData = {
                ...data,
                ride_date: data.ride_date.toISOString().split('T')[0]
            };

            const response = await api.post('/api/rides', rideData);
            
            setSuccessMessage(`Ride registered successfully! Amount: €${response.data.amount_euro}`);
            reset();
            setCalculatedAmount({ km: 0, amount: 0 });
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            if (error.response?.status === 403) {
                setErrorMessage('You have exceeded the maximum allowed rides. ' + error.response.data.message);
                setIsFormDisabled(true);
            } else {
                setErrorMessage(error.response?.data?.message || 'Error registering ride');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Register Bike Ride</h2>

            {successMessage && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} disabled={isFormDisabled} className={isFormDisabled ? 'opacity-50 pointer-events-none' : ''}>
                
                {/* Date Picker */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ride Date</label>
                    <Controller
                        name="ride_date"
                        control={control}
                        render={({ field }) => (
                            <DatePicker
                                selected={field.value}
                                onChange={(date) => field.onChange(date)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        )}
                    />
                </div>

                {/* Trajectory Dropdown */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trajectory</label>
                    <Controller
                        name="trajectory_id"
                        control={control}
                        rules={{ required: 'Please select a trajectory' }}
                        render={({ field }) => (
                            <select
                                {...field}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a trajectory</option>
                                {trajectories.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.km_single_trip} km ({t.type})
                                    </option>
                                ))}
                            </select>
                        )}
                    />
                    {errors.trajectory_id && <p className="text-red-500 text-sm mt-1">{errors.trajectory_id.message}</p>}
                </div>

                {/* Direction Radio Buttons */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                    <Controller
                        name="direction"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                {['heen', 'terug', 'heen_terug'].map(dir => (
                                    <label key={dir} className="flex items-center">
                                        <input
                                            type="radio"
                                            value={dir}
                                            checked={field.value === dir}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">{dir === 'heen_terug' ? 'Both directions' : dir}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    />
                </div>

                {/* Portion Radio Buttons */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Portion</label>
                    <Controller
                        name="portion"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                {['volledig', 'gedeeltelijk'].map(port => (
                                    <label key={port} className="flex items-center">
                                        <input
                                            type="radio"
                                            value={port}
                                            checked={field.value === port}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">{port === 'volledig' ? 'Full' : 'Partial'}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    />
                </div>

                {/* Real-time Calculation Display */}
                {selectedTrajectory && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Distance:</span> {calculatedAmount.km} km
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Amount:</span> €{calculatedAmount.amount}
                        </p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !selectedTrajectory}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? 'Registering...' : 'Register Ride'}
                </button>
            </form>
        </div>
    );
}