import React from 'react';
import { MapPin, Clock, DollarSign, Calendar } from 'lucide-react';

export const LocationGroupCard = ({ locationInfo, onViewJobs }) => {
  const {
    address,
    job_count,
    customer_names,
    status_counts,
    total_price,
    total_hours,
    next_scheduled,
    service_names,
  } = locationInfo;

  const statusConfig = {
    pending: { color: 'text-orange-600', bg: 'bg-orange-50' },
    in_progress: { color: 'text-blue-600', bg: 'bg-blue-50' },
    completed: { color: 'text-green-600', bg: 'bg-green-50' },
    cancelled: { color: 'text-red-600', bg: 'bg-red-50' },
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
    return `${month} ${day}, ${time}`;
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <div className="p-6 flex-grow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-2">
              <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={20} />
              <h3 className="font-semibold text-gray-900 leading-tight">
                {address}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 ml-7">
              <span>{job_count} job{job_count !== 1 ? 's' : ''}</span>
              <span className="text-gray-400">•</span>
              <span>{customer_names?.join(', ')}</span>
            </div>
          </div>
          <button 
            onClick={onViewJobs}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap ml-4"
          >
            View Jobs
          </button>
        </div>

        {/* Status Counts */}
        <div className="flex gap-2 mb-4 pb-4 border-b border-gray-200">
          {Object.entries(status_counts).map(([status, count]) => {
            const config = statusConfig[status] || { color: 'text-gray-600', bg: 'bg-gray-50' };
            return (
              <div key={status} className="text-center">
                <div className={`text-2xl font-semibold ${config.color}`}>
                  {count}
                </div>
                <div className="text-xs text-gray-500 capitalize mt-1">
                  {formatStatus(status)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Price and Hours */}
        <div className="flex justify-between mb-4 items-center">
          <div className="flex items-center gap-1">
            <DollarSign className="text-gray-400" size={18} />
            <span className="font-semibold text-gray-900">
              {total_price.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="text-gray-400" size={18} />
            <span className="font-medium text-gray-700">
              {total_hours} hours total
            </span>
          </div>
        {/* Next Scheduled */}
        {next_scheduled && (
          <div className="bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1">
              <Calendar className="text-gray-400" size={18} />
              <div>
                <div className="text-xs text-gray-500">Next:</div>
                <div className="font-medium text-gray-900">
                  {formatDate(next_scheduled)}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>


        {/* Services */}
        <div className="text-sm text-gray-600">
          {service_names?.join(', ')}
        </div>
      </div>
    </div>
  );
};

// Demo
export default function Demo() {
  const sampleData = [
    {
      address: "2718 Talbott St, HOUSTON, TX, 77005",
      job_count: 1,
      customer_names: ["Amy"],
      status_counts: {
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      },
      total_price: 678.41,
      total_hours: 3,
      next_scheduled: "2023-08-23T13:30:00",
      service_names: ["Gutter Cleaning", "Exterior Window Cleaning"],
    },
    {
      address: "27626 Panola Place Ln, Fulshear, TX 77441",
      job_count: 1,
      customer_names: ["Olga Regal"],
      status_counts: {
        pending: 0,
        in_progress: 0,
        completed: 1,
        cancelled: 0,
      },
      total_price: 577.00,
      total_hours: 2,
      next_scheduled: null,
      service_names: ["Adjustments"],
    },
    {
      address: "10606 Twelve Oaks Drive Houston TX 77024",
      job_count: 6,
      customer_names: ["Lisa Boundas"],
      status_counts: {
        pending: 5,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      },
      total_price: 1230.00,
      total_hours: 12,
      next_scheduled: "2025-09-19T18:30:00",
      service_names: ["Exterior Window Cleaning"],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Jobs by Location
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleData.map((location, index) => (
          <LocationGroupCard
            key={index}
            locationInfo={location}
            onViewJobs={() => console.log('View jobs for:', location.address)}
          />
        ))}
      </div>
    </div>
  );
}