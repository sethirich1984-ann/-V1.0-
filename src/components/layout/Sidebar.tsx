import React from 'react';
import {
  Building2,
  FolderKanban,
  FileCheck2,
  Send,
  FileText,
  RefreshCw,
  PieChart,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OpenPlatformTab, OperatorTab, TenantTab } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    systemMode,
    activeOpPlatformTab,
    setActiveOpPlatformTab,
    activeOpTab,
    setActiveOpTab,
    activeTenantTab,
    setActiveTenantTab,
    tasks,
    orders,
    dispatchRecords,
    currentTenant,
    isTenantLoggedIn,
    tenantLogout,
  } = useApp();

  const pendingTasksCount = tasks.filter((t) => t.status === '待配置').length;
  const waitingOrdersCount = orders.filter((o) => o.status === 'waiting_assign').length;
  const pendingTenantDispatchesCount = currentTenant
    ? dispatchRecords.filter((d) => d.merchantId === currentTenant.id && d.status === '待下发').length
    : 0;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0 shadow-xs">
      <div className="space-y-6">
        {/* Mode Indicator Tag */}
        <div className="px-3.5 py-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
          <div className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">当前工作区</div>
          <div className="font-bold text-slate-900 mt-1 flex items-center gap-2">
            {systemMode === 'open_platform' && (
              <>
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">开放平台系统</span>
              </>
            )}
            {systemMode === 'operator' && (
              <>
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">丰迹运营中台</span>
              </>
            )}
            {systemMode === 'tenant' && (
              <>
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">租户自服务空间</span>
              </>
            )}
          </div>
        </div>

        {/* Sub-menu Navigation based on Mode */}
        <nav className="space-y-1.5 text-xs">
          {/* 1. Open Platform Mode */}
          {systemMode === 'open_platform' && (
            <>
              <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400">开放平台</div>
              <button
                onClick={() => setActiveOpPlatformTab('merchants')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                  activeOpPlatformTab === 'merchants'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">商户管理（丰迹tab）</span>
                </div>
              </button>

              <button
                onClick={() => setActiveOpPlatformTab('projects')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                  activeOpPlatformTab === 'projects'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FolderKanban className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">项目管理</span>
                </div>
              </button>

              {/* 丰迹运营平台 (一级菜单分组) */}
              <div className="pt-3 pb-1">
                <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>丰迹运营平台</span>
                </div>
              </div>

              <button
                onClick={() => setActiveOpPlatformTab('tasks')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                  activeOpPlatformTab === 'tasks'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 pl-1.5">
                  <FileCheck2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">任务管理</span>
                </div>
                {pendingTasksCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-mono font-bold">
                    {pendingTasksCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveOpPlatformTab('dispatches')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                  activeOpPlatformTab === 'dispatches'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 pl-1.5">
                  <Send className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">下单管理</span>
                </div>
              </button>

              <button
                onClick={() => setActiveOpPlatformTab('orders')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                  activeOpPlatformTab === 'orders'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 pl-1.5">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">订单管理</span>
                </div>
                {waitingOrdersCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold">
                    {waitingOrdersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveOpPlatformTab('services')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                  activeOpPlatformTab === 'services'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 pl-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="whitespace-nowrap">服务市场</span>
                </div>
              </button>

              <button
                onClick={() => setActiveOpPlatformTab('dashboard')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                  activeOpPlatformTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 pl-1.5">
                  <PieChart className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">数据看板</span>
                </div>
                {orders.filter((o) => o.anomalySeverity === 'high' || o.isTimeoutUnassigned || (o.auditRejectCount && o.auditRejectCount > 0)).length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full font-mono font-bold">
                    {orders.filter((o) => o.anomalySeverity === 'high' || o.isTimeoutUnassigned || (o.auditRejectCount && o.auditRejectCount > 0)).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveOpPlatformTab('sync')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                  activeOpPlatformTab === 'sync'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 pl-1.5">
                  <RefreshCw className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">数据同步</span>
                </div>
              </button>
            </>
          )}

          {/* 2. Operator Backend Mode */}
          {systemMode === 'operator' && (
            <>
              <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400">丰迹运营中枢</div>
              <button
                onClick={() => setActiveOpTab('tasks')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                  activeOpTab === 'tasks'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">任务管理与配置</span>
                </div>
                {pendingTasksCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-mono font-bold">
                    {pendingTasksCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveOpTab('dispatches')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                  activeOpTab === 'dispatches'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">下单与派发管理</span>
                </div>
              </button>

              <button
                onClick={() => setActiveOpTab('orders')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                  activeOpTab === 'orders'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">全量工单流转</span>
                </div>
                {waitingOrdersCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold">
                    {waitingOrdersCount}
                  </span>
                )}
              </button>

              {/* 服务市场分组及子页面 */}
              <div className="pt-2">
                <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>服务市场</span>
                </div>

                <div className="space-y-1 pl-1">
                  <button
                    onClick={() => setActiveOpTab('services')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer text-xs ${
                      activeOpTab === 'services'
                        ? 'bg-purple-50 text-purple-800 font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="whitespace-nowrap">增值服务市场</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveOpTab('dashboard')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer text-xs ${
                      activeOpTab === 'dashboard'
                        ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PieChart className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="whitespace-nowrap">数据看板 (异常监控)</span>
                    </div>
                    {orders.filter((o) => o.anomalySeverity === 'high' || o.isTimeoutUnassigned || (o.auditRejectCount && o.auditRejectCount > 0)).length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full font-mono font-bold">
                        {orders.filter((o) => o.anomalySeverity === 'high' || o.isTimeoutUnassigned || (o.auditRejectCount && o.auditRejectCount > 0)).length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveOpTab('sync')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer text-xs ${
                      activeOpTab === 'sync'
                        ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="whitespace-nowrap">数据同步与回调</span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 3. Tenant Portal Mode */}
          {systemMode === 'tenant' && (
            <>
              {/* 商户登录状态与信息展示卡片 */}
              {currentTenant && isTenantLoggedIn ? (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl mb-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 truncate max-w-[120px]">{currentTenant.name}</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-medium">
                      已认证
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    管理员：{currentTenant.adminName}
                  </div>
                  <div className="mt-2 pt-2 border-t border-indigo-100/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTenantTab('login')}
                      className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                    >
                      切换商户
                    </button>
                    <button
                      type="button"
                      onClick={tenantLogout}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTenantTab('login')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer mb-2 ${
                    activeTenantTab === 'login'
                      ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="whitespace-nowrap">租户登录认证</span>
                  </div>
                </button>
              )}

              {/* 下单管理（工作台一体化：批量新建 + 实时下单记录看板） */}
              <button
                onClick={() => setActiveTenantTab('new_dispatch')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer mb-2 ${
                  activeTenantTab === 'new_dispatch' || activeTenantTab === 'dispatches'
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">下单管理</span>
                </div>
                {pendingTenantDispatchesCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-mono font-bold">
                    {pendingTenantDispatchesCount} 待下发
                  </span>
                )}
              </button>

              {/* 订单管理 */}
              <div className="pt-2 pb-1">
                <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>订单管理</span>
                </div>
                <div className="space-y-1 pl-1">
                  <button
                    onClick={() => setActiveTenantTab('order_status')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer text-xs ${
                      activeTenantTab === 'order_status'
                        ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="whitespace-nowrap">订单监控</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTenantTab('order_data')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition cursor-pointer text-xs ${
                      activeTenantTab === 'order_data'
                        ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="whitespace-nowrap">订单数据（采集数据）</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 服务市场 */}
              <div className="pt-2">
                <button
                  onClick={() => setActiveTenantTab('services')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTenantTab === 'services'
                      ? 'bg-purple-50 text-purple-800 font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="whitespace-nowrap">服务市场（服务介绍）</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>渠道核心引擎:</span>
          <span className="font-semibold text-slate-700">顺丰·丰创</span>
        </div>
        <div className="flex items-center justify-between">
          <span>当前环境:</span>
          <span className="font-mono text-emerald-600 font-medium">Production V1.0</span>
        </div>
      </div>
    </aside>
  );
};
