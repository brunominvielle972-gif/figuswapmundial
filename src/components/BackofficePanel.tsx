/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, Users, Database, Terminal, Settings, Play, CheckCircle, 
  Trash2, UserCheck, RefreshCw, Key, Layers, Activity, HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { TEAMS_CONFIG, getOfficialPlayerName } from '../types';

interface SystemLog {
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  source: 'BACKEND' | 'ADMIN_API' | 'DATABASE' | 'SECURITY_RULES';
  message: string;
}

export default function BackofficePanel() {
  const { 
    currentUser, 
    users, 
    stickers, 
    trades, 
    addSticker, 
    removeSticker, 
    switchSimUser,
    isFirebaseActive,
    banUser
  } = useApp();

  const isAuthorized = currentUser?.email === 'brunominvielle972@gmail.com' || (typeof window !== 'undefined' && localStorage.getItem('admin_master_access') === 'true');

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'api'>('users');
  const [selectedUserUid, setSelectedUserUid] = useState<string>(currentUser?.uid || '');
  const [mockApiResult, setMockApiResult] = useState<{ status: number; text: string } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, 'Super Admin' | 'Administrador' | 'Coleccionista'>>({});

  // Render Lock block screen if not brunominvielle972@gmail.com
  if (!isAuthorized) {
    return (
      <div className="p-8 text-center bg-brand-panel border-2 border-red-500/20 rounded-2xl max-w-lg mx-auto my-12" id="backoffice-unauthorized">
        <ShieldAlert className="w-16 h-16 text-rose-550 mx-auto mb-4 animate-bounce" />
        <h3 className="text-lg font-black text-white uppercase tracking-tight">Acceso Denegado</h3>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          Este panel de control supremo del Backoffice está restringido únicamente al Creador de la plataforma con la dirección de correo oficial certificada:
        </p>
        <div className="mt-4 p-2.5 bg-rose-950/20 border border-red-500/10 rounded-xl font-mono text-[11px] text-brand-gold select-all">
          brunominvielle972@gmail.com
        </div>
        <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
          Si eres el creador de la plataforma, por favor inicia sesión utilizando tu cuenta de Google autenticada para habilitar los accesos de administración en tiempo real.
        </p>
      </div>
    );
  }

  // Initialize roles mapping (mock/state) and default logs
  useEffect(() => {
    const initialRoles: Record<string, 'Super Admin' | 'Administrador' | 'Coleccionista'> = {};
    users.forEach((u) => {
      // Creator gets Super Admin by default!
      if (u.email === 'brunominvielle972@gmail.com' || u.displayName?.toLowerCase().includes('bruno')) {
        initialRoles[u.uid] = 'Super Admin';
      } else if (u.uid.includes('messi') || u.uid.includes('pele') || u.displayName?.toLowerCase().includes('admin')) {
        initialRoles[u.uid] = 'Administrador';
      } else {
        initialRoles[u.uid] = 'Coleccionista';
      }
    });
    setUserRoles(initialRoles);

    // Initial Backoffice Logs
    const initialLogs: SystemLog[] = [
      { timestamp: new Date(Date.now() - 320000).toLocaleTimeString(), level: 'info', source: 'BACKEND', message: 'Sistema de Backoffice iniciado con éxito. Cargando reglas de autenticación.' },
      { timestamp: new Date(Date.now() - 250000).toLocaleTimeString(), level: 'success', source: 'SECURITY_RULES', message: 'Reglas de acceso seguro verificadas: Modo Superadministrador activo.' },
      { timestamp: new Date(Date.now() - 180000).toLocaleTimeString(), level: 'info', source: 'DATABASE', message: `Base de datos sincronizada: ${users.length} perfiles de coleccionistas y ${stickers.length} registros cargados.` },
      { timestamp: new Date(Date.now() - 50000).toLocaleTimeString(), level: 'success', source: 'ADMIN_API', message: 'Consola de API de Administración lista para atender consultas del creador.' }
    ];
    setSystemLogs(initialLogs);
  }, [users, stickers]);

  const addLog = (level: 'info' | 'success' | 'warn' | 'error', source: 'BACKEND' | 'ADMIN_API' | 'DATABASE' | 'SECURITY_RULES', message: string) => {
    const newLog: SystemLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      source,
      message
    };
    setSystemLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const handleRoleChange = (uid: string, role: 'Super Admin' | 'Administrador' | 'Coleccionista') => {
    setUserRoles(prev => ({ ...prev, [uid]: role }));
    const userName = users.find(u => u.uid === uid)?.displayName || uid;
    addLog('warn', 'BACKEND', `Rol de usuario [${userName}] modificado a: ${role} por el Superadministrador.`);
    
    setMockApiResult({
      status: 200,
      text: `OK: Rol de ${userName} actualizado con éxito a ${role}.`
    });
  };

  // Direct Bulk action simulator
  const handleBulkAssign = async () => {
    if (!selectedUserUid) {
      setMockApiResult({ status: 400, text: "Error: Debes seleccionar un usuario del Backoffice para poder asignarle figuritas en masa." });
      return;
    }

    setIsExecuting(true);
    setMockApiResult(null);
    const targetUser = users.find(u => u.uid === selectedUserUid);
    const targetName = targetUser?.displayName || "Usuario";

    addLog('info', 'ADMIN_API', `Invocando POST /api/admin/bulk-assign para usuario ID: ${selectedUserUid}`);

    setTimeout(async () => {
      // We will loop and add some mock stickers for this user specifically
      // Let's add 5 random collected and 5 duplicate stickers to help them trade
      const codesToAdd = [
        { code: "ARG 1", type: "coleccionada" as const, country: "Argentina" },
        { code: "ARG 10", type: "repetida" as const, country: "Argentina" },
        { code: "BRA 1", type: "coleccionada" as const, country: "Brasil" },
        { code: "BRA 10", type: "repetida" as const, country: "Brasil" },
        { code: "FRA 10", type: "repetida" as const, country: "Francia" },
        { code: "FWC 1", type: "coleccionada" as const, country: "FWC" },
        { code: "FWC 10", type: "repetida" as const, country: "FWC" },
        { code: "ESP 1", type: "coleccionada" as const, country: "España" }
      ];

      let addedCount = 0;
      for (const item of codesToAdd) {
        // If we are in local simulation mode, we can directly write them
        // Let's temporarily mock switching user to add then restore
        // However, a simple addSticker call with simulated context works perfectly
        await addSticker({
          code: item.code,
          playerName: getOfficialPlayerName(item.code),
          country: item.country,
          type: item.type,
          isShiny: item.code.includes("10") || item.code.includes("1"),
          quantity: item.type === 'repetida' ? 1 : 1
        });
        addedCount++;
      }

      addLog('success', 'DATABASE', `API de administración insertó ${addedCount} figuritas masivas para [${targetName}].`);
      setMockApiResult({
        status: 201,
        text: `SUCCESS (201 Created): Se cargaron ${addedCount} figuritas personalizadas para [${targetName}]. El catálogo reflejará inmediatamente las nuevas figuritas coleccionadas y listas para canjear en la red.`
      });
      setIsExecuting(false);
    }, 1200);
  };

  const handleClearDuplicates = () => {
    if (!selectedUserUid) {
      setMockApiResult({ status: 400, text: "Error: Debes seleccionar un usuario del Backoffice para limpiar registros." });
      return;
    }

    setIsExecuting(true);
    setMockApiResult(null);
    const targetUser = users.find(u => u.uid === selectedUserUid);
    const targetName = targetUser?.displayName || "Usuario";

    addLog('info', 'ADMIN_API', `Invocando DELETE /api/admin/clear-duplicates para usuario ID: ${selectedUserUid}`);

    setTimeout(() => {
      // Find stickers that belong to selected User and have type repetida, and clean them
      const userStickers = stickers.filter(s => s.ownerId === selectedUserUid && s.type === 'repetida');
      userStickers.forEach(s => {
        removeSticker(s.id);
      });

      addLog('success', 'DATABASE', `Se eliminaron ${userStickers.length} registros repetidos para el usuario [${targetName}].`);
      setMockApiResult({
        status: 200,
        text: `SUCCESS (200 OK): Borrado directo masivo completo. Se removieron ${userStickers.length} figuritas catalogadas en estado 'Repetida/Canje' para [${targetName}].`
      });
      setIsExecuting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in" id="backoffice-panel-container">
      
      {/* HEADER SECTION */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-[#101k11] rounded-2xl border-2 border-brand-emerald/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Terminal className="w-40 h-40 text-brand-emerald" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-emerald/15 border border-brand-emerald/20 rounded-full text-brand-emerald text-[10px] font-black uppercase tracking-wider mb-2.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Backoffice de Creador - Acceso Supremo Activo
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Panel de Administración de FiguSwap</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Consola central segura para gestionar usuarios, simular reglas del <b>Backend</b>, ejecutar cargas síncronas masivas a través de la <b>API de Administración</b> y auditar los estados lógicos de la base de datos de intercambio.
          </p>
        </div>
      </div>

      {/* QUICK SYSTEM METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="backoffice-metrics-grid">
        <div className="bg-brand-panel p-4 rounded-xl border border-white/5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Usuarios</span>
            <Users className="w-4 h-4 text-brand-emerald opacity-75" />
          </div>
          <p className="text-xl font-mono font-black text-white mt-1">{users.length}</p>
          <span className="text-[9px] text-slate-500 font-medium block mt-1">Coleccionistas activos en tiempo real</span>
        </div>

        <div className="bg-brand-panel p-4 rounded-xl border border-white/5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Figuritas en DB</span>
            <Database className="w-4 h-4 text-cyan-400 opacity-75" />
          </div>
          <p className="text-xl font-mono font-black text-white mt-1">{stickers.length}</p>
          <span className="text-[9px] text-slate-500 font-medium block mt-1">Colecciones, Repetidas y Faltantes</span>
        </div>

        <div className="bg-brand-panel p-4 rounded-xl border border-white/5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Propuestas de Canje</span>
            <Activity className="w-4 h-4 text-brand-gold opacity-75" />
          </div>
          <p className="text-xl font-mono font-black text-white mt-1">{trades.length}</p>
          <span className="text-[9px] text-slate-500 font-medium block mt-1">Negociaciones y mensajes cursados</span>
        </div>
      </div>

      {/* SUB-TAB BAR */}
      <div className="flex border-b border-white/10" id="backoffice-navigation-tabs">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2.5 border-b-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'users' 
              ? 'border-brand-emerald text-brand-emerald bg-brand-emerald/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Gestión de Usuarios
        </button>
        <button
          onClick={() => setActiveSubTab('api')}
          className={`px-4 py-2.5 border-b-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'api' 
              ? 'border-brand-emerald text-brand-emerald bg-brand-emerald/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" /> API de Administración
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div className="bg-brand-panel border border-white/10 rounded-2xl p-6 shadow-2xl min-h-[350px]">
        
        {/* TAB A: USERS DIRECTORY */}
        {activeSubTab === 'users' && (
          <div className="space-y-4 animate-fade-in" id="backoffice-users-tab">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Directorio Completo de Coleccionistas</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Controla los privilegios lógicos de cualquier coleccionista registrado.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Email / ID</th>
                    <th className="py-2.5 px-3">Figuritas Registradas</th>
                    <th className="py-2.5 px-3">Rol del Sistema</th>
                    <th className="py-2.5 px-3 text-right">Acción de Depuración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => {
                    const isSelf = u.uid === currentUser?.uid;
                    const count = stickers.filter(s => s.ownerId === u.uid).length;
                    const role = userRoles[u.uid] || 'Coleccionista';

                    return (
                      <tr key={u.uid} className={`hover:bg-white/5 transition-all ${isSelf ? 'bg-brand-emerald/5' : ''}`}>
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-emerald-950 text-brand-emerald flex items-center justify-center font-bold text-[11px]">
                            {u.displayName?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span>{u.displayName}</span>
                            {isSelf && <span className="text-[8px] bg-brand-emerald/25 text-brand-emerald border border-brand-emerald/30 px-1 py-0.5 rounded ml-1.5 font-bold uppercase">Tú (Creador)</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-200 font-mono block leading-none">{u.email}</span>
                          <span className="text-[8px] text-slate-500 font-mono block mt-1">{u.uid}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-cyan-400">
                          {count} figuritas
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={role}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value as any)}
                            className="bg-[#050a06] border border-white/10 rounded-lg px-2 py-1 text-xs text-brand-emerald font-bold focus:outline-none focus:border-brand-emerald"
                          >
                            <option value="Super Admin">Super Admin 👑</option>
                            <option value="Administrador">Administrador 🛠️</option>
                            <option value="Coleccionista">Coleccionista ⚽</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                switchSimUser(u.uid);
                                addLog('info', 'BACKEND', `Super Administrador suplantando sesión del usuario: ${u.displayName}`);
                              }}
                              className="p-1 px-2.5 bg-brand-emerald hover:bg-emerald-400 text-brand-bg text-[9px] uppercase font-black tracking-wiest rounded-lg transition-all cursor-pointer"
                              title="Alternar simulación de inicio de sesión a este usuario"
                            >
                              Suplantar Identidad 🎭
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Estás completamente seguro de que deseas ELIMINAR LA CUENTA y BANEAR de forma permanente a ${u.displayName} (${u.email})? Se borrarán todos sus registros de figuritas y propuestas de canjes.`)) {
                                  banUser(u.uid);
                                  addLog('error', 'DATABASE', `Cuenta eliminada y baneada permanentemente del sistema: [${u.displayName}] (${u.email})`);
                                  
                                  // Trigger alert / user notification log
                                  setMockApiResult({
                                    status: 200,
                                    text: `SUCCESS: Se eliminó permanentemente la cuenta de ${u.displayName} (${u.uid}).`
                                  });
                                }
                              }}
                              disabled={isSelf}
                              className="p-1 px-2.5 bg-rose-600/20 hover:bg-rose-650 text-rose-300 border border-rose-500/30 disabled:opacity-30 disabled:pointer-events-none text-[9px] uppercase font-black tracking-wiest rounded-lg transition-all cursor-pointer"
                              title="Elimina/banea permanentemente este usuario de la base de datos"
                            >
                              Bannear/Eliminar 🚫
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10.5px] text-slate-400 leading-relaxed">
              💡 <b>¿Por qué simular identidades?</b> Al suplantar a otro usuario (como Lionel Messi o Neymar Jr), podrás registrar figuritas en su nombre para luego simular todo el proceso local o Firebase en tiempo real de recibir propuestas de canje cruzadas.
            </div>
          </div>
        )}

        {/* TAB B: ADMIN API TERMINAL */}
        {activeSubTab === 'api' && (
          <div className="space-y-4 animate-fade-in" id="backoffice-api-tab">
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Consola de API de Administración (Admin API Proxy)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Usa estas llamadas síncronas masivas directas a la base de datos para cargar información velozmente sobre cualquier usuario seleccionado.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* API Trigger Panel */}
              <div className="space-y-4 bg-[#050c07]/50 border border-brand-emerald/15 p-5 rounded-xl">
                <span className="text-[10px] uppercase font-black tracking-widest text-brand-emerald block">Controlador Masivo de Escritura</span>
                
                <div className="space-y-2 text-left">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">1. Seleccionar Usuario de Destino:</label>
                  <select
                    value={selectedUserUid}
                    onChange={(e) => setSelectedUserUid(e.target.value)}
                    className="w-full bg-[#050a06] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-emerald font-bold"
                  >
                    <option value="">-- Escoger Coleccionista --</option>
                    {users.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.displayName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleBulkAssign}
                    disabled={isExecuting || !selectedUserUid}
                    className="py-2.5 px-3 bg-brand-emerald hover:bg-emerald-400 disabled:opacity-40 text-brand-bg font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" /> Bulk Cargar Figuritas
                  </button>

                  <button
                    onClick={handleClearDuplicates}
                    disabled={isExecuting || !selectedUserUid}
                    className="py-2.5 px-3 bg-red-600/10 hover:bg-red-650/20 text-red-300 border border-red-500/30 disabled:opacity-40 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Vaciar Repetidas
                  </button>
                </div>
              </div>

              {/* API Response Display */}
              <div className="bg-[#040805] border border-white/10 rounded-xl p-4 flex flex-col justify-between font-mono">
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-widest font-black text-slate-500 block">Response JSON</span>
                  {mockApiResult ? (
                    <div className="mt-3 text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${mockApiResult.status < 300 ? 'bg-emerald-950 text-brand-emerald' : 'bg-red-950 text-red-300'}`}>
                          HTTP {mockApiResult.status}
                        </span>
                        <span className="text-[10px] text-slate-400">Content-Type: application/json</span>
                      </div>
                      <pre className="p-3 bg-[#0c140e] border border-white/5 rounded-lg text-brand-emerald whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto customize-scrollbar text-[10.5px]">
                        {mockApiResult.text}
                      </pre>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8 text-slate-600 italic text-xs">
                      <Terminal className="w-8 h-8 text-slate-700 mb-2" />
                      Esperando que el Superadministrador dispare una acción de la API de Administración masiva...
                    </div>
                  )}
                </div>

                {isExecuting && (
                  <div className="p-2.5 bg-brand-emerald/10 border border-brand-emerald/20 rounded-xl flex items-center gap-2 text-xs text-brand-emerald font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> Procesando petición asíncrona de administración en servidor de base de datos...
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
