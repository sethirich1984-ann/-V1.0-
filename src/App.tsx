import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/common/ToastContainer';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Open Platform
import { PlatformOverview } from './components/openPlatform/PlatformOverview';
import { MerchantManagement } from './components/openPlatform/MerchantManagement';
import { ProjectManagement } from './components/openPlatform/ProjectManagement';
import { ApiHub } from './components/openPlatform/ApiHub';
import { AppManagement } from './components/openPlatform/AppManagement';

// Operator Backend
import { TaskManagement } from './components/operator/TaskManagement';
import { DispatchManagement } from './components/operator/DispatchManagement';
import { OrderManagement } from './components/operator/OrderManagement';
import { DataSync } from './components/operator/DataSync';
import { DataDashboard } from './components/operator/DataDashboard';
import { ServiceMarketAdmin } from './components/operator/ServiceMarketAdmin';

// Tenant Portal
import { TenantLogin } from './components/tenant/TenantLogin';
import { TenantDispatchManagement } from './components/tenant/TenantDispatchManagement';
import { TenantOrderStatus } from './components/tenant/TenantOrderStatus';
import { TenantOrderData } from './components/tenant/TenantOrderData';
import { TenantServiceMarket } from './components/tenant/TenantServiceMarket';

const MainContent: React.FC = () => {
  const { systemMode, activeOpPlatformTab, activeOpTab, activeTenantTab, currentTenant, isTenantLoggedIn } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      <Header />
      <div className="flex-1 flex w-full min-w-0">
        {/* Render Sidebar */}
        <Sidebar />

        <main className="flex-1 min-w-0 p-5 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-[1920px]">
          {/* 1. Open Platform Mode */}
          {systemMode === 'open_platform' && (
            <>
              {activeOpPlatformTab === 'merchants' && <MerchantManagement />}
              {activeOpPlatformTab === 'projects' && <ProjectManagement />}
              {activeOpPlatformTab === 'tasks' && <TaskManagement />}
              {activeOpPlatformTab === 'dispatches' && <DispatchManagement />}
              {activeOpPlatformTab === 'orders' && <OrderManagement />}
              {activeOpPlatformTab === 'sync' && <DataSync />}
              {activeOpPlatformTab === 'dashboard' && <DataDashboard />}
              {activeOpPlatformTab === 'services' && <ServiceMarketAdmin />}
            </>
          )}

          {/* 2. Operator Backend Mode */}
          {systemMode === 'operator' && (
            <>
              {activeOpTab === 'tasks' && <TaskManagement />}
              {activeOpTab === 'dispatches' && <DispatchManagement />}
              {activeOpTab === 'orders' && <OrderManagement />}
              {activeOpTab === 'sync' && <DataSync />}
              {activeOpTab === 'dashboard' && <DataDashboard />}
              {activeOpTab === 'services' && <ServiceMarketAdmin />}
            </>
          )}

          {/* 3. Tenant Portal Mode */}
          {systemMode === 'tenant' && (
            <>
              {!currentTenant || !isTenantLoggedIn || activeTenantTab === 'login' ? (
                <TenantLogin />
              ) : (
                <>
                  {(activeTenantTab === 'new_dispatch' || activeTenantTab === 'dispatches') && (
                    <TenantDispatchManagement />
                  )}
                  {activeTenantTab === 'order_status' && <TenantOrderStatus />}
                  {activeTenantTab === 'order_data' && <TenantOrderData />}
                  {activeTenantTab === 'services' && <TenantServiceMarket />}
                </>
              )}
            </>
          )}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
