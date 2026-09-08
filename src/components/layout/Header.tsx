import React from 'react';
import {
  Layers,
  Building2,
  FolderKanban,
  FileCheck2,
  Send,
  FileText,
  RefreshCw,
  PieChart,
  Sparkles,
  LogOut,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SystemMode, OpenPlatformTab, OperatorTab, TenantTab } from '../../types';

export const Header: React.FC = () => {
  const {
    systemMode,
    setSystemMode,
    currentTenant,
    tenantLogout,
    merchants,
    switchTenantDirectly,
    simulateAllActiveOrders,
  } = useApp();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white">丰迹平台</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 font-mono">
                  V1.0
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">顺丰网格线下履约中台</span>
              </div>
            </div>
          </div>

          {/* Major System Modes Switcher (PRD: Open Platform & Tenant Portal) */}
          <div className="hidden md:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 text-xs font-medium">
            <button
              onClick={() => setSystemMode('open_platform')}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                systemMode === 'open_platform'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              开放平台系统
            </button>

            <button
              onClick={() => setSystemMode('tenant')}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                systemMode === 'tenant'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              丰迹租户端
              {currentTenant && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-0.5" />
              )}
            </button>
          </div>

          {/* Right Action & User Profile */}
          <div className="flex items-center gap-3 text-xs">
            {systemMode === 'tenant' && currentTenant ? (
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-200 font-medium">{currentTenant.name}</span>
                <span className="text-slate-400">({currentTenant.adminName})</span>
                <button
                  onClick={tenantLogout}
                  className="ml-2 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  title="退出登录"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : systemMode === 'tenant' && !currentTenant ? (
              <span className="text-slate-400 text-[11px]">租户未登录</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 hidden lg:inline text-[11px]">当前操作员：</span>
                <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 font-mono text-[11px]">
                  李雷 (运营专家)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Mode Switcher Bar */}
      <div className="md:hidden border-t border-slate-800 px-4 py-2 flex justify-around bg-slate-900 text-xs">
        <button
          onClick={() => setSystemMode('open_platform')}
          className={`py-1 px-2 rounded ${systemMode === 'open_platform' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          开放平台系统
        </button>
        <button
          onClick={() => setSystemMode('tenant')}
          className={`py-1 px-2 rounded ${systemMode === 'tenant' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          丰迹租户端
        </button>
      </div>
    </header>
  );
};
