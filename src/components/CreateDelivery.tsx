import React, { useState } from 'react';
import { XIcon, CheckCircleIcon } from 'lucide-react';
import { Package } from '../types';
import { post } from '../utils/api';

interface CreateDeliveryProps {
  onClose: () => void;
  onCreate: (pkg: Package) => void;
  hubNames: string[];
}

interface CreateDeliveryResponse {
  id: number;
  trackingId: string;
  consignment: null;
  sender: string;
  senderEmail: string;
  receiver: string;
  receiverEmail: string;
  source: string;
  destination: string;
  currentHub: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export function CreateDelivery({
  onClose,
  onCreate,
  hubNames
}: CreateDeliveryProps) {
  const [formData, setFormData] = useState({
    sender: '',
    senderEmail: '',
    recipient: '',
    recipientEmail: '',
    origin: '',
    destination: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdPackage, setCreatedPackage] = useState<Package | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const requestBody = {
        sender: formData.sender,
        senderEmail: formData.senderEmail,
        receiver: formData.recipient,
        receiverEmail: formData.recipientEmail,
        source: formData.origin,
        destination: formData.destination
      };
      
      const response = await post<CreateDeliveryResponse>('/create', requestBody);
      
      console.log('API Response:', response);
      console.log('Tracking ID:', response.trackingId);
      
      // Show tracking ID
      setTrackingId(response.trackingId);
      
      // Create package for local state (optional - for backward compatibility)
      const newPackage: Package = {
        id: String(response.id),
        trackingId: response.trackingId,
        sender: response.sender,
        recipient: response.receiver,
        origin: response.source,
        destination: response.destination,
        status: 'Scheduled',
        currentHub: response.currentHub,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt)
      };
      console.log('Created package:', newPackage);
      setCreatedPackage(newPackage);
      // Don't call onCreate yet - wait for user to close the success modal
    } catch (err) {
      const message = (err as { message?: string }).message || 'Failed to create delivery';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    if (createdPackage) {
      onCreate(createdPackage);
    }
    onClose();
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {trackingId ? 'Delivery Created!' : 'Create Delivery Request'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        {trackingId ? (
          <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Delivery Created Successfully!
            </h3>
            <p className="mb-3 text-sm text-gray-600">
              Your delivery has been created with the following tracking ID:
            </p>
            <div className="p-4 mb-4 font-mono text-2xl font-bold text-blue-600 rounded-lg bg-blue-50">
              {trackingId}
            </div>
            <a
              href={`/track/${trackingId}`}
              className="inline-flex items-center justify-center w-full px-4 py-2 mb-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              onClick={handleClose}
            >
              Track Your Delivery
            </a>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 rounded-md bg-red-50">
                {error}
              </div>
            )}
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Sender Name
              </label>
              <input type="text" required value={formData.sender} onChange={e => setFormData({
              ...formData,
              sender: e.target.value
            })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Sender Email
              </label>
              <input 
                type="email" 
                required 
                value={formData.senderEmail} 
                onChange={e => setFormData({
                  ...formData,
                  senderEmail: e.target.value
                })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Recipient Name
              </label>
              <input type="text" required value={formData.recipient} onChange={e => setFormData({
              ...formData,
              recipient: e.target.value
            })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Recipient Email
              </label>
              <input 
                type="email" 
                required 
                value={formData.recipientEmail} 
                onChange={e => setFormData({
                  ...formData,
                  recipientEmail: e.target.value
                })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Origin Hub
              </label>
              <select value={formData.origin} onChange={e => setFormData({
              ...formData,
              origin: e.target.value
            })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                <option value="">Select Origin Hub</option>
                {hubNames.map(name => <option key={name} value={name}>
                    {name}
                  </option>)}
              </select>
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Destination Hub
              </label>
              <select value={formData.destination} onChange={e => setFormData({
              ...formData,
              destination: e.target.value
            })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                <option value="">Select Destination Hub</option>
                {hubNames.map(name => <option key={name} value={name}>
                    {name}
                  </option>)}
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Delivery'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>;
}