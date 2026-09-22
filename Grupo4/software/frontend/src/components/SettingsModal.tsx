import React, { useState } from 'react';
import { Settings, X, Plus, Trash2, Save, Cpu } from 'lucide-react';
import { AlertThresholds, CustomSensorDefinition } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: AlertThresholds;
  onSaveThresholds: (thresholds: AlertThresholds) => void;
  customSensorsList: CustomSensorDefinition[];
  onAddCustomSensor: (sensor: CustomSensorDefinition) => void;
  onRemoveCustomSensor: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSaveThresholds,
  customSensorsList,
  onAddCustomSensor,
  onRemoveCustomSensor,
}) => {
  if (!isOpen) return null;

  const [formThresholds, setFormThresholds] = useState<AlertThresholds>({ ...thresholds });

  // State for new custom sensor builder
  const [newSensorName, setNewSensorName] = useState('');
  const [newSensorUnit, setNewSensorUnit] = useState('ppm');
  const [newSensorMin, setNewSensorMin] = useState(0);
  const [newSensorMax, setNewSensorMax] = useState(100);
  const [newSensorColor, setNewSensorColor] = useState('#1db954');

  const handleAddSensorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSensorName.trim()) return;

    const sensorId = `custom_${Date.now()}`;
    onAddCustomSensor({
      id: sensorId,
      name: newSensorName.trim(),
      unit: newSensorUnit.trim() || 'val',
      minVal: Number(newSensorMin),
      maxVal: Number(newSensorMax),
      chartColor: newSensorColor,
    });

    setNewSensorName('');
    setNewSensorUnit('ppm');
  };

  const handleSave = () => {
    onSaveThresholds(formThresholds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-5 text-white shadow-2xl font-sans flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Configuración de Alertas & Sensores Custom</h2>
              <p className="text-xs text-slate-400 font-mono">Arquitectura Extensible para Proyectos Escolares</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 font-mono text-xs pr-1">
          
          {/* Section 1: Threshold Settings */}
          <div>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">
              1. Umbrales de Alertas Térmicas y Eléctricas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <label className="block text-slate-400 text-[11px] mb-1">
                  Mínimo Voltaje Batería (V):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formThresholds.minBatteryVoltage}
                  onChange={(e) =>
                    setFormThresholds({
                      ...formThresholds,
                      minBatteryVoltage: parseFloat(e.target.value) || 3.4,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <label className="block text-slate-400 text-[11px] mb-1">
                  Máxima Temperatura (°C):
                </label>
                <input
                  type="number"
                  step="1"
                  value={formThresholds.maxTemperature}
                  onChange={(e) =>
                    setFormThresholds({
                      ...formThresholds,
                      maxTemperature: parseFloat(e.target.value) || 45,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <label className="block text-slate-400 text-[11px] mb-1">
                  Velocidad Peligrosa Descenso (m/s):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formThresholds.maxDescentRate}
                  onChange={(e) =>
                    setFormThresholds({
                      ...formThresholds,
                      maxDescentRate: parseFloat(e.target.value) || 11.0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <label className="block text-slate-400 text-[11px] mb-1">
                  Timeout Ausencia Datos (Seg):
                </label>
                <input
                  type="number"
                  step="1"
                  value={formThresholds.signalTimeoutSec}
                  onChange={(e) =>
                    setFormThresholds({
                      ...formThresholds,
                      signalTimeoutSec: parseFloat(e.target.value) || 4.0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Custom Extensible Sensors Builder */}
          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              2. Agregar Nuevas Variables de Sensores (Extensibilidad)
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Puedes agregar variables personalizadas como Calidad del Aire (CO₂), Índice UV, Radiación o Gas MQ-135.
            </p>

            {/* List of Custom Sensors */}
            <div className="space-y-2 mb-4">
              {customSensorsList.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-950/80 text-center text-slate-500 text-xs border border-slate-800">
                  No se han registrado variables custom adicionales.
                </div>
              ) : (
                customSensorsList.map((sensor) => (
                  <div
                    key={sensor.id}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sensor.chartColor }}
                      />
                      <div>
                        <div className="text-white font-bold">{sensor.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Unidades: {sensor.unit} | Rango: [{sensor.minVal} - {sensor.maxVal}]
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveCustomSensor(sensor.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-950 text-rose-400 transition-colors"
                      title="Eliminar sensor custom"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Custom Sensor Form */}
            <form
              onSubmit={handleAddSensorSubmit}
              className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-3"
            >
              <div className="font-bold text-white text-xs">Añadir Nuevo Sensor:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Nombre (ej: CO2)"
                  value={newSensorName}
                  onChange={(e) => setNewSensorName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Unidad (ej: ppm)"
                  value={newSensorUnit}
                  onChange={(e) => setNewSensorUnit(e.target.value)}
                  className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Mín Val"
                  value={newSensorMin}
                  onChange={(e) => setNewSensorMin(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Máx Val"
                  value={newSensorMax}
                  onChange={(e) => setNewSensorMax(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Color Gráfica:</span>
                  <input
                    type="color"
                    value={newSensorColor}
                    onChange={(e) => setNewSensorColor(e.target.value)}
                    className="w-8 h-8 rounded bg-transparent cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Variable</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>

      </div>
    </div>
  );
};
