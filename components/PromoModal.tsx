import React from 'react';
import { Sparkles, ExternalLink, Code, Coffee } from 'lucide-react';

interface PromoModalProps {
  isOpen: boolean;
  onSupportClick?: () => void;
}

export const PromoModal: React.FC<PromoModalProps> = ({ isOpen, onSupportClick }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative text-center border-4 border-pink-100">
        
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
            <Sparkles size={40} className="text-yellow-300 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Demo Zakończone!</h2>
          <p className="text-pink-100 font-medium">Mamy nadzieję, że podobało Ci się szukanie kotów.</p>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-gray-600 text-lg leading-relaxed">
            To demo wykorzystuje potężny model <strong>Gemini 2.5 Flash</strong> do generowania i analizy obrazów w czasie rzeczywistym.
          </p>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-left">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Code size={20} className="text-purple-500" />
              Chcesz stworzyć coś podobnego?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Google AI Studio oferuje darmowy dostęp do modeli Gemini, dzięki czemu możesz budować własne aplikacje AI w kilka minut.
            </p>
            <a 
              href="https://aistudio.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <span>Otwórz Google AI Studio</span>
              <ExternalLink size={18} />
            </a>
          </div>
          
          {onSupportClick && (
            <button 
              onClick={onSupportClick}
              className="w-full flex items-center justify-center gap-2 text-pink-600 font-bold py-3 rounded-xl border-2 border-pink-100 hover:bg-pink-50 transition-colors"
            >
               <Coffee size={18} />
               <span>Wesprzyj Twórcę (Postaw Kawę)</span>
            </button>
          )}

          <div className="text-xs text-gray-400">
            Limit 3 gier został wyczerpany dla tego urządzenia.
          </div>
        </div>
      </div>
    </div>
  );
};