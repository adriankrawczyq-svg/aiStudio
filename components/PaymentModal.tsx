import React from 'react';
import { X, Coffee, Heart, ExternalLink, Lock } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- KONFIGURACJA ---
// Załóż konto na buycoffee.to, ko-fi.com lub patronite.pl
// i wklej tutaj swój link.
const DONATION_LINK = "https://buymeacoffee.com/adriankrawczyq"; 
// --------------------

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border-4 border-pink-50">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-pink-100 to-purple-100 rounded-full flex items-center justify-center text-pink-500 mb-6 mx-auto shadow-inner">
            <Coffee size={40} />
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-2">Wesprzyj Twórcę</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Ta gra korzysta z płatnego API Google Gemini do generowania obrazów. Jeśli podoba Ci się projekt, możesz postawić mi wirtualną kawę, co pomoże utrzymać grę online!
          </p>

          <a 
            href={DONATION_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-3 w-full bg-gray-900 hover:bg-black text-white text-lg font-bold py-4 rounded-xl transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl mb-4"
          >
            <span>Postaw Kawę</span>
            <Heart size={20} className="text-pink-500 fill-pink-500 group-hover:scale-110 transition-transform" />
            <ExternalLink size={16} className="opacity-50" />
          </a>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 flex flex-col gap-1">
            <div className="flex items-center justify-center gap-1 font-semibold">
               <Lock size={10} /> Bezpieczna transakcja
            </div>
            <p>Zostaniesz przekierowany do zewnętrznego serwisu płatności.</p>
          </div>
        </div>
      </div>
    </div>
  );
};