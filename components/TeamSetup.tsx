
import React, { useState, useRef } from 'react';
import { Player } from '../types';
import { RULES, POSITIONS } from '../constants';
import { Shield, Info, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft, Save, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

interface TeamSetupProps {
  managerName: string;
  onComplete: (teamName: string, logo: string, players: Player[]) => void;
  onCancel: () => void;
}

const TeamSetup: React.FC<TeamSetupProps> = ({ managerName, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState(`FC ${managerName}`);
  const [logo, setLogo] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Players state: 1 captain + 21 regular = 22 players
  const [captain, setCaptain] = useState<Partial<Player>>({
    name: '',
    position: 'FW',
    clause: 0,
    isCaptain: true,
  });

  const [regularPlayers, setRegularPlayers] = useState<Partial<Player>[]>(
    Array.from({ length: 21 }, () => ({
      name: '',
      position: 'DF',
      clause: 10,
      isCaptain: false,
    }))
  );

  const totalClause = regularPlayers.reduce((sum, p) => sum + (p.clause || 0), 0);
  const gkCount = [captain, ...regularPlayers].filter(p => p.position === 'GK').length;
  
  const isCapValid = totalClause === RULES.HARD_CAP_CLAUSES;
  const isGkValid = gkCount >= RULES.REQUIRED_GK;
  const allNamesFilled = regularPlayers.every(p => p.name?.trim()) && captain.name?.trim();

  const handleUpdatePlayer = (index: number, field: keyof Player, value: any) => {
    const updated = [...regularPlayers];
    updated[index] = { ...updated[index], [field]: value };
    setRegularPlayers(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = () => {
    if (!isCapValid || !isGkValid || !allNamesFilled) {
      alert("Por favor, cumple todos los requisitos de plantilla (1000M exactos, 2 porteros y todos los nombres).");
      return;
    }

    const finalPlayers: Player[] = [
      { ...captain, id: `P-${Date.now()}-CAP`, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cupGoals: 0, cupAssists: 0, cupYellowCards: 0, cupRedCards: 0, cards: 0, injuries: 0, transferListed: false } as Player,
      ...regularPlayers.map((p, i) => ({
        ...p,
        id: `P-${Date.now()}-${i}`,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        cupGoals: 0,
        cupAssists: 0,
        cupYellowCards: 0,
        cupRedCards: 0,
        cards: 0,
        injuries: 0,
        transferListed: false
      } as Player))
    ];

    onComplete(teamName, logo, finalPlayers);
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Fundación del Club</h1>
          <p className="text-slate-400">Configura tu identidad y tu plantilla inicial de ingeniería financiera.</p>
          
          <div className="flex items-center justify-center gap-4 mt-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= i ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {i}
                </div>
                {i < 3 && <div className={`w-12 h-0.5 ${step > i ? 'bg-indigo-600' : 'bg-slate-800'}`} />}
              </div>
            ))}
          </div>
        </header>

        {step === 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <Shield className="text-indigo-500" /> Identidad del Equipo
            </h2>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Nombre del Equipo <AlertCircle size={12} className="text-amber-500" />
                  </label>
                  <input 
                    type="text" 
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-6 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tight italic">
                    * El nombre de tu equipo no podrá ser modificado una vez creado.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Escudo del Club</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group cursor-pointer w-full aspect-video bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-500 hover:bg-slate-800/50 transition-all overflow-hidden relative"
                  >
                    {logo ? (
                      <>
                        <img src={logo} alt="Escudo preview" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <Upload className="text-white" size={32} />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="text-slate-600 group-hover:text-indigo-400" size={48} />
                        <div className="text-center">
                          <p className="text-white font-bold text-sm">Cargar Imagen</p>
                          <p className="text-slate-500 text-xs">PNG, JPG o WEBP</p>
                        </div>
                      </>
                    )}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-8 border-t border-slate-800">
                <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">Cancelar Registro</button>
                <button 
                  onClick={nextStep}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Configurar Capitán <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <Shield className="text-amber-500" /> El Capitán Inamovible
            </h2>
            <p className="text-slate-500 mb-8">Este jugador será tu identidad. Es intransferible y no tiene cláusula de rescisión.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nombre del Capitán</label>
                <input 
                  type="text" 
                  autoFocus
                  value={captain.name}
                  onChange={(e) => setCaptain({ ...captain, name: e.target.value })}
                  placeholder="ej. Leo Manso"
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Posición</label>
                <select 
                  value={captain.position}
                  onChange={(e) => setCaptain({ ...captain, position: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-8 mt-8 border-t border-slate-800">
              <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
                <ChevronLeft size={20} /> Volver
              </button>
              <button 
                onClick={nextStep}
                disabled={!captain.name}
                className="disabled:opacity-50 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
              >
                Registrar Plantilla (21) <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur border-b border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Cláusulas Totales</p>
                  <p className={`text-2xl font-black ${isCapValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalClause} <span className="text-sm font-bold opacity-50">/ 1000M</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Porteros (Min 2)</p>
                  <p className={`text-2xl font-black ${isGkValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {gkCount} <span className="text-sm font-bold opacity-50">/ 2</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={handleFinish}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                  isCapValid && isGkValid && allNamesFilled 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Save size={18} /> Finalizar Inscripción
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Nombre del Jugador</th>
                    <th className="px-6 py-4">Posición</th>
                    <th className="px-6 py-4">Cláusula (M)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {regularPlayers.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <input 
                          type="text" 
                          value={p.name}
                          onChange={(e) => handleUpdatePlayer(idx, 'name', e.target.value)}
                          placeholder="Nombre del Jugador"
                          className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white font-medium placeholder:text-slate-700"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={p.position}
                          onChange={(e) => handleUpdatePlayer(idx, 'position', e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none"
                        >
                          {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min={RULES.MIN_CLAUSE}
                            value={p.clause}
                            onChange={(e) => handleUpdatePlayer(idx, 'clause', parseInt(e.target.value) || 0)}
                            className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none text-right"
                          />
                          <span className="text-slate-500 font-bold text-[10px]">M</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between items-center py-8">
              <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
                <ChevronLeft size={20} /> Volver al Capitán
              </button>
              {!allNamesFilled && <p className="text-rose-400 text-xs font-bold animate-pulse">Debes completar todos los nombres</p>}
              {!isCapValid && <p className="text-rose-400 text-xs font-bold">La suma de cláusulas debe ser 1000M</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSetup;
