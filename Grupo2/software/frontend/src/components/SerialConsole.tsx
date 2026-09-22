import React, { useRef, useEffect } from 'react';

interface Props {
  rawLines: string[];
  onClear: () => void;
}

export function SerialConsole({ rawLines, onClear }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rawLines]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-300">Consola Serial</h3>
        <button
          onClick={onClear}
          className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700"
        >
          Limpiar
        </button>
      </div>
      <div className="bg-slate-950 rounded-lg p-3 h-64 overflow-y-auto font-mono text-xs text-green-400 border border-slate-800">
        {rawLines.length === 0 ? (
          <p className="text-slate-600">Sin datos. Conecta el ESP32 via USB...</p>
        ) : (
          rawLines.map((line, i) => (
            <div key={i} className="py-0.5 hover:bg-slate-900/50">
              <span className="text-slate-600 mr-2">{String(i + 1).padStart(4, '0')}</span>
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
