import React, { useState, useEffect, useContext } from 'react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function RideRegistration() {
    const { user } = useContext(AuthContext);
    const { control, handleSubmit, watch, formState: { errors }, reset } = useForm({
        defaultValues: {
            ride_date: new Date(),
            trajectory_id: '',
            direction: 'heen',
            portion: 'volledig',
            declaration_confirmed: false
        }
    });

    const [trajectories, setTrajectories] = useState([]);
    const [calculatedAmount, setCalculatedAmount] = useState({ km: 0, amount: 0 });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [loading, setLoading] = useState(false);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    const [tariff, setTariff] = useState(0);
=======
    const [showDeclaration, setShowDeclaration] = useState(false);
>>>>>>> Stashed changes
=======
    const [showDeclaration, setShowDeclaration] = useState(false);
>>>>>>> Stashed changes
=======
    const [showDeclaration, setShowDeclaration] = useState(false);
>>>>>>> Stashed changes

    const selectedTrajectory = watch('trajectory_id');
    const selectedDirection = watch('direction');
    const selectedPortion = watch('portion');
    const declarationConfirmed = watch('declaration_confirmed');

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // Fetch trajectories and config on component mount
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    useEffect(() => {
        const loadData = async () => {
            try {
                const [trajResponse, configResponse] = await Promise.all([
                    api.get('/api/trajectories'),
                    api.get(`/api/config/${user.land}`)
                ]);
                setTrajectories(trajResponse.data);
                setTariff(parseFloat(configResponse.data.tariff_per_km));
            } catch (error) {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                setErrorMessage('Failed to load data');
=======
                setErrorMessage('Trajecten laden mislukt');
>>>>>>> Stashed changes
=======
                setErrorMessage('Trajecten laden mislukt');
>>>>>>> Stashed changes
=======
                setErrorMessage('Trajecten laden mislukt');
>>>>>>> Stashed changes
            }
        };
        loadData();
    }, [user.land]);

    useEffect(() => {
        const checkFormStatus = async () => {
            try {
                const response = await api.get('/api/check-status');
                if (response.data.blocked || response.data.pastDeadline) {
                    setIsFormDisabled(true);
                    setErrorMessage(response.data.reason || 'Formulier gedeactiveerd');
                }
            } catch (error) {
                console.error('Status check error', error);
            }
        };
        checkFormStatus();
    }, []);

    useEffect(() => {
        if (selectedTrajectory && tariff > 0) {
            const trajectory = trajectories.find(t => t.id === parseInt(selectedTrajectory));
            if (trajectory) {
                let km = parseFloat(trajectory.km_single_trip) || 0;
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream

                // Calculate km based on direction
                if (selectedDirection === 'heen_terug') {
                    km *= 2;
                }

                // Adjust km based on portion
=======
                
                if (selectedDirection === 'heen_terug') {
                    km *= 2;
                }
                
>>>>>>> Stashed changes
                if (selectedPortion === 'gedeeltelijk') {
                    km *= 0.5;
                }

=======
                
                if (selectedDirection === 'heen_terug') {
                    km *= 2;
                }
=======
                
                if (selectedDirection === 'heen_terug') {
                    km *= 2;
                }
>>>>>>> Stashed changes
                
                if (selectedPortion === 'gedeeltelijk') {
                    km *= 0.5;
                }
                
                const tariff = user.land === 'BE' ? 0.27 : 0.23;
>>>>>>> Stashed changes
                const amount = (km * tariff).toFixed(2);

                setCalculatedAmount({ km: km.toFixed(2), amount });
            }
        }
    }, [selectedTrajectory, selectedDirection, selectedPortion, trajectories, tariff]);

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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream

            setSuccessMessage(`Ride registered successfully! Amount: €${response.data.amount_euro}`);
            reset();
            setCalculatedAmount({ km: 0, amount: 0 });

            // Clear success message after 3 seconds
=======
            
            setSuccessMessage(`Rit geregistreerd! Bedrag: €${response.data.amount_euro}`);
            reset();
            setCalculatedAmount({ km: 0, amount: 0 });
            setShowDeclaration(false);
            
>>>>>>> Stashed changes
=======
            
            setSuccessMessage(`Rit geregistreerd! Bedrag: €${response.data.amount_euro}`);
            reset();
            setCalculatedAmount({ km: 0, amount: 0 });
            setShowDeclaration(false);
            
>>>>>>> Stashed changes
=======
            
            setSuccessMessage(`Rit geregistreerd! Bedrag: €${response.data.amount_euro}`);
            reset();
            setCalculatedAmount({ km: 0, amount: 0 });
            setShowDeclaration(false);
            
>>>>>>> Stashed changes
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            if (error.response?.status === 403) {
                setErrorMessage(error.response.data.message);
                setIsFormDisabled(true);
            } else {
                setErrorMessage(error.response?.data?.message || 'Fout bij registratie');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Fietsrit Registreren</h2>

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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            <form onSubmit={handleSubmit(onSubmit)} disabled={isFormDisabled} className={isFormDisabled ? 'opacity-50 pointer-events-none' : ''}>

                {/* Date Picker */}
=======
            <form onSubmit={handleSubmit(onSubmit)} className={isFormDisabled ? 'opacity-50 pointer-events-none' : ''}>
                
>>>>>>> Stashed changes
=======
            <form onSubmit={handleSubmit(onSubmit)} className={isFormDisabled ? 'opacity-50 pointer-events-none' : ''}>
                
>>>>>>> Stashed changes
=======
            <form onSubmit={handleSubmit(onSubmit)} className={isFormDisabled ? 'opacity-50 pointer-events-none' : ''}>
                
>>>>>>> Stashed changes
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
                    <Controller
                        name="ride_date"
                        control={control}
                        render={({ field }) => (
                            <DatePicker
                                selected={field.value}
                                onChange={(date) => field.onChange(date)}
                                maxDate={new Date()}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        )}
                    />
                </div>

                <div className="mb-4">
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trajectory</label>
                    {trajectories.length === 0 ? (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                            You have no trajectories defined. <a href="/trajectories" className="underline font-bold">Click here to add one</a>.
                        </div>
                    ) : (
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
                                            {t.name} ({t.km_single_trip} km)
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                    )}
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                    <label className="block text-sm font-medium text-gray-700 mb-2">Traject</label>
                    <Controller
                        name="trajectory_id"
                        control={control}
                        rules={{ required: 'Selecteer een traject' }}
                        render={({ field }) => (
                            <select
                                {...field}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Selecteer traject</option>
                                {trajectories.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.km_single_trip} km ({t.type})
                                    </option>
                                ))}
                            </select>
                        )}
                    />
>>>>>>> Stashed changes
                    {errors.trajectory_id && <p className="text-red-500 text-sm mt-1">{errors.trajectory_id.message}</p>}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Richting</label>
                    <Controller
                        name="direction"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input type="radio" value="heen" checked={field.value === 'heen'} onChange={(e) => field.onChange(e.target.value)} className="mr-2" />
                                    <span className="text-sm">Heenreis</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" value="terug" checked={field.value === 'terug'} onChange={(e) => field.onChange(e.target.value)} className="mr-2" />
                                    <span className="text-sm">Terugreis</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" value="heen_terug" checked={field.value === 'heen_terug'} onChange={(e) => field.onChange(e.target.value)} className="mr-2" />
                                    <span className="text-sm">Heen & Terug</span>
                                </label>
                            </div>
                        )}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <Controller
                        name="portion"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input type="radio" value="volledig" checked={field.value === 'volledig'} onChange={(e) => field.onChange(e.target.value)} className="mr-2" />
                                    <span className="text-sm">Volledig per fiets</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" value="gedeeltelijk" checked={field.value === 'gedeeltelijk'} onChange={(e) => field.onChange(e.target.value)} className="mr-2" />
                                    <span className="text-sm">Gedeeltelijk (fiets + trein + fiets)</span>
                                </label>
                            </div>
                        )}
                    />
                </div>

                {selectedTrajectory && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Afstand:</span> {calculatedAmount.km} km
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Bedrag:</span> €{calculatedAmount.amount}
                        </p>
                    </div>
                )}

                <div className="mb-4 border border-gray-300 rounded-md p-4 bg-gray-50">
                    <h3 className="font-semibold mb-2">Verklaring op eer *</h3>
                    
                    {!showDeclaration && (
                        <button
                            type="button"
                            onClick={() => setShowDeclaration(true)}
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                            Klik hier om te lezen
                        </button>
                    )}

                    {showDeclaration && (
                        <div>
                            <div className="bg-white p-3 mb-3 border border-gray-200 rounded text-sm">
                                <p className="mb-2">Ik verklaar op eer dat:</p>
                                <ul className="list-disc pl-5 space-y-1 text-xs">
                                    <li>De ingevoerde kilometers correct zijn</li>
                                    <li>Het type vervoer correct is aangeduid</li>
                                    <li>Bij multimodaal enkel fietskilometers geregistreerd zijn</li>
                                    <li>Onjuiste info kan leiden tot intrekking vergoeding</li>
                                </ul>
                            </div>

                            <Controller
                                name="declaration_confirmed"
                                control={control}
                                rules={{ required: 'Verklaring moet bevestigd worden' }}
                                render={({ field }) => (
                                    <label className="flex items-start">
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            className="mt-1 mr-2"
                                        />
                                        <span className="text-xs">Ik bevestig deze verklaring</span>
                                    </label>
                                )}
                            />
                            {errors.declaration_confirmed && (
                                <p className="text-red-500 text-xs mt-1">{errors.declaration_confirmed.message}</p>
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !selectedTrajectory || !declarationConfirmed}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? 'Bezig...' : 'Registreer Rit'}
                </button>
            </form>
        </div>
    );
}