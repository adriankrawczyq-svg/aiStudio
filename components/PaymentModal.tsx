import React, { useState } from 'react';
import { X, CreditCard, CheckCircle, Lock } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset state after closing
        setTimeout(() => {
          setIsSuccess(false);
        }, 500);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        {/* Close Button */}
        {!isSuccess && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        )}

        {isSuccess ? (
          <div className="p-12 flex flex-col items-center text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Dziękujemy!</h3>
            <p className="text-gray-500">Twoje wsparcie pomaga karmić wirtualne koty.</p>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-pink-100 text-pink-500 rounded-xl">
                <CreditCard size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Wesprzyj Projekt</h3>
                <p className="text-sm text-gray-500">Bezpieczna płatność kartą</p>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Numer Karty
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000" 
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-mono text-gray-700 focus:border-pink-500 focus:ring-0 outline-none transition-colors"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    <div className="w-8 h-5 bg-gray-200 rounded opacity-50"></div>
                    <div className="w-8 h-5 bg-gray-200 rounded opacity-50"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Data Ważności
                  </label>
                  <input 
                    type="text" 
                    placeholder="MM/RR" 
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-mono text-gray-700 focus:border-pink-500 outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    CVC
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="123" 
                      maxLength={3}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-mono text-gray-700 focus:border-pink-500 outline-none transition-colors"
                      required
                    />
                    <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Imię i Nazwisko
                </label>
                <input 
                  type="text" 
                  placeholder="Jan Kowalski" 
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:border-pink-500 outline-none transition-colors"
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl
                    ${isProcessing ? 'opacity-80 cursor-wait' : 'hover:-translate-y-1'}`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Przetwarzanie...
                    </>
                  ) : (
                    <>
                      Zapłać 10 PLN
                    </>
                  )}
                </button>
              </div>
              
              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1 mt-4">
                <Lock size={12} /> Płatność szyfrowana SSL 256-bit
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};