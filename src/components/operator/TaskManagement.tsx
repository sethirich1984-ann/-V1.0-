import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Settings2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Send,
  Building2,
  ChevronRight,
  FileText,
  Zap,
  Check,
  RotateCw,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskItem, TaskStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';

export const TaskManagement: React.FC = () => {
  const {
    tasks,
    merchants,
    services,
    orders,
    addTask,
    batchImportTasks,
    updateTaskChannelConfig,
    updateTaskServiceConfig,
    updateTaskStatus,
    selectedTaskId,
    setSelectedTaskId,
    setActiveOpTab,
    initiateNewDispatch,
    showToast,
  } = useApp();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [merchantFilter, setMerchantFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);
  const [configChannelTaskId, setConfigChannelTaskId] = useState<string | null>(null);
  const [configServiceTaskId, setConfigServiceTaskId] = useState<string | null>(null);

  // Add Task form states
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskMerchantId, setNewTaskMerchantId] = useState(merchants[0]?.id || 'M-1001');
  const [newTaskType, setNewTaskType] = useState('门店巡检');
  const [newTaskDeadline, setNewTaskDeadline] = useState('2026-12-31');

  // Channel Config states
  const [channelSelected, setChannelSelected] = useState<'无需配置（自主能力）' | '丰创' | '顺丰同城'>('无需配置（自主能力）');
  const [channelOrderType, setChannelOrderType] = useState('无需配置');
  const [templateFileName, setTemplateFileName] = useState('自主任务下单模板.xlsx');

  // Service Config states (Multi-Select & Per-Service Quotas)
  const [selectedPreValidationSrvs, setSelectedPreValidationSrvs] = useState<string[]>([]);
  const [selectedValueAddedSrvs, setSelectedValueAddedSrvs] = useState<string[]>([]);
  const [serviceQuotas, setServiceQuotas] = useState<Record<string, number>>({});

  // Service options definition
  const preValidationOptions = useMemo(() => [
    {
      name: '地址精确度校验',
      tag: '顺丰空间智能POI',
      desc: '基于顺丰十亿级地址库核验规范化POI地址与网格覆盖范围，过滤模糊与无效地址',
      defaultQuota: 50,
    },
    {
      name: '门店有效性校验',
      tag: '高德/腾讯POI底图',
      desc: '在线校验门店营业执照定位与空间坐标一致性，确保受检网点处于有效经营状态',
      defaultQuota: 80,
    },
    {
      name: '营业时间校验',
      tag: '动态营业数据库',
      desc: '智能核验巡检网点营业开放窗口，避免小哥非营业时段上门跑空',
      defaultQuota: 20,
    },
    {
      name: '商户真实性核验',
      tag: '全国企业信用系统',
      desc: '对接国家企业信用信息公示系统，校验企业资质状态与统一社会信用代码',
      defaultQuota: 30,
    },
  ], []);

  const valueAddedOptions = useMemo(() => [
    {
      name: '选址评估',
      tag: '顺丰时空大数据AI',
      desc: '结合网点周边3公里人流、商圈热力与物流可达性生成综合选址可行性评估',
      defaultQuota: 2,
    },
    {
      name: '周边竞品分析',
      tag: '行业竞争情报分析',
      desc: '基于地理围栏自动探测网点周围同类竞品分布密度与竞对策略分析简报',
      defaultQuota: 5,
    },
    {
      name: '智能报表生成',
      tag: 'AI巡检画像汇总',
      desc: '自动聚合网点照片、评分、问题点并由大模型生成图文并茂的巡检分析总结报告',
      defaultQuota: 10,
    },
  ], []);

  // Batch import mock rows
  const [batchImportRows, setBatchImportRows] = useState<Array<{ name: string; merchantName: string; type: string; deadline: string; channelCodeJson: string }>>([
    {
      name: '华东区零售门店合规巡检专项',
      merchantName: '深圳顺意优选连锁有限公司',
      type: '门店巡检',
      deadline: '2026-12-15',
      channelCodeJson: '{"fengchuang": {"orderType": "ord-fc-inspect-2026"}}',
    },
    {
      name: '北京大悦城商圈堆头核验',
      merchantName: '北京华联智选零售科技有限责任公司',
      type: '促销核验',
      deadline: '2026-11-20',
      channelCodeJson: '{"fengchuang": {"orderType": "ord-fc-promo-std"}}',
    },
  ]);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [statusChangeModalTask, setStatusChangeModalTask] = useState<TaskItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<TaskStatus>('已生效');

  // Multi-select toggle
  const toggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSelectAllTasks = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  const handleBatchStatusChange = (status: TaskStatus) => {
    if (selectedTaskIds.length === 0) return;
    selectedTaskIds.forEach((id) => {
      updateTaskStatus(id, status);
    });
    showToast(
      '批量状态变更成功',
      `已将选中的 ${selectedTaskIds.length} 个任务状态统一变更为【${status}】`,
      status === '已生效' ? 'success' : 'warning'
    );
    setSelectedTaskIds([]);
  };

  const handleConfirmStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusChangeModalTask) return;
    updateTaskStatus(statusChangeModalTask.id, targetStatus);
    setStatusChangeModalTask(null);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.merchantName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchMerchant = merchantFilter === 'all' || t.merchantId === merchantFilter;
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      return matchSearch && matchStatus && matchMerchant && matchType;
    });
  }, [tasks, searchTerm, statusFilter, merchantFilter, typeFilter]);

  // Active Task for Detailed inspection
  const activeTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const activeTaskOrders = useMemo(() => {
    if (!activeTask) return [];
    return orders.filter((o) => o.taskId === activeTask.id);
  }, [orders, activeTask]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) {
      showToast('表单错误', '请输入任务名称', 'error');
      return;
    }
    const createdId = addTask({
      name: newTaskName.trim(),
      merchantId: newTaskMerchantId,
      type: newTaskType,
      deadline: newTaskDeadline,
    });
    setIsAddModalOpen(false);
    setNewTaskName('');
    // Automatically prompt to configure channel
    setConfigChannelTaskId(createdId);
  };

  const handleBatchImportSubmit = () => {
    batchImportTasks(batchImportRows);
    setIsBatchImportModalOpen(false);
  };

  const openChannelConfig = (task: TaskItem) => {
    setConfigChannelTaskId(task.id);
    if (task.channelConfigs['无需配置（自主能力）']) {
      setChannelSelected('无需配置（自主能力）');
      setChannelOrderType('无需配置');
      setTemplateFileName(task.channelConfigs['无需配置（自主能力）']?.templateFile || `${task.name}_自主下单模板.xlsx`);
    } else if (task.channelConfigs['丰创']) {
      const existing = task.channelConfigs['丰创'];
      setChannelSelected('丰创');
      setChannelOrderType(existing?.orderType || 'ord-fengchuang-retail-v1');
      setTemplateFileName(existing?.templateFile || `${task.name}_丰创下单模板.xlsx`);
    } else {
      setChannelSelected('无需配置（自主能力）');
      setChannelOrderType('无需配置');
      setTemplateFileName(`${task.name}_自主下单模板.xlsx`);
    }
  };

  const saveChannelConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configChannelTaskId) return;
    const finalOrderType = channelSelected === '无需配置（自主能力）' ? '无需配置' : channelOrderType;
    updateTaskChannelConfig(configChannelTaskId, channelSelected, finalOrderType, templateFileName);
    setConfigChannelTaskId(null);
  };

  const openServiceConfig = (task: TaskItem) => {
    setConfigServiceTaskId(task.id);
    const cfg = task.serviceConfig;

    let preSrvs: string[] = [];
    if (cfg?.preValidationServices && cfg.preValidationServices.length > 0) {
      preSrvs = [...cfg.preValidationServices];
    } else if (cfg?.preValidationService && cfg.preValidationService !== '无') {
      preSrvs = cfg.preValidationService.split(/[、,，\s]+/).filter(Boolean);
    } else {
      preSrvs = ['地址精确度校验'];
    }
    setSelectedPreValidationSrvs(preSrvs);

    let vaSrvs: string[] = [];
    if (cfg?.valueAddedServices && cfg.valueAddedServices.length > 0) {
      vaSrvs = [...cfg.valueAddedServices];
    } else if (cfg?.valueAddedService && cfg.valueAddedService !== '无') {
      vaSrvs = cfg.valueAddedService.split(/[、,，\s]+/).filter(Boolean);
    } else {
      vaSrvs = ['短信触达'];
    }
    setSelectedValueAddedSrvs(vaSrvs);

    const quotas: Record<string, number> = { ...(cfg?.serviceQuotas || {}) };
    preSrvs.forEach((srv) => {
      if (quotas[srv] === undefined) {
        const found = preValidationOptions.find((o) => o.name === srv);
        quotas[srv] = cfg?.freeTrialCount || found?.defaultQuota || 50;
      }
    });
    vaSrvs.forEach((srv) => {
      if (quotas[srv] === undefined) {
        const found = valueAddedOptions.find((o) => o.name === srv);
        quotas[srv] = cfg?.freeTrialCount || found?.defaultQuota || 50;
      }
    });
    setServiceQuotas(quotas);
  };

  const togglePreValidationSrv = (name: string, defaultQuota = 50) => {
    setSelectedPreValidationSrvs((prev) => {
      const exists = prev.includes(name);
      if (exists) {
        return prev.filter((item) => item !== name);
      } else {
        setServiceQuotas((q) => ({ ...q, [name]: q[name] ?? defaultQuota }));
        return [...prev, name];
      }
    });
  };

  const toggleValueAddedSrv = (name: string, defaultQuota = 50) => {
    setSelectedValueAddedSrvs((prev) => {
      const exists = prev.includes(name);
      if (exists) {
        return prev.filter((item) => item !== name);
      } else {
        setServiceQuotas((q) => ({ ...q, [name]: q[name] ?? defaultQuota }));
        return [...prev, name];
      }
    });
  };

  const updateQuota = (name: string, quota: number) => {
    setServiceQuotas((prev) => ({
      ...prev,
      [name]: Math.max(0, quota),
    }));
  };

  const saveServiceConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configServiceTaskId) return;

    updateTaskServiceConfig(configServiceTaskId, {
      preValidationServices: selectedPreValidationSrvs,
      valueAddedServices: selectedValueAddedSrvs,
      serviceQuotas: serviceQuotas,
      preValidationService: selectedPreValidationSrvs.join('、') || '无',
      valueAddedService: selectedValueAddedSrvs.join('、') || '无',
      freeTrialCount: Object.values(serviceQuotas)[0] || 0,
    });
    setConfigServiceTaskId(null);
  };

  const handleInitiateDispatch = (task: TaskItem) => {
    if (task.status === '已失效') {
      showToast('无法下单', '当前任务处于已失效状态，无法发起下单', 'warning');
      return;
    }
    if (task.status === '待配置') {
      showToast('请先配置', '当前任务待配置渠道模板，请先完成渠道配置后再下单', 'warning');
      openChannelConfig(task);
      return;
    }
    initiateNewDispatch(task.id, task.merchantId);
    showToast('进入新建下单', `已自动绑定商户【${task.merchantName}】与任务【${task.name}】`, 'info');
  };

  const renderTaskDetail = () => {
    if (!activeTask) return null;

    return (
      <div className="space-y-6">
        {/* Breadcrumb & Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <button
              onClick={() => setSelectedTaskId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 transition shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              返回任务列表
            </button>
            <span className="text-slate-300">/</span>
            <span>任务管理</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">任务详情</span>
            <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold text-[11px]">
              {activeTask.id}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeTask.status === '已生效' ? (
              <button
                onClick={() => updateTaskStatus(activeTask.id, '已失效')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium rounded-lg transition cursor-pointer shadow-2xs"
                title="将该任务置为失效状态（租户将无法下单）"
              >
                <XCircle className="w-3.5 h-3.5" />
                置为失效
              </button>
            ) : activeTask.status === '已失效' ? (
              <button
                onClick={() => updateTaskStatus(activeTask.id, '已生效')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium rounded-lg transition cursor-pointer shadow-2xs"
                title="恢复任务为已生效状态（租户可继续下单）"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                恢复生效
              </button>
            ) : (
              <button
                onClick={() => updateTaskStatus(activeTask.id, '已生效')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium rounded-lg transition cursor-pointer shadow-2xs"
                title="将待配置任务直接置为已生效状态"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                设为生效
              </button>
            )}

            <button
              onClick={() => {
                setStatusChangeModalTask(activeTask);
                setTargetStatus(activeTask.status === '已生效' ? '已失效' : '已生效');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              变更状态
            </button>

            <button
              onClick={() => handleInitiateDispatch(activeTask)}
              disabled={activeTask.status !== '已生效'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition shadow-xs cursor-pointer ${
                activeTask.status === '已生效'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              以此任务新建下单
            </button>
          </div>
        </div>

        {/* Task Core Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">{activeTask.name}</h3>
                <StatusBadge status={activeTask.status} />
              </div>
              <p className="text-xs text-slate-500">
                任务编号：<span className="font-mono text-slate-700 font-medium">{activeTask.id}</span>
              </p>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100 text-xs">
              <div>
                <div className="text-slate-400 text-[11px]">关联执行订单完成度</div>
                <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                  {activeTask.completedCount} <span className="text-slate-400 font-normal text-xs">/ {activeTask.orderCount}</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <div className="text-slate-400 text-[11px]">完成比例</div>
                <div className="font-bold text-indigo-600 font-mono text-sm mt-0.5">
                  {activeTask.orderCount > 0 ? `${Math.round((activeTask.completedCount / activeTask.orderCount) * 100)}%` : '0%'}
                </div>
              </div>
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-slate-500">归属商户</div>
              <div className="font-semibold text-slate-800 mt-1">{activeTask.merchantName}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-slate-500">任务类型</div>
              <div className="font-semibold text-slate-800 mt-1">{activeTask.type}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-slate-500">责任人</div>
              <div className="font-semibold text-slate-800 mt-1">{activeTask.responsiblePerson}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-slate-500">截止日期</div>
              <div className="font-semibold text-slate-800 mt-1 font-mono">{activeTask.deadline}</div>
            </div>
          </div>
        </div>

        {/* Config Summary Grid (Explicitly without config channel / config service buttons) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Channel Configuration Status */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-indigo-600" />
                渠道执行配置
              </span>
              <span className="text-[10px] text-slate-400 font-mono">PRD 3.2.1.3 / 3.2.1.4</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">执行渠道类型</span>
                <span className="font-semibold text-slate-900">
                  {activeTask.channelConfigs['无需配置（自主能力）']
                    ? '无需配置（自主能力）'
                    : activeTask.channelConfigs['丰创']
                    ? '丰创 (外部执行渠道)'
                    : '待配置渠道'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">渠道订单类型编码 (orderType)</span>
                <span className="font-mono text-indigo-600 font-medium">
                  {activeTask.channelConfigs['无需配置（自主能力）']
                    ? '无需配置（平台内置履约能力）'
                    : activeTask.channelConfigs['丰创']?.orderType || '未配置'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">已绑定下单模板</span>
                <span className="text-slate-800 flex items-center gap-1 font-mono">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  {activeTask.channelConfigs['无需配置（自主能力）']?.templateFile ||
                    activeTask.channelConfigs['丰创']?.templateFile ||
                    '尚未上传模板文件'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">扩展渠道状态</span>
                <span className="text-slate-400">顺丰同城等接口位预留</span>
              </div>
            </div>
          </div>

          {/* Service Configuration Status */}
          <div className="p-5 bg-white rounded-xl border border-purple-100 shadow-xs bg-purple-50/20">
            <div className="flex items-center justify-between mb-4 border-b border-purple-100 pb-3">
              <span className="font-bold text-purple-900 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-purple-600" />
                服务市场推荐与体验配额
              </span>
              <span className="text-[10px] text-purple-600 font-mono">PRD 3.2.1.5 (多选及独立配额)</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-slate-500 font-medium mb-1.5 flex items-center justify-between">
                  <span>下单前置校验服务（多选推荐）</span>
                  <span className="text-[11px] text-purple-700 font-normal">
                    {(activeTask.serviceConfig?.preValidationServices?.length || 0)} 项已配置
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(activeTask.serviceConfig?.preValidationServices && activeTask.serviceConfig.preValidationServices.length > 0) ? (
                    activeTask.serviceConfig.preValidationServices.map((srv) => {
                      const quota = activeTask.serviceConfig?.serviceQuotas?.[srv] ?? activeTask.serviceConfig?.freeTrialCount ?? 0;
                      return (
                        <span
                          key={srv}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-900 rounded-lg border border-purple-200 text-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span className="font-medium">{srv}</span>
                          <span className="bg-purple-200/80 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                            免费配额: {quota} 次
                          </span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-slate-400 text-xs">未启用前置校验服务</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-purple-100">
                <div className="text-slate-500 font-medium mb-1.5 flex items-center justify-between">
                  <span>执行后增值服务（多选推荐）</span>
                  <span className="text-[11px] text-indigo-700 font-normal">
                    {(activeTask.serviceConfig?.valueAddedServices?.length || 0)} 项已配置
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(activeTask.serviceConfig?.valueAddedServices && activeTask.serviceConfig.valueAddedServices.length > 0) ? (
                    activeTask.serviceConfig.valueAddedServices.map((srv) => {
                      const quota = activeTask.serviceConfig?.serviceQuotas?.[srv] ?? activeTask.serviceConfig?.freeTrialCount ?? 0;
                      return (
                        <span
                          key={srv}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-900 rounded-lg border border-indigo-200 text-xs"
                        >
                          <Zap className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-medium">{srv}</span>
                          <span className="bg-indigo-200/80 text-indigo-900 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                            免费配额: {quota} 次
                          </span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-slate-400 text-xs">未启用增值服务</span>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-purple-800/90 pt-1.5 bg-purple-50/70 p-2.5 rounded-lg border border-purple-100 flex items-start gap-1.5">
                <span className="shrink-0 font-bold">💡</span>
                <span>
                  说明：每项服务均配置有专属免费体验配额，租户在此任务下单及履约过程中享受相应免费调用额度。
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Associated Execution Orders Table (strictly using '执行订单' wording) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>该任务关联的执行订单 ({activeTaskOrders.length})</span>
            </h4>
            <button
              onClick={() => setActiveOpTab('orders')}
              className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              查看全部订单明细
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-3.5 font-medium">执行订单号</th>
                  <th className="py-2.5 px-3.5 font-medium">渠道订单号</th>
                  <th className="py-2.5 px-3.5 font-medium">受检网点 / 客户</th>
                  <th className="py-2.5 px-3.5 font-medium">网点地址</th>
                  <th className="py-2.5 px-3.5 font-medium">当前状态</th>
                  <th className="py-2.5 px-3.5 font-medium">更新时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTaskOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      当前任务暂未产生执行订单，点击右上角【以此任务新建下单】可批量导入网点并下发
                    </td>
                  </tr>
                ) : (
                  activeTaskOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3.5 font-mono text-slate-700 font-medium">{ord.id}</td>
                      <td className="py-2.5 px-3.5 font-mono text-indigo-600">{ord.channelOrderId || '-'}</td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-900">
                        {ord.contactCompany} ({ord.contactName})
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 max-w-xs truncate">{ord.address}</td>
                      <td className="py-2.5 px-3.5">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-500">{ord.updatedAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setSelectedTaskId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              返回任务列表
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {selectedTaskId && activeTask ? (
        renderTaskDetail()
      ) : (
        <>
          {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              任务管理
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              创建商户专属任务、配置丰创渠道订单类型编码、上传 Excel 下单模板并绑定服务市场前置校验与增值服务
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              批量导入任务
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              新建任务
            </button>
          </div>
        </div>

        {/* Status Pipeline Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-lg border transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">全部任务专项</span>
              <span className="font-bold text-indigo-700 text-base font-mono">
                {tasks.length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">商户关联的所有任务专项</p>
          </div>

          <div
            onClick={() => setStatusFilter('待配置')}
            className={`p-3 rounded-lg border transition cursor-pointer ${
              statusFilter === '待配置'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-amber-800 font-semibold">1: 待配置</span>
              <span className="font-bold text-amber-700 text-base font-mono">
                {tasks.filter((t) => t.status === '待配置').length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">刚创建/导入，渠道模板未配置</p>
          </div>

          <div
            onClick={() => setStatusFilter('已生效')}
            className={`p-3 rounded-lg border transition cursor-pointer ${
              statusFilter === '已生效'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-emerald-800 font-semibold">2: 已生效</span>
              <span className="font-bold text-emerald-700 text-base font-mono">
                {tasks.filter((t) => t.status === '已生效').length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">渠道模板已配置，租户可下单</p>
          </div>

          <div
            onClick={() => setStatusFilter('已失效')}
            className={`p-3 rounded-lg border transition cursor-pointer ${
              statusFilter === '已失效'
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-rose-800 font-semibold">3: 已失效</span>
              <span className="font-bold text-rose-700 text-base font-mono">
                {tasks.filter((t) => t.status === '已失效').length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">任务失效无法下单</p>
          </div>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索任务编号、名称、商户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">所有状态 (待配置 / 已生效 / 已失效)</option>
              <option value="待配置">待配置 (渠道模板未配置)</option>
              <option value="已生效">已生效 (租户可下单)</option>
              <option value="已失效">已失效 (任务失效无法下单)</option>
            </select>

            <select
              value={merchantFilter}
              onChange={(e) => setMerchantFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">全部商户</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">全部任务类型</option>
              <option value="门店巡检">门店巡检</option>
              <option value="促销核验">促销核验</option>
              <option value="数据采集">数据采集</option>
              <option value="物料铺设">物料铺设</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {selectedTaskIds.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg text-xs animate-in fade-in">
                <span className="text-indigo-900 font-medium">
                  已选 <span className="font-bold font-mono text-indigo-700">{selectedTaskIds.length}</span> 项
                </span>
                <button
                  type="button"
                  onClick={() => handleBatchStatusChange('已生效')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition cursor-pointer shadow-2xs"
                >
                  批量置为生效
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchStatusChange('已失效')}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium transition cursor-pointer shadow-2xs"
                >
                  批量置为失效
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTaskIds([])}
                  className="text-slate-400 hover:text-slate-600 text-[11px] underline cursor-pointer ml-1"
                >
                  清空
                </button>
              </div>
            )}
            <div className="text-xs text-slate-500">
              共 <span className="font-semibold text-slate-900">{filteredTasks.length}</span> 个任务
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length}
                    onChange={toggleSelectAllTasks}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3">任务编号</th>
                <th className="py-3.5 px-4">任务名称</th>
                <th className="py-3.5 px-4">归属商户</th>
                <th className="py-3.5 px-4">任务类型</th>
                <th className="py-3.5 px-4">状态</th>
                <th className="py-3.5 px-4 text-center">渠道就绪</th>
                <th className="py-3.5 px-4 text-center">订单进度 (完结/总数)</th>
                <th className="py-3.5 px-4">负责人</th>
                <th className="py-3.5 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    暂无符合条件的任务数据
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const autoConfig = task.channelConfigs['无需配置（自主能力）'];
                  const fcConfig = task.channelConfigs['丰创'];
                  const isAutoReady = autoConfig && autoConfig.templateUploaded;
                  const isFcReady = fcConfig && fcConfig.templateUploaded && fcConfig.orderType;
                  const isChecked = selectedTaskIds.includes(task.id);

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        selectedTaskId === task.id ? 'bg-indigo-50/30' : isChecked ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectTask(task.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-500 font-medium">{task.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <button
                          onClick={() => setSelectedTaskId(task.id)}
                          className="hover:text-indigo-600 text-left transition cursor-pointer"
                        >
                          {task.name}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{task.merchantName}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                          {task.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={task.status} />
                          <button
                            type="button"
                            onClick={() => {
                              setStatusChangeModalTask(task);
                              setTargetStatus(task.status === '已生效' ? '已失效' : '已生效');
                            }}
                            title="变更任务状态"
                            className="text-slate-400 hover:text-indigo-600 transition cursor-pointer p-0.5 rounded hover:bg-slate-100"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isAutoReady ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200"
                            title="自主能力履约（无需外部渠道编码）"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            自主能力就绪
                          </span>
                        ) : isFcReady ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                            title={`丰创编码: ${fcConfig.orderType}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            丰创已就绪
                          </span>
                        ) : (
                          <span
                            onClick={() => openChannelConfig(task)}
                            className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 cursor-pointer hover:bg-amber-100"
                            title="点击配置渠道编码与模板"
                          >
                            <AlertCircle className="w-3 h-3" />
                            待配渠道
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="font-semibold text-slate-900">{task.completedCount}</span>
                        <span className="text-slate-400"> / </span>
                        <span className="text-slate-600">{task.orderCount}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{task.responsiblePerson}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTaskId(task.id)}
                            className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded font-medium transition cursor-pointer"
                          >
                            详情
                          </button>
                          <button
                            onClick={() => openChannelConfig(task)}
                            className="px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded font-medium transition cursor-pointer"
                            title="配置渠道订单类型编码与上传模板"
                          >
                            渠道
                          </button>
                          <button
                            onClick={() => openServiceConfig(task)}
                            className="px-2 py-1 text-purple-600 hover:bg-purple-50 rounded font-medium transition cursor-pointer"
                            title="配置前置校验与增值服务"
                          >
                            服务
                          </button>
                          {task.status === '已生效' ? (
                            <button
                              onClick={() => updateTaskStatus(task.id, '已失效')}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded font-medium transition cursor-pointer font-semibold"
                              title="将任务置为失效（租户将无法下单）"
                            >
                              失效
                            </button>
                          ) : task.status === '已失效' ? (
                            <button
                              onClick={() => updateTaskStatus(task.id, '已生效')}
                              className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded font-medium transition cursor-pointer font-semibold"
                              title="恢复任务为已生效状态（租户可继续下单）"
                            >
                              生效
                            </button>
                          ) : (
                            <button
                              onClick={() => updateTaskStatus(task.id, '已生效')}
                              className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded font-medium transition cursor-pointer font-semibold"
                              title="将待配置任务设为已生效"
                            >
                              生效
                            </button>
                          )}
                          <button
                            onClick={() => handleInitiateDispatch(task)}
                            className={`px-2 py-1 rounded font-medium transition cursor-pointer ${
                              task.status === '已生效'
                                ? 'text-blue-600 hover:bg-blue-50'
                                : 'text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            下单
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* Modal: New Task */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="新建丰迹任务"
        subtitle="为指定商户创建专属作业任务，创建后需配置渠道模板"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              任务名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如：2026年Q4深圳各网点日常巡检专项"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              归属企业商户 <span className="text-rose-500">*</span>
            </label>
            <select
              value={newTaskMerchantId}
              onChange={(e) => setNewTaskMerchantId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">任务类型</label>
              <select
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="门店巡检">门店巡检</option>
                <option value="促销核验">促销核验</option>
                <option value="数据采集">数据采集</option>
                <option value="物料铺设">物料铺设</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">截止日期</label>
              <input
                type="date"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
              </input>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed">
            ⚠️ 提示：新创建的任务默认处于【待配置】状态，只有在完成渠道订单类型编码并上传 Excel 下单模板后，任务将变为【已生效】，租户端方可正常使用该任务进行下单。
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-xs cursor-pointer"
            >
              创建任务并下一步配置
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Batch Import Tasks */}
      <Modal
        isOpen={isBatchImportModalOpen}
        onClose={() => setIsBatchImportModalOpen(false)}
        title="批量导入任务 (Excel / JSON)"
        subtitle="PRD 3.2.1.2：支持从外部系统或表格批量导入任务及各渠道订单编码"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
            <span>模板字段包含：任务名称、商户名称、任务类型、截止日期、渠道编码(JSON)</span>
            <button
              type="button"
              onClick={() => showToast('模板下载', '已下载《任务批量导入标准模板.xlsx》', 'info')}
              className="text-indigo-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              下载模板
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2 px-2.5">任务名称</th>
                  <th className="py-2 px-2.5">商户</th>
                  <th className="py-2 px-2.5">类型</th>
                  <th className="py-2 px-2.5">渠道配置 JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchImportRows.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 px-2.5 font-medium">{r.name}</td>
                    <td className="py-2 px-2.5">{r.merchantName}</td>
                    <td className="py-2 px-2.5">{r.type}</td>
                    <td className="py-2 px-2.5 font-mono text-slate-500 text-[10px]">{r.channelCodeJson}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBatchImportModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleBatchImportSubmit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-xs cursor-pointer"
            >
              确认批量导入
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Channel Configuration */}
      <Modal
        isOpen={!!configChannelTaskId}
        onClose={() => setConfigChannelTaskId(null)}
        title="配置渠道订单类型编码与下单模板"
        subtitle="PRD 3.2.1.3 & 3.2.1.4：完成渠道订单类型与下单模板绑定，支持无需配置（自主能力）与外部渠道对接"
      >
        <form onSubmit={saveChannelConfig} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">选择执行渠道</label>
            <div className="flex flex-wrap gap-3">
              <label
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition cursor-pointer ${
                  channelSelected === '无需配置（自主能力）'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="channelSelect"
                  checked={channelSelected === '无需配置（自主能力）'}
                  onChange={() => {
                    setChannelSelected('无需配置（自主能力）');
                    setChannelOrderType('无需配置');
                    setTemplateFileName((prev) =>
                      prev.includes('丰创') ? prev.replace('丰创', '自主') : prev || '自主任务下单模板.xlsx'
                    );
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>无需配置（自主能力）</span>
              </label>

              <label
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition cursor-pointer ${
                  channelSelected === '丰创'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="channelSelect"
                  checked={channelSelected === '丰创'}
                  onChange={() => {
                    setChannelSelected('丰创');
                    if (channelOrderType === '无需配置' || !channelOrderType) {
                      setChannelOrderType('ord-fengchuang-retail-v1');
                    }
                    setTemplateFileName((prev) =>
                      prev.includes('自主') ? prev.replace('自主', '丰创') : prev || '丰创零售门店巡检导入模板.xlsx'
                    );
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>丰创 (主执行渠道)</span>
              </label>

              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 opacity-50 cursor-not-allowed text-slate-400">
                <input type="radio" disabled name="channelSelect" />
                <span>顺丰同城 (预留扩展位)</span>
              </label>
            </div>
          </div>

          {channelSelected === '无需配置（自主能力）' ? (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="font-semibold text-emerald-800 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>无需配置外部渠道编码（自主能力模式）</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                当前任务采用平台自主能力进行执行与履约，无需对接第三方中台编码。保存配置后任务将直接进入【已生效】状态，租户端即可正常下载模板并批量下发工单。
              </p>
            </div>
          ) : null}

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              {channelSelected === '无需配置（自主能力）' ? '渠道订单类型编码' : '丰创订单类型编码 (orderType)'}{' '}
              {channelSelected === '丰创' && <span className="text-rose-500">*</span>}
            </label>
            {channelSelected === '无需配置（自主能力）' ? (
              <input
                type="text"
                disabled
                value="无需配置（平台内置自主履约引擎）"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg text-xs font-mono cursor-not-allowed"
              />
            ) : (
              <input
                type="text"
                required
                placeholder="例如：ord-fengchuang-retail-v1"
                value={channelOrderType}
                onChange={(e) => setChannelOrderType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              {channelSelected === '无需配置（自主能力）'
                ? '自主能力任务在下单时不依赖外部渠道 orderType，采用标准履约格式。'
                : '由丰创中台定义的业务模板编码，下单时将作为 orderType 字段透传。'}
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              上传商户下单 Excel 模板文件 <span className="text-rose-500">*</span>
            </label>
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>{templateFileName || '标准下单模板.xlsx'}</span>
              </div>
              <button
                type="button"
                onClick={() => showToast('模板已替换', '已更新下单模板文件', 'info')}
                className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-xs font-medium cursor-pointer"
              >
                重新选择
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              租户在【新建下单】时将下载此模板填写网点并回传。
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfigChannelTaskId(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-xs cursor-pointer"
            >
              保存并就绪
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Service Market Configuration */}
      <Modal
        isOpen={!!configServiceTaskId}
        onClose={() => setConfigServiceTaskId(null)}
        title="任务关联服务市场配置"
        subtitle="PRD 3.2.1.5：为任务配置下单前置校验服务（支持多选）、执行后增值服务（支持多选）及每项服务的独立免费体验配额"
      >
        <form onSubmit={saveServiceConfig} className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: 下单前服务推荐 (前置校验) */}
          <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>下单前服务推荐（前置校验能力）</span>
                <span className="text-[11px] font-normal text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                  已选 {selectedPreValidationSrvs.length} 项 (支持多选)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allNames = preValidationOptions.map((o) => o.name);
                    setSelectedPreValidationSrvs(allNames);
                    setServiceQuotas((prev) => {
                      const updated = { ...prev };
                      preValidationOptions.forEach((o) => {
                        if (updated[o.name] === undefined) updated[o.name] = o.defaultQuota;
                      });
                      return updated;
                    });
                  }}
                  className="text-[11px] text-purple-600 hover:underline cursor-pointer font-medium"
                >
                  全选
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedPreValidationSrvs([])}
                  className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                >
                  清空
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              在租户导入网点点位下单时自动触发前置清洗与核验，拦截无效地址并提升执行成功率。
            </p>

            <div className="space-y-2 mt-2">
              {preValidationOptions.map((opt) => {
                const isSelected = selectedPreValidationSrvs.includes(opt.name);
                const currentQuota = serviceQuotas[opt.name] ?? opt.defaultQuota;

                return (
                  <div
                    key={opt.name}
                    className={`p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-purple-50/60 border-purple-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePreValidationSrv(opt.name, opt.defaultQuota)}
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer h-4 w-4"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900">{opt.name}</span>
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-medium">
                              {opt.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{opt.desc}</p>
                        </div>
                      </label>

                      {isSelected && (
                        <div className="shrink-0 flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-purple-200 shadow-xs">
                          <span className="text-[11px] text-purple-900 font-medium whitespace-nowrap">
                            免费体验配额:
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={currentQuota}
                            onChange={(e) => updateQuota(opt.name, Number(e.target.value))}
                            className="w-16 px-2 py-0.5 text-center border border-purple-300 rounded font-mono font-bold text-purple-950 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-purple-50/30"
                          />
                          <span className="text-[11px] text-purple-700 font-medium">次</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: 增值服务推荐 (完结后拓展) */}
          <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>增值服务推荐（完结后拓展能力）</span>
                <span className="text-[11px] font-normal text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                  已选 {selectedValueAddedSrvs.length} 项 (支持多选)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allNames = valueAddedOptions.map((o) => o.name);
                    setSelectedValueAddedSrvs(allNames);
                    setServiceQuotas((prev) => {
                      const updated = { ...prev };
                      valueAddedOptions.forEach((o) => {
                        if (updated[o.name] === undefined) updated[o.name] = o.defaultQuota;
                      });
                      return updated;
                    });
                  }}
                  className="text-[11px] text-indigo-600 hover:underline cursor-pointer font-medium"
                >
                  全选
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedValueAddedSrvs([])}
                  className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                >
                  清空
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              在工单履约完结后，系统自动或按需为商户与受检网点提供触达、营销及AI分析增值服务。
            </p>

            <div className="space-y-2 mt-2">
              {valueAddedOptions.map((opt) => {
                const isSelected = selectedValueAddedSrvs.includes(opt.name);
                const currentQuota = serviceQuotas[opt.name] ?? opt.defaultQuota;

                return (
                  <div
                    key={opt.name}
                    className={`p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/60 border-indigo-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleValueAddedSrv(opt.name, opt.defaultQuota)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900">{opt.name}</span>
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-medium">
                              {opt.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{opt.desc}</p>
                        </div>
                      </label>

                      {isSelected && (
                        <div className="shrink-0 flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-200 shadow-xs">
                          <span className="text-[11px] text-indigo-900 font-medium whitespace-nowrap">
                            免费体验配额:
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={currentQuota}
                            onChange={(e) => updateQuota(opt.name, Number(e.target.value))}
                            className="w-16 px-2 py-0.5 text-center border border-indigo-300 rounded font-mono font-bold text-indigo-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-indigo-50/30"
                          />
                          <span className="text-[11px] text-indigo-700 font-medium">次</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quota Policy Note */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <span className="shrink-0 font-bold">💡 计费与体验规则：</span>
            <span>
              每个已选服务独立配置免费体验配额。当商户发起工单清洗或增值服务调用时，系统优先扣减各服务独立配额；超出配额后按服务市场标准资费结算。
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfigServiceTaskId(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              保存服务配置
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Change Task Status */}
      <Modal
        isOpen={!!statusChangeModalTask}
        onClose={() => setStatusChangeModalTask(null)}
        title="变更任务生效/失效状态"
        subtitle={statusChangeModalTask ? `当前任务：${statusChangeModalTask.name} (${statusChangeModalTask.id})` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmStatusChange} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1.5">
              目标状态 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  key: '已生效' as TaskStatus,
                  label: '已生效',
                  desc: '商户/租户可正常下单',
                  color: 'border-emerald-200 bg-emerald-50/50 text-emerald-800',
                  activeColor: 'ring-2 ring-emerald-500 bg-emerald-100/70',
                },
                {
                  key: '已失效' as TaskStatus,
                  label: '已失效',
                  desc: '暂停下单与执行',
                  color: 'border-rose-200 bg-rose-50/50 text-rose-800',
                  activeColor: 'ring-2 ring-rose-500 bg-rose-100/70',
                },
                {
                  key: '待配置' as TaskStatus,
                  label: '待配置',
                  desc: '待配置渠道与模板',
                  color: 'border-amber-200 bg-amber-50/50 text-amber-800',
                  activeColor: 'ring-2 ring-amber-500 bg-amber-100/70',
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTargetStatus(opt.key)}
                  className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                    opt.color
                  } ${targetStatus === opt.key ? opt.activeColor : 'opacity-70 hover:opacity-100'}`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{opt.label}</span>
                    {targetStatus === opt.key && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-[10px] mt-1 text-slate-600">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">状态变更影响说明：</div>
            {targetStatus === '已生效' && (
              <p className="text-emerald-700">
                • 变更为【已生效】后，该任务将立即开放给租户在门户端上传 Excel 下单或通过 OpenAPI 下单。
              </p>
            )}
            {targetStatus === '已失效' && (
              <p className="text-rose-700">
                • 变更为【已失效】后，租户无法再对该任务新建下单批次，历史已履约工单不受影响。
              </p>
            )}
            {targetStatus === '待配置' && (
              <p className="text-amber-700">
                • 变更为【待配置】后，该任务需重新配置渠道订单编码与下单模板后方可生效。
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStatusChangeModalTask(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              确认变更状态
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
