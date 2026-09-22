import React from 'react';
import { History, X, Download, Trash2, PlayCircle, HardDrive } from 'lucide-react';
import { FlightSession } from '../types';
import { exportToCsv } from '../utils/storage';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSessions: FlightSession[];
  onSelectSession: (session: FlightSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  savedSessions,
  onSelectSession,
  onDeleteSession,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-5 text-white shadow-2xl font-sans flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Historial de Sesiones de Vuelo Registradas</h2>
              <p className="text-xs text-slate-400 font-mono">Telemetría Almacenada para Análisis Posterior</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5 font-mono text-xs">
          {savedSessions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <HardDrive className="w-10 h-10 mx-auto mb-2 text-slate-700" />
              <p className="font-bold">No hay vuelos guardados aún</p>
              <p className="text-[11px] text-slate-500">Presiona "Grabar" en la barra inferior durante un vuelo para guardar la telemetría.</p>
            </div>
          ) : (
            savedSessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <h4 className="text-white font-bold text-sm flex items-center gap-2">
                    {session.name}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Fecha: {new Date(session.startTime).toLocaleString()} • {session.packetsCount} Paquetes • Alt. Máx: {session.maxAltitude}m
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectSession(session);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 transition-colors"
                    title="Cargar telemetría en el Dashboard"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Cargar</span>
                  </button>

                  <button
                    onClick={() => exportToCsv(session.packets, session.name)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                    title="Descargar archivo CSV"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                  </button>

                  <button
                    onClick={() => onDeleteSession(session.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 transition-colors"
                    title="Eliminar sesión"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Registros almacenados: <span className="text-white font-bold">{savedSessions.length}</span>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
