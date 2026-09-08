import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Merchant,
  ProjectRevenue,
  TaskItem,
  DispatchRecord,
  OrderItem,
  PlatformService,
  SyncLog,
  UserRole,
  SystemMode,
  OrderStatusCode,
  TaskStatus,
  OpenPlatformTab,
  OpenPlatformApp,
  OpenPlatformApiDoc,
  ApiGatewayLog,
} from '../types';
import {
  INITIAL_MERCHANTS,
  INITIAL_PROJECT_REVENUES,
  INITIAL_TASKS,
  INITIAL_DISPATCH_RECORDS,
  INITIAL_ORDERS,
  INITIAL_SERVICES,
  INITIAL_SYNC_LOGS,
  INITIAL_OPEN_APPS,
  INITIAL_API_DOCS,
  INITIAL_GATEWAY_LOGS,
} from '../mockData';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AppContextType {
  // Navigation & System Context
  systemMode: SystemMode;
  setSystemMode: (mode: SystemMode) => void;
  activeOpenTab: OpenPlatformTab;
  setActiveOpenTab: (tab: OpenPlatformTab) => void;
  activeOpPlatformTab: OpenPlatformTab;
  setActiveOpPlatformTab: (tab: OpenPlatformTab) => void;
  activeOpTab: 'tasks' | 'dispatches' | 'orders' | 'sync' | 'dashboard' | 'services';
  setActiveOpTab: (tab: 'tasks' | 'dispatches' | 'orders' | 'sync' | 'dashboard' | 'services') => void;
  activeTenantTab: 'new_dispatch' | 'dispatches' | 'order_status' | 'order_data' | 'services';
  setActiveTenantTab: (tab: 'new_dispatch' | 'dispatches' | 'order_status' | 'order_data' | 'services') => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  // Selected Detail Views ID triggers
  selectedMerchantId: string | null;
  setSelectedMerchantId: (id: string | null) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedDispatchId: string | null;
  setSelectedDispatchId: (id: string | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  dispatchModalOpenRequested: boolean;
  setDispatchModalOpenRequested: (requested: boolean) => void;
  initiateNewDispatch: (taskId: string, merchantId: string) => void;

  // Tenant Authentication
  currentTenant: Merchant | null;
  isTenantLoggedIn: boolean;
  tenantToken: string;
  tenantTokenExpiry: string;
  tenantLogin: (phone: string, code: string) => { success: boolean; message: string };
  tenantLogout: () => void;
  switchTenantDirectly: (merchantId: string) => void;

  // Data Collections
  merchants: Merchant[];
  projects: ProjectRevenue[];
  tasks: TaskItem[];
  dispatchRecords: DispatchRecord[];
  orders: OrderItem[];
  services: PlatformService[];
  syncLogs: SyncLog[];

  // Open Platform Specific Collections & Methods
  openApps: OpenPlatformApp[];
  apiDocs: OpenPlatformApiDoc[];
  gatewayLogs: ApiGatewayLog[];
  addOpenApp: (app: Omit<OpenPlatformApp, 'id' | 'createdAt' | 'lastActiveAt' | 'todayCalls'>) => void;
  updateOpenApp: (id: string, updates: Partial<OpenPlatformApp>) => void;
  toggleAppStatus: (id: string) => void;
  regenerateAppSecret: (id: string) => string;
  sendWebhookTestPing: (appId: string) => Promise<{ success: boolean; latency: number; responseCode: number; msg: string }>;
  executeApiSandboxTest: (apiId: string, customHeaders: Record<string, string>, customBody: string) => Promise<{ statusCode: number; latency: number; response: string }>;
  updateMerchantProductsAndQuota: (merchantId: string, products: string[], quota: number, type: '试用版' | '付费版') => void;

  // CRUD & Business Methods
  addMerchant: (merchant: Omit<Merchant, 'id' | 'createdAt' | 'updatedAt' | 'taskCount' | 'status'>) => void;
  updateMerchant: (id: string, updates: Partial<Merchant>) => void;
  toggleFreezeMerchant: (id: string) => void;

  addProject: (project: Omit<ProjectRevenue, 'id'>) => void;
  updateProjectAmount: (id: string, newAmount: number) => void;
  batchImportProjects: (imported: Array<Partial<ProjectRevenue>>) => { successCount: number; failCount: number };

  addTask: (task: { name: string; merchantId: string; type: string; deadline?: string }) => string;
  batchImportTasks: (tasksList: Array<{ name: string; merchantName: string; type: string; deadline?: string; channelCodeJson?: string }>) => { successCount: number; failCount: number };
  updateTaskChannelConfig: (taskId: string, channel: string, orderType: string, templateFile?: string) => void;
  updateTaskServiceConfig: (
    taskId: string,
    config: {
      preValidationServices?: string[];
      valueAddedServices?: string[];
      serviceQuotas?: Record<string, number>;
      preValidationService?: string;
      valueAddedService?: string;
      freeTrialCount?: number;
    }
  ) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;

  createDispatchRecord: (payload: {
    merchantId: string;
    taskId: string;
    channel: string;
    items: Array<{ contactName: string; contactPhone: string; contactCompany: string; address: string }>;
    immediateDispatch?: boolean;
    creatorRole?: '运营' | '租户';
    creatorName?: string;
  }) => string;
  executeDispatch: (dispatchId: string) => void;
  retryFailedDispatchOrders: (dispatchId: string) => void;

  updateOrder: (orderId: string, updates: { contactName: string; contactPhone: string; contactCompany: string; address: string }) => { success: boolean; message: string };
  cancelOrder: (orderId: string) => { success: boolean; message: string };
  remindOrderCourier: (orderId: string) => void;
  reassignOrder: (orderId: string) => void;
  resubmitOrderAudit: (orderId: string, remark?: string) => void;
  auditPassOrder: (orderId: string, type: 'inner' | 'outer') => void;
  auditRejectOrder: (orderId: string, payload: { stage: '内审质检' | '客户外审'; reason: string; auditor?: string; suggestedAction?: string }) => void;

  // Simulation & Engine Features
  simulateStepOrder: (orderId: string) => void;
  simulateAllActiveOrders: () => void;
  triggerWebhookPush: (type: '订单数据' | '订单状态', orderId?: string) => void;
  runIncrementalSync: () => void;
  retrySyncLog: (logId: string) => void;

  addService: (service: Omit<PlatformService, 'id'>) => void;
  updateService: (id: string, updates: Partial<PlatformService>) => void;

  toasts: ToastMessage[];
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'fengji_v4_dispatch_complete';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [systemMode, setSystemMode] = useState<SystemMode>('open_platform');
  const [activeOpenTab, setActiveOpenTab] = useState<OpenPlatformTab>('merchants');
  const [activeOpTab, setActiveOpTab] = useState<'tasks' | 'dispatches' | 'orders' | 'sync' | 'dashboard' | 'services'>('tasks');
  const [activeTenantTab, setActiveTenantTab] = useState<'new_dispatch' | 'dispatches' | 'order_status' | 'order_data' | 'services'>('dispatches');
  const [currentRole, setCurrentRole] = useState<UserRole>('platform_op');

  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedDispatchId, setSelectedDispatchId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dispatchModalOpenRequested, setDispatchModalOpenRequested] = useState<boolean>(false);

  const initiateNewDispatch = (taskId: string, merchantId: string) => {
    setSelectedMerchantId(merchantId);
    setSelectedTaskId(taskId);
    setDispatchModalOpenRequested(true);
    setActiveOpTab('dispatches');
  };

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persistent / Mock Datasets
  const [merchants, setMerchants] = useState<Merchant[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_merchants`);
    return saved ? JSON.parse(saved) : INITIAL_MERCHANTS;
  });

  const [projects, setProjects] = useState<ProjectRevenue[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_projects`);
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_REVENUES;
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [dispatchRecords, setDispatchRecords] = useState<DispatchRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_dispatches`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 清洗历史缓存中的“下发中”状态，避免出现悬挂的下发中历史记录
          return parsed.map((d: any) =>
            d.status === '下发中' || d.status === '正在下发中' ? { ...d, status: '全部成功' } : d
          );
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_DISPATCH_RECORDS;
  });

  const [orders, setOrders] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length >= INITIAL_ORDERS.length) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_ORDERS;
  });

  const [services, setServices] = useState<PlatformService[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_services`);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_logs`);
    return saved ? JSON.parse(saved) : INITIAL_SYNC_LOGS;
  });

  const [openApps, setOpenApps] = useState<OpenPlatformApp[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_open_apps`);
    return saved ? JSON.parse(saved) : INITIAL_OPEN_APPS;
  });

  const [apiDocs, setApiDocs] = useState<OpenPlatformApiDoc[]>(() => {
    return INITIAL_API_DOCS;
  });

  const [gatewayLogs, setGatewayLogs] = useState<ApiGatewayLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_gateway_logs`);
    return saved ? JSON.parse(saved) : INITIAL_GATEWAY_LOGS;
  });

  // Tenant Authentication state
  const [currentTenant, setCurrentTenant] = useState<Merchant | null>(() => {
    return merchants.find((m) => m.id === 'M-1001') || merchants[0] || null;
  });
  const [isTenantLoggedIn, setIsTenantLoggedIn] = useState<boolean>(true);
  const [tenantToken, setTenantToken] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_tenant_token`) || 'fj_tk_init_demo_98234';
  });
  const [tenantTokenExpiry, setTenantTokenExpiry] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tenant_token_exp`);
    if (saved) return saved;
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_merchants`, JSON.stringify(merchants));
  }, [merchants]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_projects`, JSON.stringify(projects));
  }, [projects]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_dispatches`, JSON.stringify(dispatchRecords));
  }, [dispatchRecords]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_services`, JSON.stringify(services));
  }, [services]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify(syncLogs));
  }, [syncLogs]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_open_apps`, JSON.stringify(openApps));
  }, [openApps]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_gateway_logs`, JSON.stringify(gatewayLogs));
  }, [gatewayLogs]);

  // 确保系统始终拥有涵盖全部状态（下发中、全部成功、部分成功、失败）的高保真 Mock 数据
  useEffect(() => {
    const hasPartial = dispatchRecords.some((d) => d.status === '部分成功');
    const hasDispatching = dispatchRecords.some((d) => d.status === '下发中');
    const hasFailed = dispatchRecords.some((d) => d.status === '失败');
    if (!hasPartial || !hasDispatching || !hasFailed || dispatchRecords.length < INITIAL_DISPATCH_RECORDS.length) {
      setDispatchRecords(INITIAL_DISPATCH_RECORDS);
      setOrders(INITIAL_ORDERS);
    }
  }, []);

  // Recalculate task stats dynamically
  useEffect(() => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        const taskOrders = orders.filter((o) => o.taskId === t.id);
        const completed = taskOrders.filter((o) => o.status === 'completed' || o.status === 'outer_auditing_waiting' || o.status === 'inner_auditing_pass').length;
        let derivedStatus: TaskStatus = t.status;
        const hasReadyChannel = Object.values(t.channelConfigs).some(
          (c: any) => c && c.templateUploaded && (c.orderType || c.channel === '无需配置（自主能力）')
        );

        if (t.status === '待配置' && hasReadyChannel) {
          derivedStatus = '已生效';
        }

        return {
          ...t,
          orderCount: Math.max(t.orderCount, taskOrders.length),
          completedCount: completed,
          status: derivedStatus,
        };
      })
    );
  }, [orders.length]);

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const tenantLogin = (phone: string, code: string) => {
    if (!code || code.trim().length !== 6) {
      return { success: false, message: '请输入6位有效数字验证码' };
    }
    const merchant = merchants.find((m) => m.adminPhone === phone.trim());
    if (!merchant) {
      return { success: false, message: '未找到该手机号绑定的商户管理员账号，请联系运营人员' };
    }
    if (merchant.status === '冻结') {
      return { success: false, message: '商户已被冻结' };
    }
    const token = 'fj_token_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
    setTenantToken(token);
    setTenantTokenExpiry(expiryDate);
    localStorage.setItem(`${STORAGE_KEY}_tenant_token`, token);
    localStorage.setItem(`${STORAGE_KEY}_tenant_token_exp`, expiryDate);

    setCurrentTenant(merchant);
    setIsTenantLoggedIn(true);
    setCurrentRole('tenant_admin');
    showToast('登录成功', `欢迎回来，${merchant.adminName}（${merchant.name}）`, 'success');
    return { success: true, message: '登录成功' };
  };

  const tenantLogout = () => {
    setIsTenantLoggedIn(false);
    setTenantToken('');
    setTenantTokenExpiry('');
    localStorage.removeItem(`${STORAGE_KEY}_tenant_token`);
    localStorage.removeItem(`${STORAGE_KEY}_tenant_token_exp`);
    showToast('已安全退出', '您已退出丰迹租户端系统', 'info');
  };

  const switchTenantDirectly = (merchantId: string) => {
    const m = merchants.find((item) => item.id === merchantId);
    if (m) {
      if (m.status === '冻结') {
        showToast('商户已被冻结', `${m.name} 当前处于冻结状态，无法登录租户端`, 'error');
        return;
      }
      const token = 'fj_token_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
      setTenantToken(token);
      setTenantTokenExpiry(expiryDate);
      localStorage.setItem(`${STORAGE_KEY}_tenant_token`, token);
      localStorage.setItem(`${STORAGE_KEY}_tenant_token_exp`, expiryDate);

      setCurrentTenant(m);
      setIsTenantLoggedIn(true);
      showToast('已切换租户', `当前租户：${m.name}`, 'info');
    }
  };

  // Merchant operations
  const addMerchant = (data: Omit<Merchant, 'id' | 'createdAt' | 'updatedAt' | 'taskCount' | 'status'>) => {
    const exists = merchants.some((m) => m.name.trim() === data.name.trim());
    if (exists) {
      showToast('创建失败', '商户名称已存在，不能重复创建', 'error');
      return;
    }
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newMerchant: Merchant = {
      ...data,
      id: `M-${1000 + merchants.length + 1}`,
      status: '正常',
      createdAt: now,
      updatedAt: now,
      taskCount: 0,
    };
    setMerchants((prev) => [newMerchant, ...prev]);
    showToast('商户创建成功', `商户 ${data.name} 已生成管理员账号 ${data.adminPhone}`, 'success');
  };

  const updateMerchant = (id: string, updates: Partial<Merchant>) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: now } : m))
    );
    showToast('修改成功', '商户信息已更新', 'success');
  };

  const toggleFreezeMerchant = (id: string) => {
    const target = merchants.find((m) => m.id === id);
    if (!target) return;
    const nextStatus = target.status === '正常' ? '冻结' : '正常';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: nextStatus, updatedAt: now } : m))
    );
    if (nextStatus === '冻结' && currentTenant?.id === id) {
      setIsTenantLoggedIn(false);
    }
    showToast(
      nextStatus === '冻结' ? '商户已冻结' : '商户已解冻',
      `商户 ${target.name} ${nextStatus === '冻结' ? '将无法登录租户端' : '已恢复正常使用权限'}`,
      nextStatus === '冻结' ? 'warning' : 'success'
    );
  };

  // Project Management
  const addProject = (project: Omit<ProjectRevenue, 'id'>) => {
    const newId = `PRJ-${Date.now().toString().slice(-6)}`;
    setProjects((prev) => [{ id: newId, ...project }, ...prev]);
    showToast('项目新增成功', `${project.projectName} 确收金额 ¥${project.confirmedAmount.toLocaleString()}`, 'success');
  };

  const updateProjectAmount = (id: string, newAmount: number) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, confirmedAmount: newAmount } : p))
    );
    showToast('确收金额更新成功', `金额已调整为 ¥${newAmount.toLocaleString()}`, 'success');
  };

  const batchImportProjects = (imported: Array<Partial<ProjectRevenue>>) => {
    let successCount = 0;
    let failCount = 0;
    const newItems: ProjectRevenue[] = [];

    imported.forEach((row, idx) => {
      if (!row.projectName && !row.merchantName && !row.productName) {
        failCount++;
        return;
      }
      const item: ProjectRevenue = {
        id: `PRJ-${Date.now().toString().slice(-5)}${idx}`,
        productName: row.productName || '丰迹',
        merchantId: row.merchantId || (merchants.find((m) => m.name === row.merchantName)?.id || 'M-1001'),
        merchantName: row.merchantName || '深圳顺意优选连锁有限公司',
        projectName: row.projectName || `导入项目-${idx + 1}`,
        projectCode: row.projectCode || `IMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
        taskName: row.taskName || '巡检专项',
        confirmedAmount: Number(row.confirmedAmount) || 50000,
        confirmedDate: row.confirmedDate || new Date().toISOString().substring(0, 10),
      };
      newItems.push(item);
      successCount++;
    });

    setProjects((prev) => [...newItems, ...prev]);
    showToast('项目导入完成', `成功导入 ${successCount} 条，失败 ${failCount} 条`, successCount > 0 ? 'success' : 'warning');
    return { successCount, failCount };
  };

  // Task Management
  const addTask = (data: { name: string; merchantId: string; type: string; deadline?: string }) => {
    const merchant = merchants.find((m) => m.id === data.merchantId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const taskId = `TASK-${Date.now().toString().slice(-8)}`;

    const newTask: TaskItem = {
      id: taskId,
      name: data.name,
      merchantId: data.merchantId,
      merchantName: merchant?.name || '未知商户',
      type: data.type,
      status: '待配置',
      orderCount: 0,
      completedCount: 0,
      deadline: data.deadline || '2026-12-31',
      createdAt: now,
      responsiblePerson: '运营专员-李雷',
      channelConfigs: {
        丰创: {
          channel: '丰创',
          orderType: '',
          templateUploaded: false,
        },
        顺丰同城: {
          channel: '顺丰同城',
          orderType: '',
          templateUploaded: false,
        },
      },
      serviceConfig: {
        preValidationService: '地址精确度校验',
        valueAddedService: '短信触达',
        freeTrialCount: 0,
      },
    };

    setTasks((prev) => [newTask, ...prev]);
    setMerchants((prev) =>
      prev.map((m) => (m.id === data.merchantId ? { ...m, taskCount: m.taskCount + 1 } : m))
    );
    showToast('任务创建成功', `任务状态为【待配置】，请在任务详情中配置渠道编码和上传下单模板`, 'success');
    return taskId;
  };

  const batchImportTasks = (tasksList: Array<{ name: string; merchantName: string; type: string; deadline?: string; channelCodeJson?: string }>) => {
    let successCount = 0;
    let failCount = 0;
    const newTaskList: TaskItem[] = [];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    tasksList.forEach((row, idx) => {
      if (!row.name || !row.merchantName) {
        failCount++;
        return;
      }
      const targetMerchant = merchants.find((m) => m.name.includes(row.merchantName) || row.merchantName.includes(m.name)) || merchants[0];
      let parsedChannelOrderType = '';
      if (row.channelCodeJson) {
        try {
          const parsed = JSON.parse(row.channelCodeJson);
          parsedChannelOrderType = parsed.fengchuang?.orderType || parsed.orderType || '';
        } catch {
          parsedChannelOrderType = row.channelCodeJson;
        }
      }

      const tId = `TASK-IMP-${Date.now().toString().slice(-5)}${idx}`;
      const task: TaskItem = {
        id: tId,
        name: row.name,
        merchantId: targetMerchant.id,
        merchantName: targetMerchant.name,
        type: row.type || '巡检',
        status: '待配置',
        orderCount: 0,
        completedCount: 0,
        deadline: row.deadline || '2026-11-30',
        createdAt: now,
        responsiblePerson: '批量导入自动分配',
        channelConfigs: {
          丰创: {
            channel: '丰创',
            orderType: parsedChannelOrderType,
            templateUploaded: false,
          },
          顺丰同城: {
            channel: '顺丰同城',
            orderType: '',
            templateUploaded: false,
          },
        },
        serviceConfig: {
          preValidationService: '地址精确度校验',
          valueAddedService: '短信触达',
          freeTrialCount: 10,
        },
      };
      newTaskList.push(task);
      successCount++;
    });

    setTasks((prev) => [...newTaskList, ...prev]);
    showToast('批量导入任务完成', `成功导入 ${successCount} 个任务，状态均为【待配置】，请补充上传渠道模板`, successCount > 0 ? 'success' : 'warning');
    return { successCount, failCount };
  };

  const updateTaskChannelConfig = (taskId: string, channel: string, orderType: string, templateFile?: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentChannel = t.channelConfigs[channel] || { channel, orderType: '', templateUploaded: false };
        const updatedConfig = {
          ...currentChannel,
          orderType: channel === '无需配置（自主能力）' ? '无需配置' : (orderType || currentChannel.orderType),
          templateFile: templateFile || currentChannel.templateFile || `${t.name}_${channel}_下单模板.xlsx`,
          templateUploaded: true,
          lastUpdated: now,
        };

        const newChannelConfigs = {
          ...t.channelConfigs,
          [channel]: updatedConfig,
        };

        const isNowReady = Object.values(newChannelConfigs).some(
          (c: any) => c && c.templateUploaded && (c.orderType || c.channel === '无需配置（自主能力）')
        );

        return {
          ...t,
          channelConfigs: newChannelConfigs,
          status: isNowReady && t.status === '待配置' ? '已生效' : t.status,
        };
      })
    );
    showToast(
      '渠道配置已保存',
      channel === '无需配置（自主能力）'
        ? '已设置为自主能力模式，任务已处于【已生效】状态，租户可正常下单'
        : `${channel} 渠道编码及下单模板配置成功，任务已处于【已生效】状态，租户可正常下单`,
      'success'
    );
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
    if (status === '已失效') {
      showToast('任务已置为失效', '该任务已失效，租户端将无法再针对此任务下单', 'warning');
    } else if (status === '已生效') {
      showToast('任务已恢复生效', '任务已处于【已生效】状态，租户端可正常下单', 'success');
    } else {
      showToast('任务状态已变更', `任务状态已变更为【${status}】`, 'info');
    }
  };

  const updateTaskServiceConfig = (
    taskId: string,
    config: {
      preValidationServices?: string[];
      valueAddedServices?: string[];
      serviceQuotas?: Record<string, number>;
      preValidationService?: string;
      valueAddedService?: string;
      freeTrialCount?: number;
    }
  ) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, serviceConfig: { ...t.serviceConfig, ...config } } : t))
    );
    showToast('服务配置已更新', '前置校验与增值服务及各服务免费体验配额已生效', 'success');
  };

  // Dispatch & Orders Creation
  const createDispatchRecord = (payloadOrTaskId: any, ...args: any[]) => {
    let merchantId = '';
    let taskId = '';
    let channel = '丰创';
    let items: Array<{ contactName: string; contactPhone: string; contactCompany: string; address: string }> = [];
    let immediateDispatch = false;
    let creatorRole: '运营' | '租户' = '租户';
    let creatorName = '';

    if (typeof payloadOrTaskId === 'object' && payloadOrTaskId !== null) {
      merchantId = payloadOrTaskId.merchantId || (currentTenant?.id || 'M-1001');
      taskId = payloadOrTaskId.taskId || '';
      channel = payloadOrTaskId.channel || '丰创';
      items = payloadOrTaskId.items || [];
      immediateDispatch = !!payloadOrTaskId.immediateDispatch;
      creatorRole = payloadOrTaskId.creatorRole || '租户';
      creatorName = payloadOrTaskId.creatorName || '';
    } else {
      // Positional compatibility: (taskId, taskName, channel, items, immediate)
      taskId = payloadOrTaskId || '';
      const taskObj = tasks.find((t) => t.id === taskId);
      merchantId = taskObj?.merchantId || (currentTenant?.id || 'M-1001');
      channel = typeof args[1] === 'string' ? args[1] : '丰创';
      items = Array.isArray(args[2]) ? args[2] : (Array.isArray(args[1]) ? args[1] : []);
      immediateDispatch = Boolean(args[3] ?? args[2]);
    }

    const merchant = merchants.find((m) => m.id === merchantId) || currentTenant;
    const task = tasks.find((t) => t.id === taskId);
    const dispatchId = `DP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const channelOrderType = task?.channelConfigs[channel]?.orderType || 'ord-fengchuang-std';

    const newDispatch: DispatchRecord = {
      id: dispatchId,
      batchNo: dispatchId,
      merchantId: merchantId || 'M-1001',
      merchantName: merchant?.name || '未知商户',
      taskId,
      taskName: task?.name || '未知任务',
      channel,
      channelCode: channelOrderType,
      orderCount: items.length,
      totalCount: items.length,
      successCount: 0,
      failureCount: 0,
      failedCount: 0,
      status: '下发中',
      createdAt: now,
      creator: creatorName || (creatorRole === '租户' ? merchant?.adminName || '租户管理员' : '运营专员-李雷'),
      createdBy: creatorName || (creatorRole === '租户' ? merchant?.adminName || '租户管理员' : '运营专员-李雷'),
      creatorRole,
    };

    const newOrders: OrderItem[] = items.map((item, index) => {
      const oId = `FJ-ORD-${dispatchId.replace('DP-', '')}-${String(index + 1).padStart(3, '0')}`;
      return {
        id: oId,
        dispatchId,
        dispatchBatchNo: dispatchId,
        merchantId: merchantId || 'M-1001',
        merchantName: merchant?.name || '未知商户',
        taskId,
        taskName: task?.name || '未知任务',
        channel,
        status: 'created',
        contactName: item.contactName,
        contactPhone: item.contactPhone,
        contactCompany: item.contactCompany,
        address: item.address,
        createdAt: now,
        updatedAt: now,
        operateTimes: {
          created: now,
        },
        routeInfo: {
          stationName: item.address.includes('北京') ? '顺丰速运-朝阳大悦城营业部' : '顺丰速运-深圳南山科技园营业部',
          courierName: '待网格分配',
          courierPhone: '4008-111-111',
        },
      };
    });

    setDispatchRecords((prev) => [newDispatch, ...prev]);
    setOrders((prev) => [...newOrders, ...prev]);

    showToast('下单记录已生成', `下单流水号 ${dispatchId}，共 ${items.length} 个网点，状态【下发中】`, 'success');

    if (immediateDispatch) {
      setTimeout(() => {
        executeDispatch(dispatchId);
      }, 500);
    }

    return dispatchId;
  };

  // Execute Dispatch to Fengchuang Engine
  const executeDispatch = (dispatchId: string) => {
    setDispatchRecords((prev) =>
      prev.map((d) => (d.id === dispatchId ? { ...d, status: '下发中' } : d))
    );
    showToast('正在下发到渠道', `正在下发至顺丰网格任务池...`, 'info');

    setTimeout(() => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      let successCount = 0;
      let failureCount = 0;

      setOrders((prevOrders) =>
        prevOrders.map((o) => {
          if (o.dispatchId !== dispatchId || o.status !== 'created') return o;
          // Randomly simulate 90% success, 10% failure for realistic feedback
          const isSuccess = Math.random() > 0.15;
          if (isSuccess) {
            successCount++;
            const fcOrderId = `FC-ORDER-${Math.floor(8000000 + Math.random() * 1999999)}`;
            return {
              ...o,
              channelOrderId: fcOrderId,
              status: 'waiting_assign',
              updatedAt: now,
              operateTimes: {
                ...o.operateTimes,
                waiting_assign: now,
              },
              routeInfo: {
                stationName: o.address.includes('北京') ? '顺丰速运-朝阳大悦城营业点' : '顺丰速运-深圳南山科技园营业部',
                courierName: '分配中...',
                courierPhone: '待接单',
              },
            };
          } else {
            failureCount++;
            return {
              ...o,
              status: 'cancelled',
              failureReason: '渠道网格服务校验未通过：联系人电话格式异常或POI地址超出服务半径',
              updatedAt: now,
            };
          }
        })
      );

      setDispatchRecords((prev) =>
        prev.map((d) => {
          if (d.id !== dispatchId) return d;
          const safeOrderCount = d.orderCount ?? d.totalCount ?? 0;
          const totalSuccess = (d.successCount || 0) + successCount;
          const totalFail = Math.max(0, safeOrderCount - totalSuccess);
          let finalStatus: DispatchRecord['status'] = '全部成功';
          if (totalFail === 0) finalStatus = '全部成功';
          else if (totalSuccess > 0) finalStatus = '部分成功';
          else finalStatus = '失败';

          return {
            ...d,
            orderCount: safeOrderCount,
            totalCount: safeOrderCount,
            successCount: totalSuccess,
            failureCount: totalFail,
            failedCount: totalFail,
            status: finalStatus,
          };
        })
      );

      // Add Sync Log
      const logId = `SYNC-DISPATCH-${Date.now().toString().slice(-6)}`;
      setSyncLogs((prev) => [
        {
          id: logId,
          type: '订单状态',
          timestamp: now,
          status: '成功',
          payload: `{"action": "batch_dispatch", "dispatchId": "${dispatchId}", "targetChannel": "丰创", "orderCount": ${successCount + failureCount}}`,
          response: `{"code": 200, "success": ${successCount}, "failure": ${failureCount}, "msg": "丰创执行引擎已接入任务池"}`,
        },
        ...prev,
      ]);

      showToast(
        '下发结果通知',
        `下发完毕：成功 ${successCount} 单进入待接单池，失败 ${failureCount} 单`,
        failureCount > 0 ? 'warning' : 'success'
      );
    }, 1200);
  };

  // Retry Failed Dispatch Orders
  const retryFailedDispatchOrders = (dispatchId: string) => {
    showToast('重新下发', `正在重试下发流水号 ${dispatchId} 的失败工单...`, 'info');
    setTimeout(() => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      let recovered = 0;

      setOrders((prev) =>
        prev.map((o) => {
          if (o.dispatchId === dispatchId && (o.status === 'created' || o.status === 'cancelled') && o.failureReason) {
            recovered++;
            const fcOrderId = `FC-ORDER-${Math.floor(8000000 + Math.random() * 1999999)}`;
            return {
              ...o,
              channelOrderId: fcOrderId,
              status: 'waiting_assign',
              failureReason: undefined,
              updatedAt: now,
              operateTimes: {
                ...o.operateTimes,
                waiting_assign: now,
              },
              routeInfo: {
                stationName: '顺丰速运-重新调度服务网格站',
                courierName: '分配中...',
                courierPhone: '待接单',
              },
            };
          }
          return o;
        })
      );

      setDispatchRecords((prev) =>
        prev.map((d) => {
          if (d.id !== dispatchId) return d;
          const orderCnt = d.orderCount ?? d.totalCount ?? 0;
          return {
            ...d,
            orderCount: orderCnt,
            totalCount: orderCnt,
            successCount: orderCnt,
            failureCount: 0,
            failedCount: 0,
            status: '全部成功',
          };
        })
      );

      showToast('重试成功', `已成功重新下发 ${recovered} 个失败工单并生成丰创渠道订单号`, 'success');
    }, 1000);
  };

  // Update order (only if waiting_assign)
  const updateOrder = (orderId: string, updates: { contactName: string; contactPhone: string; contactCompany: string; address: string }) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: '未找到该订单' };
    if (order.status !== 'waiting_assign' && order.status !== 'created') {
      return { success: false, message: '只有状态为【待接单】或【待下发】的订单可以修改' };
    }
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updates, updatedAt: now } : o))
    );
    showToast('订单修改成功', '已调用渠道适配器更新联系人与地址信息', 'success');
    return { success: true, message: '修改成功' };
  };

  // Cancel order (only if waiting_assign)
  const cancelOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: '未找到该订单' };
    if (order.status !== 'waiting_assign' && order.status !== 'created') {
      return { success: false, message: '只有状态为【待接单】或【待下发】的订单可以取消，已执行工单不可取消' };
    }
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'cancelled',
              updatedAt: now,
              operateTimes: { ...o.operateTimes, cancelled: now },
            }
          : o
      )
    );
    showToast('订单已取消', `订单 ${orderId} 已向丰创发送取消通知`, 'warning');
    return { success: true, message: '订单取消成功' };
  };

  // Remind courier / dispatch center for urgent order
  const remindOrderCourier = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              lastRemindedAt: now,
              updatedAt: now,
            }
          : o
      )
    );
    showToast('加急催单指令已下发', `已向顺丰运力网格调度中心与承运小哥发送加急催单消息 (工单: ${orderId})`, 'success');
  };

  // Reassign order / re-route
  const reassignOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newCouriers = ['王志强（工号 SF07712）', '赵云鹏（工号 SF02981）', '孙海涛（工号 SF06621）'];
    const chosen = newCouriers[Math.floor(Math.random() * newCouriers.length)];

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'assigned_assign',
              routeInfo: {
                stationName: o.routeInfo?.stationName || '顺丰速运·区域直属调度部',
                courierName: chosen,
                courierPhone: '139' + Math.floor(10000000 + Math.random() * 90000000),
              },
              isTimeoutUnassigned: false,
              isExecutionStalled: false,
              anomalySeverity: 'none',
              anomalyTags: o.anomalyTags?.filter((t) => !t.includes('超时') && !t.includes('滞留')),
              updatedAt: now,
              operateTimes: {
                ...o.operateTimes,
                assigned_assign: now,
              },
            }
          : o
      )
    );
    showToast('重新指派成功', `工单 ${orderId} 已重新调度指派至小哥【${chosen}】`, 'success');
  };

  // Resubmit for audit
  const resubmitOrderAudit = (orderId: string, remark?: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'inner_auditing_waiting',
              anomalySeverity: 'low',
              anomalyTags: ['已补充证据材料', '质检复议中'],
              updatedAt: now,
              operateTimes: {
                ...o.operateTimes,
                inner_auditing_waiting: now,
              },
            }
          : o
      )
    );
    showToast('复核提交成功', `工单 ${orderId} 已提交至内审质检队列重新复核 ${remark ? `(${remark})` : ''}`, 'success');
  };

  // 两端协同：审核通过 (平台内审 或 租户外审)
  const auditPassOrder = (orderId: string, type: 'inner' | 'outer') => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (type === 'inner') {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'outer_auditing_waiting',
                updatedAt: now,
                operateTimes: {
                  ...o.operateTimes,
                  inner_auditing_pass: now,
                  outer_auditing_waiting: now,
                },
                routingLogs: [
                  ...(o.routingLogs || []),
                  {
                    id: `RL-${Date.now()}-1`,
                    time: now.substring(5, 16),
                    title: '内审中',
                    subTitle: '平台运营质检通过，已流转至商户外审验收队列',
                    statusType: 'success',
                    iconType: 'inner_audit',
                  },
                  {
                    id: `RL-${Date.now()}-2`,
                    time: now.substring(5, 16),
                    title: '外审中',
                    subTitle: '已通知租户/商户进行结果验收',
                    statusType: 'info',
                    iconType: 'outer_audit',
                  },
                ],
              }
            : o
        )
      );
      showToast('平台内审质检通过', `工单 ${orderId} 已内审通过并自动流转给商户端外审验收`, 'success');
    } else {
      // 租户外审确认通过 -> 直接归档为已完成
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'completed',
                updatedAt: now,
                operateTimes: {
                  ...o.operateTimes,
                  outer_auditing_pass: now,
                  completed: now,
                },
                routingLogs: [
                  ...(o.routingLogs || []),
                  {
                    id: `RL-${Date.now()}-1`,
                    time: now.substring(5, 16),
                    title: '外审中',
                    subTitle: '租户客户审核通过，取证成果确认合格',
                    statusType: 'success',
                    iconType: 'outer_audit',
                  },
                  {
                    id: `RL-${Date.now()}-2`,
                    time: now.substring(5, 16),
                    title: '已完成',
                    subTitle: '全链路履约完结，订单归档完成',
                    statusType: 'completed' as any,
                    iconType: 'completed',
                  },
                ],
              }
            : o
        )
      );
      showToast('商户外审验收通过', `工单 ${orderId} 已完成最终客户验收，工单顺利结案归档！`, 'success');
    }
  };

  // 两端协同：审核驳回
  const auditRejectOrder = (
    orderId: string,
    payload: { stage: '内审质检' | '客户外审'; reason: string; auditor?: string; suggestedAction?: string }
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const rejectItem = {
      id: `REJ-${Date.now().toString().slice(-6)}`,
      time: now,
      stage: payload.stage,
      reason: payload.reason,
      auditor: payload.auditor || (payload.stage === '内审质检' ? '平台质检员' : '商户管理员'),
      suggestedAction: payload.suggestedAction || '要求现场外勤员补拍清晰门头及门牌号照片重新上传',
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'processing_start', // 驳回至现场执行阶段
              auditRejectCount: (o.auditRejectCount || 0) + 1,
              auditRejectHistory: [rejectItem, ...(o.auditRejectHistory || [])],
              anomalySeverity: 'high',
              anomalyTags: Array.from(new Set([...(o.anomalyTags || []), `${payload.stage}驳回`, '待补充取证'])),
              updatedAt: now,
              routingLogs: [
                ...(o.routingLogs || []),
                {
                  id: `RL-${Date.now()}`,
                  time: now.substring(5, 16),
                  title: payload.stage === '内审质检' ? '内审中' : '外审中',
                  subTitle: `订单审核被驳回：${payload.reason} (要求重新现场作业补采)`,
                  statusType: 'reject',
                  iconType: 'inner_audit',
                },
              ],
            }
          : o
      )
    );
    showToast(
      `${payload.stage}已驳回`,
      `工单 ${orderId} 驳回指令已下达，已通知顺丰现场外勤员按要求补采材料`,
      'warning'
    );
  };
  const simulateStepOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const courierNames = ['张立国（工号 SF08819）', '李志鹏（工号 SF03241）', '王超凡（工号 SF09923）', '陈晨（工号 SF01188）'];
    const selectedCourier = courierNames[Math.floor(Math.random() * courierNames.length)];

    let nextStatus: OrderStatusCode = order.status;
    let extraData: Partial<OrderItem> = {};

    switch (order.status) {
      case 'created':
        nextStatus = 'waiting_assign';
        extraData = {
          channelOrderId: `FC-ORDER-${Math.floor(8000000 + Math.random() * 1999999)}`,
          operateTimes: { ...order.operateTimes, waiting_assign: now },
        };
        break;
      case 'waiting_assign':
        nextStatus = 'assigned_assign';
        extraData = {
          routeInfo: {
            stationName: order.address.includes('北京') ? '顺丰速运-朝阳大悦城营业部' : '顺丰速运-深圳南山科技园营业部',
            courierName: selectedCourier,
            courierPhone: '139' + Math.floor(10000000 + Math.random() * 90000000),
          },
          operateTimes: { ...order.operateTimes, assigned_assign: now },
        };
        break;
      case 'assigned_assign':
        nextStatus = 'processing_start';
        extraData = {
          operateTimes: { ...order.operateTimes, processing_start: now },
        };
        break;
      case 'processing_start':
        nextStatus = 'processing_complete';
        extraData = {
          operateTimes: { ...order.operateTimes, processing_complete: now },
          evidenceData: {
            photos: [
              'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=800&auto=format&fit=crop&q=80',
            ],
            videos: [
              {
                title: '外立面巡检全景录像',
                duration: '00:45',
                url: 'https://assets.mixkit.co/videos/preview/mixkit-supermarket-shelves-full-of-food-items-41221-large.mp4',
              },
            ],
            answers: [
              { label: '门店招牌完好度', value: '完好且正常亮灯' },
              { label: '促销物料铺设位置', value: '主入口玻璃橱窗醒目位置' },
              { label: '核验结果', value: '核验通过，现场合规' },
            ],
          },
          locationInfo: {
            address: order.address,
            latitude: 22.5312 + Math.random() * 0.05,
            longitude: 113.9538 + Math.random() * 0.05,
            collectTime: now,
          },
        };
        break;
      case 'processing_complete':
        nextStatus = 'inner_auditing_waiting';
        extraData = {
          operateTimes: { ...order.operateTimes, inner_auditing_waiting: now },
        };
        break;
      case 'inner_auditing_waiting':
        nextStatus = 'inner_auditing_pass';
        extraData = {
          operateTimes: { ...order.operateTimes, inner_auditing_pass: now },
        };
        break;
      case 'inner_auditing_pass':
        nextStatus = 'outer_auditing_waiting';
        extraData = {
          operateTimes: { ...order.operateTimes, outer_auditing_waiting: now },
        };
        break;
      case 'outer_auditing_waiting':
        nextStatus = 'outer_auditing_pass';
        extraData = {
          operateTimes: { ...order.operateTimes, outer_auditing_pass: now },
        };
        break;
      case 'outer_auditing_pass':
        nextStatus = 'completed';
        extraData = {
          operateTimes: { ...order.operateTimes, completed: now },
        };
        break;
      default:
        showToast('已达最终状态', '该订单执行生命周期已全部完成归档', 'info');
        return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus, updatedAt: now, ...extraData } : o))
    );

    // Push simulated sync log
    const logId = `SYNC-STEP-${Date.now().toString().slice(-6)}`;
    setSyncLogs((prev) => [
      {
        id: logId,
        type: nextStatus === 'processing_complete' ? '订单数据' : '订单状态',
        orderId,
        timestamp: now,
        status: '成功',
        payload: JSON.stringify({ orderId, status: nextStatus, channelOrderId: order.channelOrderId || 'FC-NEW' }),
        response: `{"code": 200, "message": "已流转至【${nextStatus}】并触发数据同步"}`,
      },
      ...prev,
    ]);

    showToast('状态已流转', `订单 ${orderId} 状态推进至【${nextStatus}】`, 'success');
  };

  const simulateAllActiveOrders = () => {
    const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
    if (activeOrders.length === 0) {
      showToast('暂无活跃订单', '所有订单均已完成或取消', 'info');
      return;
    }
    activeOrders.forEach((o) => {
      simulateStepOrder(o.id);
    });
    showToast('批量流转执行中', `已推进 ${activeOrders.length} 个订单状态`, 'success');
  };

  const triggerWebhookPush = (type: '订单数据' | '订单状态', orderId?: string) => {
    const targetOrder = orderId ? orders.find((o) => o.id === orderId) : orders[0];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logId = `SYNC-HOOK-${Date.now().toString().slice(-6)}`;

    const newLog: SyncLog = {
      id: logId,
      type,
      orderId: targetOrder?.id || 'FJ-ORD-DEMO',
      timestamp: now,
      status: '成功',
      payload: JSON.stringify({
        event: type === '订单数据' ? 'evidence_data_callback' : 'order_status_callback',
        channelOrderId: targetOrder?.channelOrderId || 'FC-ORDER-8839201',
        operateTime: now,
        data: type === '订单数据' ? { photos: 3, video: 1, forms: 4 } : { newStatus: 'outer_auditing_waiting' },
      }, null, 2),
      response: '{"code": 200, "message": "鉴权通过，幂等校验成功，已入库"}',
    };

    setSyncLogs((prev) => [newLog, ...prev]);
    showToast('Webhook 回调已接收', `丰创推送【${type}】回调，系统已完成鉴权与幂等入库`, 'success');
  };

  const runIncrementalSync = () => {
    showToast('增量同步启动', '正在请求丰创"已变更订单列表"接口并拉取差异数据...', 'info');
    setTimeout(() => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const logId = `SYNC-INC-${Date.now().toString().slice(-6)}`;
      const log: SyncLog = {
        id: logId,
        type: '增量同步',
        timestamp: now,
        status: '成功',
        payload: '{"syncType": "polling_delta", "window": "last_15_minutes", "channel": "丰创"}',
        response: `{"code": 200, "syncedOrders": ${orders.length}, "reconciled": true, "msg": "所有本地订单与丰创执行引擎数据一致"}`,
      };
      setSyncLogs((prev) => [log, ...prev]);
      showToast('增量同步完成', `已核对 ${orders.length} 条工单，数据已达最新状态`, 'success');
    }, 1200);
  };

  const retrySyncLog = (logId: string) => {
    setSyncLogs((prev) =>
      prev.map((l) =>
        l.id === logId
          ? {
              ...l,
              status: '成功',
              response: '{"code": 200, "message": "手动重试成功，已补齐数据入库"}',
              retried: true,
            }
          : l
      )
    );
    showToast('重试成功', '回调数据已重新解析并入库', 'success');
  };

  const addService = (data: Omit<PlatformService, 'id'>) => {
    const newService: PlatformService = {
      ...data,
      id: `SRV-${100 + services.length + 1}`,
    };
    setServices((prev) => [...prev, newService]);
    showToast('服务新增成功', `服务【${data.name}】已加入服务市场`, 'success');
  };

  const updateService = (id: string, updates: Partial<PlatformService>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    showToast('服务配置更新', '服务信息与接口配置已更新', 'success');
  };

  const addOpenApp = (data: Omit<OpenPlatformApp, 'id' | 'createdAt' | 'lastActiveAt' | 'todayCalls'>) => {
    const newApp: OpenPlatformApp = {
      ...data,
      id: `APP-${1000 + openApps.length + 1}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastActiveAt: '刚刚创建',
      todayCalls: 0,
    };
    setOpenApps((prev) => [newApp, ...prev]);
    showToast('应用创建成功', `开放平台应用【${data.appName}】已创建，已颁发 AppID 与 AppSecret`, 'success');
  };

  const updateOpenApp = (id: string, updates: Partial<OpenPlatformApp>) => {
    setOpenApps((prev) => prev.map((app) => (app.id === id ? { ...app, ...updates } : app)));
    showToast('应用配置已保存', '应用信息、IP 白名单及权限已更新', 'success');
  };

  const toggleAppStatus = (id: string) => {
    setOpenApps((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const next = app.status === '启用' ? '停用' : '启用';
          showToast(`应用已${next}`, `应用【${app.appName}】当前状态为：${next}`, next === '启用' ? 'success' : 'warning');
          return { ...app, status: next };
        }
        return app;
      })
    );
  };

  const regenerateAppSecret = (id: string) => {
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newSecret = `sec_${randomHex}`;
    setOpenApps((prev) => prev.map((app) => (app.id === id ? { ...app, appSecret: newSecret } : app)));
    showToast('密钥重置成功', '旧密钥已立即失效，新 AppSecret 已生效，请在客户端更新配置', 'warning');
    return newSecret;
  };

  const sendWebhookTestPing = async (appId: string): Promise<{ success: boolean; latency: number; responseCode: number; msg: string }> => {
    const targetApp = openApps.find((a) => a.id === appId);
    if (!targetApp || !targetApp.webhookUrl) {
      showToast('推送失败', '未配置有效的 Webhook 回调地址', 'error');
      return { success: false, latency: 0, responseCode: 400, msg: '未配置 Webhook 回调地址' };
    }

    const latency = Math.floor(Math.random() * 45) + 25;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const testLog: ApiGatewayLog = {
      id: `GW-LOG-${Date.now().toString().slice(-6)}`,
      timestamp: now,
      appId: targetApp.appId,
      merchantName: targetApp.merchantName,
      apiPath: targetApp.webhookUrl,
      method: 'POST (Webhook Ping)',
      clientIp: '10.12.88.204 (顺丰开放网关)',
      statusCode: 200,
      latencyMs: latency,
      requestBody: JSON.stringify({
        event: 'TEST_WEBHOOK_PING',
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7),
        data: { message: '顺丰开放平台 Webhook 连通性测试报文' },
      }, null, 2),
      responseBody: JSON.stringify({ code: 200, message: 'Webhook endpoint ACK received' }),
    };

    setGatewayLogs((prev) => [testLog, ...prev]);
    showToast('Webhook 测试推送成功', `目标服务器在 ${latency}ms 内响应 HTTP 200 OK`, 'success');
    return { success: true, latency, responseCode: 200, msg: '目标服务器响应 HTTP 200 OK' };
  };

  const executeApiSandboxTest = async (apiId: string, customHeaders: Record<string, string>, customBody: string): Promise<{ statusCode: number; latency: number; response: string }> => {
    const doc = apiDocs.find((d) => d.id === apiId) || apiDocs[0];
    const latency = Math.floor(Math.random() * 30) + (doc.avgLatency || 35);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let parsedBody: any = {};
    try {
      parsedBody = JSON.parse(customBody);
    } catch {
      parsedBody = { raw: customBody };
    }

    // Generate dynamic realistic response based on apiId
    let simulatedResponse = doc.responseSample;
    if (doc.id === 'API-001') {
      simulatedResponse = JSON.stringify({
        code: 200,
        message: 'success',
        traceId: `SF_TR_${Date.now()}`,
        data: {
          isValid: true,
          status: 'OPERATING',
          statusDesc: '正常营业中',
          confidenceScore: 0.992,
          matchedPoiName: parsedBody.storeName || '顺意优选超市(星河COCOPark店)',
          verifiedCoordinate: {
            latitude: 22.5362,
            longitude: 114.0538,
            coordType: 'GCJ-02',
          },
          lastActiveDeliveryDate: now.substring(0, 10),
          riskFlags: [],
        },
      }, null, 2);
    } else if (doc.id === 'API-002') {
      simulatedResponse = JSON.stringify({
        code: 200,
        message: 'success',
        traceId: `SF_TR_${Date.now()}`,
        data: {
          standardAddress: parsedBody.rawAddress ? `标准解析：${parsedBody.rawAddress}` : '广东省深圳市南山区粤海街道深南大道9668号万象天地LG-18',
          level: 'ROOM_DOORPLATE',
          location: { lat: 22.5408, lng: 113.9535 },
          gridCode: 'SZ-NS-0755-G042',
          responsibleStation: '顺丰速运·深圳南山科技园营业部',
          accuracyLevel: 'A_HIGH_PRECISION',
        },
      }, null, 2);
    }

    const log: ApiGatewayLog = {
      id: `GW-LOG-${Date.now().toString().slice(-6)}`,
      timestamp: now,
      appId: customHeaders['X-SF-AppId'] || 'sf_app_sandbox',
      merchantName: '沙箱联调环境',
      apiPath: doc.path,
      method: doc.method,
      clientIp: '127.0.0.1 (Sandbox)',
      statusCode: 200,
      latencyMs: latency,
      requestBody: customBody,
      responseBody: simulatedResponse,
    };

    setGatewayLogs((prev) => [log, ...prev]);
    return { statusCode: 200, latency, response: simulatedResponse };
  };

  const updateMerchantProductsAndQuota = (merchantId: string, products: string[], quota: number, type: '试用版' | '付费版') => {
    setMerchants((prev) =>
      prev.map((m) =>
        m.id === merchantId
          ? {
              ...m,
              type,
              authorizedProducts: products,
              apiCallsQuota: quota,
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : m
      )
    );
    showToast('商户授权已更新', `已更新产品矩阵【${products.join(', ')}】与配额 ${quota.toLocaleString()} 次`, 'success');
  };

  const resetToDemoData = () => {
    setMerchants(INITIAL_MERCHANTS);
    setProjects(INITIAL_PROJECT_REVENUES);
    setTasks(INITIAL_TASKS);
    setDispatchRecords(INITIAL_DISPATCH_RECORDS);
    setOrders(INITIAL_ORDERS);
    setServices(INITIAL_SERVICES);
    setSyncLogs(INITIAL_SYNC_LOGS);
    setOpenApps(INITIAL_OPEN_APPS);
    setGatewayLogs(INITIAL_GATEWAY_LOGS);
    setCurrentTenant(INITIAL_MERCHANTS[0]);
    setIsTenantLoggedIn(true);
    localStorage.clear();
    showToast('数据已重置', '系统已恢复至预设完整演示数据集', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        systemMode,
        setSystemMode,
        activeOpenTab,
        setActiveOpenTab,
        activeOpPlatformTab: activeOpenTab,
        setActiveOpPlatformTab: setActiveOpenTab,
        activeOpTab,
        setActiveOpTab,
        activeTenantTab,
        setActiveTenantTab,
        currentRole,
        setCurrentRole,
        selectedMerchantId,
        setSelectedMerchantId,
        selectedTaskId,
        setSelectedTaskId,
        selectedDispatchId,
        setSelectedDispatchId,
        selectedOrderId,
        setSelectedOrderId,
        dispatchModalOpenRequested,
        setDispatchModalOpenRequested,
        initiateNewDispatch,
        currentTenant,
        isTenantLoggedIn,
        tenantToken,
        tenantTokenExpiry,
        tenantLogin,
        tenantLogout,
        switchTenantDirectly,
        merchants,
        projects,
        tasks,
        dispatchRecords,
        orders,
        services,
        syncLogs,
        openApps,
        apiDocs,
        gatewayLogs,
        addOpenApp,
        updateOpenApp,
        toggleAppStatus,
        regenerateAppSecret,
        sendWebhookTestPing,
        executeApiSandboxTest,
        updateMerchantProductsAndQuota,
        addMerchant,
        updateMerchant,
        toggleFreezeMerchant,
        addProject,
        updateProjectAmount,
        batchImportProjects,
        addTask,
        batchImportTasks,
        updateTaskChannelConfig,
        updateTaskServiceConfig,
        updateTaskStatus,
        createDispatchRecord,
        executeDispatch,
        retryFailedDispatchOrders,
        updateOrder,
        cancelOrder,
        remindOrderCourier,
        reassignOrder,
        resubmitOrderAudit,
        auditPassOrder,
        auditRejectOrder,
        simulateStepOrder,
        simulateAllActiveOrders,
        triggerWebhookPush,
        runIncrementalSync,
        retrySyncLog,
        addService,
        updateService,
        toasts,
        showToast,
        removeToast,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
