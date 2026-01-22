import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import api from '../../services/api';

export default function ConfigManagement() {
    const [activeTab, setActiveTab] = useState('BE');
    const [configs, setConfigs] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [lastUpdated, setLastUpdated] = useState({});
    const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            tariff_per_km: 0.27,
            max_per_month: 0,
            max_per_year: 0,
            deadline_day: 15,
            allow_above_tax_free: false
        }
    });

    // Fetch configurations on mount
    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                setLoading(true);
                const bePng = await api.get('/api/config/BE');
                const nlConfig = await api.get('/api/config/NL');
                
                setConfigs({
                    BE: bePng.data,
                    NL: nlConfig.data
                });
                
                setLastUpdated({
                    BE: bePng.data.updated_at || new Date().toISOString(),
                    NL: nlConfig.data.updated_at || new Date().toISOString()
                });
                
                // Set form values for active tab
                reset(bePng.data);
            } catch (error) {
                setErrorMessage('Failed to load configurations');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfigs();
    }, [reset]);

    // Update form when tab changes
    useEffect(() => {
        if (configs[activeTab]) {
            reset(configs[activeTab]);
        }
    }, [activeTab, configs, reset]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');

            const response = await api.patch(`/api/config/${activeTab}`, {
                tariff_per_km: parseFloat(data.tariff_per_km),
                max_per_month: parseInt(data.max_per_month) || 0,
                max_per_year: parseInt(data.max_per_year) || 0,
                deadline_day: parseInt(data.deadline_day),
                allow_above_tax_free: data.allow_above_tax_free
            });

            setConfigs({
                ...configs,
                [activeTab]: response.data
            });

            setLastUpdated({
                ...lastUpdated,
                [activeTab]: new Date().toISOString()
            });

            setSuccessMessage(`Configuration for ${activeTab} updated successfully`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Failed to update configuration');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Configuration Management</h2>

            {/* Notifications */}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
                    ✓ {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    ✗ {errorMessage}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-6 flex border-b border-gray-200">
                {['BE', 'NL'].map(country => (
                    <button
                        key={country}
                        onClick={() => setActiveTab(country)}
                        className={`px-6 py-3 font-medium transition ${
                            activeTab === country
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        {country === 'BE' ? '🇧🇪 Belgium' : '🇳🇱 Netherlands'}
                    </button>
                ))}
            </div>

            {/* Last Updated Info */}
            {lastUpdated[activeTab] && (
                <div className="mb-4 p-2 bg-gray-50 rounded text-sm text-gray-600 border border-gray-200">
                    Last updated: {formatDate(lastUpdated[activeTab])}
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">Loading configuration...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    
                    {/* Tariff per km */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tariff per km (€)
                        </label>
                        <Controller
                            name="tariff_per_km"
                            control={control}
                            rules={{
                                required: 'Tariff is required',
                                validate: value => parseFloat(value) > 0 || 'Tariff must be greater than 0'
                            }}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            )}
                        />
                        {errors.tariff_per_km && (
                            <p className="text-red-500 text-sm mt-1">{errors.tariff_per_km.message}</p>
                        )}
                    </div>

                    {/* Max per Month */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max per Month (€) {activeTab === 'NL' && '(not applicable)'}
                        </label>
                        <Controller
                            name="max_per_month"
                            control={control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    type="number"
                                    disabled={activeTab === 'NL'}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            )}
                        />
                    </div>

                    {/* Max per Year */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max per Year (€) {activeTab === 'NL' && '(not applicable)'}
                        </label>
                        <Controller
                            name="max_per_year"
                            control={control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    type="number"
                                    disabled={activeTab === 'NL'}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            )}
                        />
                    </div>

                    {/* Deadline Day */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deadline Day (1-31)
                        </label>
                        <Controller
                            name="deadline_day"
                            control={control}
                            rules={{
                                required: 'Deadline day is required',
                                validate: value => {
                                    const val = parseInt(value);
                                    return (val >= 1 && val <= 31) || 'Deadline day must be between 1 and 31';
                                }
                            }}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    type="number"
                                    min="1"
                                    max="31"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            )}
                        />
                        {errors.deadline_day && (
                            <p className="text-red-500 text-sm mt-1">{errors.deadline_day.message}</p>
                        )}
                    </div>

                    {/* Allow Above Tax Free */}
                    <div className="mb-6">
                        <label className="flex items-center">
                            <Controller
                                name="allow_above_tax_free"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="checkbox"
                                        checked={field.value}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                )}
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">
                                Allow rides above tax-free limit
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                            {activeTab === 'BE' 
                                ? 'Check this to allow registering rides beyond the tax-free maximum' 
                                : 'Not applicable for Netherlands'}
                        </p>
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                    >
                        {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                </form>
            )}
        </div>
    );
}
