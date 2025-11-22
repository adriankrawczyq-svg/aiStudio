
import React from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Calendar, ArrowLeft } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, onBack }) => {
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trophy className="text-yellow-500" /> Tablica Wyników
        </h2>
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <Trophy size={48} className="mb-2 opacity-50" />
          <p>Brak wyników. Zagraj i bądź pierwszy!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Gracz</th>
                <th className="px-6 py-4">Poziom</th>
                <th className="px-6 py-4 text-right">Wynik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedEntries.map((entry, index) => {
                let rankIcon = null;
                if (index === 0) rankIcon = <span className="text-xl">🥇</span>;
                else if (index === 1) rankIcon = <span className="text-xl">🥈</span>;
                else if (index === 2) rankIcon = <span className="text-xl">🥉</span>;
                
                return (
                  <tr key={entry.id} className="hover:bg-pink-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-400 w-16">
                      {rankIcon || `${index + 1}.`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{entry.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} /> {new Date(entry.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded-md border border-gray-200 text-xs font-semibold">
                        {entry.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-pink-600 text-lg">
                      {entry.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
