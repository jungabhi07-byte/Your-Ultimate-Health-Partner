import React, { useState, useEffect } from 'react';
import { X, Lock, CreditCard, CheckCircle, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  price: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, price }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call processing
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-fadeIn">
        {success ? (
           <div className="p-12 flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 animate-bounce" />
             </div>
             <h3 className="text-2xl font-bold text-gray-900">Payment Successful!</h3>
             <p className="text-gray-500 mt-2">Redirecting you to your premium report...</p>
           </div>
        ) : (
           <>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-teal-600" /> Secure Checkout
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="bg-teal-50 p-4 rounded-lg flex justify-between items-center mb-6">
                    <div>
                        <p className="text-sm font-medium text-teal-900">Premium Blood Analysis</p>
                        <p className="text-xs text-teal-600">One-time payment</p>
                    </div>
                    <span className="text-xl font-bold text-teal-700">{price}</span>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input 
                            type="text" 
                            required
                            placeholder="0000 0000 0000 0000"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input 
                            type="text" 
                            required
                            placeholder="MM/YY"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                        <input 
                            type="text" 
                            required
                            placeholder="123"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow outline-none"
                        />
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                     <input 
                        type="text" 
                        required
                        placeholder="John Doe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow outline-none"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Pay Now"}
                </button>
                
                <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" /> Payments are secure and encrypted
                </p>
            </form>
           </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;