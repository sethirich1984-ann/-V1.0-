import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Send,
  RotateCw,
  Search,
  Filter,
  Eye,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Building2,
  FileCheck2,
  Sparkles,
  PhoneCall,
  UserCheck,
  ChevronRight,
  Activity,
  History,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { OrderItem, AuditRejectRecord } from '../../types';
import { Modal } from '../common/Modal';

const ANOMALY_COLORS = {
  timeout: '#ef4444', // Red (超时未接单)
  auditReject: '#f97316', // Orange (审核驳回)
  stalled: '#eab308', // Amber (作业滞留)
  gpsDeviation: '#6366f1', // Indigo (GPS偏差)
  cancelled: '#94a3b8', // Slate (异常取消)
};

export const DataDashboard: React.FC = () => {
  const {
    orders,
    tasks,
    merchants,
    setSelectedOrderId,
    setActiveOpTab,
    setActiveOpPlatformTab,
    systemMode,
    remindOrderCourier,
    reassignOrder,
    resubmitOrderAudit,
    showToast,
  } = useApp();

  // Filter state
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState<string>('all');
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('all');
  const [anomalyTab, setAnomalyTab] = useState<
    'all' | 'timeout' | 'audit_reject' | 'gps_deviation' | 'stalled' | 'cancelled'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRejectHistoryOrder, setSelectedRejectHistoryOrder] = useState<OrderItem | null>(null);

  // Helper to detect anomalies
  const isOrderAnomalous = (order: OrderItem) => {
    return (
      order.isTimeoutUnassigned ||
      (order.auditRejectCount && order.auditRejectCount > 0) ||
      order.isExecutionStalled ||
      order.isGpsDeviated ||
      order.status === 'cancelled' ||
      (order.anomalySeverity && order.anomalySeverity !== 'none')
    );
  };

  // Scope filtered orders
  const scopedOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchMerchant = selectedMerchantFilter === 'all' || o.merchantId === selectedMerchantFilter;
      const matchTask = selectedTaskFilter === 'all' || o.taskId === selectedTaskFilter;
      return matchMerchant && matchTask;
    });
  }, [orders, selectedMerchantFilter, selectedTaskFilter]);

  // Anomaly metrics calculation
  const totalOrdersCount = scopedOrders.length;
  const anomalousOrders = useMemo(() => scopedOrders.filter(isOrderAnomalous), [scopedOrders]);
  const normalOrdersCount = totalOrdersCount - anomalousOrders.length;
  const healthRate = totalOrdersCount > 0 ? Math.round((normalOrdersCount / totalOrdersCount) * 100) : 100;

  // Specific anomaly counts
  const timeoutUnassignedOrders = useMemo(
    () => scopedOrders.filter((o) => o.isTimeoutUnassigned || (o.status === 'waiting_assign' && (o.unassignedHours || 0) > 2)),
    [scopedOrders]
  );
  const auditRejectedOrders = useMemo(
    () => scopedOrders.filter((o) => (o.auditRejectCount && o.auditRejectCount > 0) || o.status === 'inner_auditing_waiting' && o.auditRejectCount),
    [scopedOrders]
  );
  const stalledExecutionOrders = useMemo(
    () => scopedOrders.filter((o) => o.isExecutionStalled || (o.status === 'processing_start' && (o.stalledHours || 0) > 24)),
    [scopedOrders]
  );
  const gpsDeviatedOrders = useMemo(
    () => scopedOrders.filter((o) => o.isGpsDeviated || (o.gpsDeviationMeters && o.gpsDeviationMeters > 500)),
    [scopedOrders]
  );
  const cancelledOrders = useMemo(() => scopedOrders.filter((o) => o.status === 'cancelled'), [scopedOrders]);

  // High risk orders count (severity === high)
  const highRiskCount = scopedOrders.filter((o) => o.anomalySeverity === 'high').length;

  // Chart 1: Anomaly Type Distribution Data
  const anomalyDistributionData = useMemo(() => {
    const data = [
      { name: '超时未接单', value: timeoutUnassignedOrders.length, color: ANOMALY_COLORS.timeout },
      { name: '审核质检驳回', value: auditRejectedOrders.length, color: ANOMALY_COLORS.auditReject },
      { name: '现场作业滞留', value: stalledExecutionOrders.length, color: ANOMALY_COLORS.stalled },
      { name: 'GPS定位偏移', value: gpsDeviatedOrders.length, color: ANOMALY_COLORS.gpsDeviation },
      { name: '异常终止/取消', value: cancelledOrders.length, color: ANOMALY_COLORS.cancelled },
    ].filter((item) => item.value > 0);

    return data.length > 0 ? data : [{ name: '无异常', value: 1, color: '#10b981' }];
  }, [timeoutUnassignedOrders, auditRejectedOrders, stalledExecutionOrders, gpsDeviatedOrders, cancelledOrders]);

  // Chart 2: Merchant Anomaly Ranking
  const merchantAnomalyRanking = useMemo(() => {
    const map: Record<string, { name: string; total: number; anomaly: number }> = {};
    scopedOrders.forEach((o) => {
      if (!map[o.merchantId]) {
        map[o.merchantId] = { name: o.merchantName.replace(/（.*）|有限.*/g, ''), total: 0, anomaly: 0 };
      }
      map[o.merchantId].total += 1;
      if (isOrderAnomalous(o)) {
        map[o.merchantId].anomaly += 1;
      }
    });

    return Object.values(map)
      .map((item) => ({
        name: item.name,
        异常订单数: item.anomaly,
        正常订单数: item.total - item.anomaly,
        异常率: item.total > 0 ? Math.round((item.anomaly / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.异常订单数 - a.异常订单数);
  }, [scopedOrders]);

  // Chart 3: Weekly Order & Anomaly Trend (Simulated)
  const weeklyTrendData = [
    { date: '08-28', 总下单量: 24, 异常工单: 1, 驳回率: '4.1%' },
    { date: '08-29', 总下单量: 38, 异常工单: 3, 驳回率: '7.8%' },
    { date: '08-30', 总下单量: 45, 异常工单: 2, 驳回率: '4.4%' },
    { date: '08-31', 总下单量: 52, 异常工单: 5, 驳回率: '9.6%' },
    { date: '09-01', 总下单量: 60, 异常工单: 4, 驳回率: '6.6%' },
    { date: '09-02', 总下单量: 48, 异常工单: 3, 驳回率: '6.2%' },
    { date: '09-03 (今日)', 总下单量: totalOrdersCount, 异常工单: anomalousOrders.length, 驳回率: `${100 - healthRate}%` },
  ];

  // Filtered Anomaly Table List
  const filteredAnomalyOrders = useMemo(() => {
    return scopedOrders.filter((order) => {
      // Must match tab
      if (anomalyTab === 'timeout' && !order.isTimeoutUnassigned) return false;
      if (anomalyTab === 'audit_reject' && (!order.auditRejectCount || order.auditRejectCount <= 0)) return false;
      if (anomalyTab === 'gps_deviation' && !order.isGpsDeviated && (!order.gpsDeviationMeters || order.gpsDeviationMeters <= 500)) return false;
      if (anomalyTab === 'stalled' && !order.isExecutionStalled && (!order.stalledHours || order.stalledHours <= 24)) return false;
      if (anomalyTab === 'cancelled' && order.status !== 'cancelled') return false;
      if (anomalyTab === 'all' && !isOrderAnomalous(order)) return false;

      // Search match
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.taskName.toLowerCase().includes(term) ||
        order.merchantName.toLowerCase().includes(term) ||
        order.contactCompany.toLowerCase().includes(term) ||
        order.contactName.toLowerCase().includes(term) ||
        (order.routeInfo?.courierName && order.routeInfo.courierName.toLowerCase().includes(term)) ||
        (order.anomalyTags && order.anomalyTags.some((t) => t.toLowerCase().includes(term)));

      return matchSearch;
    });
  }, [scopedOrders, anomalyTab, searchTerm]);

  // Jump to order detail
  const handleViewOrderDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (systemMode === 'open_platform') {
      setActiveOpPlatformTab('orders');
    } else {
      setActiveOpTab('orders');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              数据看板 (订单运行与异常监控)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              针对超时未接单、质检多轮驳回、小哥现场作业滞留、GPS空间偏移等异常场景提供实时预警与处置闭环
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMerchantFilter}
                onChange={(e) => setSelectedMerchantFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">全量商户企业 (全部)</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedTaskFilter}
                onChange={(e) => setSelectedTaskFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-700 font-medium focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                <option value="all">全量巡检任务 (全部)</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                showToast('大盘数据已刷新', '已重新拉取全网最新订单与异常检测状态', 'success');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              刷新大盘
            </button>
          </div>
        </div>

        {/* 4 Core Anomaly KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
          {/* Card 1: 超时未接单 */}
          <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200/80 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-800 font-medium">
              <span className="flex items-center gap-1.5 font-bold">
                <Clock className="w-4 h-4 text-rose-600" />
                超时未接单预警
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded font-mono font-bold">
                SLA &gt; 2h
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-rose-950">
                {timeoutUnassignedOrders.length}
              </span>
              <span className="text-xs text-rose-700">单未履约</span>
            </div>
            <div className="mt-2 text-[11px] text-rose-800/80 flex items-center justify-between">
              <span>最长等待: 4.8 小时</span>
              <button
                onClick={() => setAnomalyTab('timeout')}
                className="text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
              >
                立即处置 &gt;
              </button>
            </div>
          </div>

          {/* Card 2: 审核驳回 */}
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-800 font-medium">
              <span className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                审核驳回 / 质检未过
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-mono font-bold">
                质检不合规
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-amber-950">
                {auditRejectedOrders.length}
              </span>
              <span className="text-xs text-amber-700">单需重审</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-800/80 flex items-center justify-between">
              <span>多轮驳回 (≥2次): {scopedOrders.filter((o) => (o.auditRejectCount || 0) >= 2).length} 单</span>
              <button
                onClick={() => setAnomalyTab('audit_reject')}
                className="text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
              >
                查看原因 &gt;
              </button>
            </div>
          </div>

          {/* Card 3: 现场作业滞留 */}
          <div className="p-4 bg-yellow-50/60 rounded-xl border border-yellow-200/80 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-yellow-900 font-medium">
              <span className="flex items-center gap-1.5 font-bold">
                <Activity className="w-4 h-4 text-yellow-600" />
                现场作业超时滞留
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded font-mono font-bold">
                滞留 &gt; 24h
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-yellow-950">
                {stalledExecutionOrders.length}
              </span>
              <span className="text-xs text-yellow-800">单采集中未交卷</span>
            </div>
            <div className="mt-2 text-[11px] text-yellow-900/80 flex items-center justify-between">
              <span>平均滞留: 29.5 小时</span>
              <button
                onClick={() => setAnomalyTab('stalled')}
                className="text-yellow-800 hover:text-yellow-950 font-bold underline cursor-pointer"
              >
                督促进度 &gt;
              </button>
            </div>
          </div>

          {/* Card 4: GPS 定位偏差 */}
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/80 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-900 font-medium">
              <span className="flex items-center gap-1.5 font-bold">
                <MapPin className="w-4 h-4 text-indigo-600" />
                GPS 定位偏差打卡
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono font-bold">
                偏差 &gt; 500m
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-indigo-950">
                {gpsDeviatedOrders.length}
              </span>
              <span className="text-xs text-indigo-800">单打卡可疑</span>
            </div>
            <div className="mt-2 text-[11px] text-indigo-900/80 flex items-center justify-between">
              <span>最大偏差: 880 米</span>
              <button
                onClick={() => setAnomalyTab('gps_deviation')}
                className="text-indigo-800 hover:text-indigo-950 font-bold underline cursor-pointer"
              >
                空间复核 &gt;
              </button>
            </div>
          </div>
        </div>

        {/* Global Health Gauge Ribbon */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold font-mono text-sm shrink-0">
              {healthRate}%
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>工单全域健康运行指数</span>
                {highRiskCount > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 font-medium rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    存在 {highRiskCount} 项高危预警待人工介入
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 font-medium rounded-full">
                    整体流转平稳
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                已分析当前范围内共 {totalOrdersCount} 笔工单，其中正常合规 {normalOrdersCount} 单，异常与滞留工单 {anomalousOrders.length} 单。
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                timeoutUnassignedOrders.forEach((o) => remindOrderCourier(o.id));
                showToast('批量加急催单已下发', `已向 ${timeoutUnassignedOrders.length} 个超时未接单网点下发催单指令`, 'success');
              }}
              disabled={timeoutUnassignedOrders.length === 0}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              一键加急催办全部超时单 ({timeoutUnassignedOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Anomaly Category Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                异常工单类型结构分布
              </h3>
              <span className="text-[11px] text-slate-400">实时占比</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              识别履约阻塞点，指导运力与质检资源倾斜
            </p>
          </div>

          <div className="h-60 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={anomalyDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {anomalyDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} 单`, `${name}`]}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
            {anomalyDistributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 truncate">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value} 单</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Merchant Anomaly Risk Ranking */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                商户企业异常率排行与高危网点分布
              </h3>
              <span className="text-[11px] text-slate-400">Top 风险商户</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              追踪各租户企业巡检点位的异常率，指导前置核验服务（如地址解析/地理围栏）开启
            </p>
          </div>

          <div className="h-60 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={merchantAnomalyRanking} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#334155' }} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} 单`, name]}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="异常订单数" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="正常订单数" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-500 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60 mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              运营建议：对异常率超 10% 的商户，建议在任务配置中开启【地址空间预校验】服务。
            </span>
            <button
              onClick={() => {
                if (systemMode === 'open_platform') {
                  setActiveOpPlatformTab('services');
                } else {
                  setActiveOpTab('services');
                }
              }}
              className="text-amber-900 font-bold underline hover:text-indigo-600 cursor-pointer"
            >
              配置前置服务 &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Actionable Anomaly Triage Workstation */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              异常工单精准处置工作台 (Anomaly Triage Worklist)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              支持快速定位具体异常原因、直接触发催办/重新派发/驳回复议，或穿透进入工单详情
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索工单ID / 商户 / 小哥 / 网点..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Anomaly Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setAnomalyTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              anomalyTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>全部异常工单</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono">
              {anomalousOrders.length}
            </span>
          </button>

          <button
            onClick={() => setAnomalyTab('timeout')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              anomalyTab === 'timeout'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>超时未接单</span>
            <span className="px-1.5 py-0.2 bg-rose-200 text-rose-900 rounded-full text-[10px] font-mono">
              {timeoutUnassignedOrders.length}
            </span>
          </button>

          <button
            onClick={() => setAnomalyTab('audit_reject')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              anomalyTab === 'audit_reject'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>质检驳回</span>
            <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-mono">
              {auditRejectedOrders.length}
            </span>
          </button>

          <button
            onClick={() => setAnomalyTab('stalled')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              anomalyTab === 'stalled'
                ? 'bg-yellow-600 text-white shadow-xs'
                : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>作业严重滞留</span>
            <span className="px-1.5 py-0.2 bg-yellow-200 text-yellow-900 rounded-full text-[10px] font-mono">
              {stalledExecutionOrders.length}
            </span>
          </button>

          <button
            onClick={() => setAnomalyTab('gps_deviation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              anomalyTab === 'gps_deviation'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>GPS 偏差预警</span>
            <span className="px-1.5 py-0.2 bg-indigo-200 text-indigo-900 rounded-full text-[10px] font-mono">
              {gpsDeviatedOrders.length}
            </span>
          </button>

          <button
            onClick={() => setAnomalyTab('cancelled')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              anomalyTab === 'cancelled'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>异常取消</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[10px] font-mono">
              {cancelledOrders.length}
            </span>
          </button>
        </div>

        {/* Anomaly Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-3.5">工单ID / 下单批次</th>
                <th className="py-3 px-3.5">所属商户 / 巡检任务</th>
                <th className="py-3 px-3.5">受检网点 & 联系人</th>
                <th className="py-3 px-3.5">风险等级 / 异常详情</th>
                <th className="py-3 px-3.5">滞留/超时</th>
                <th className="py-3 px-3.5">顺丰网格责任人</th>
                <th className="py-3 px-3.5 text-right">处置动作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAnomalyOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    当前筛选条件下暂无异常工单，流转正常
                  </td>
                </tr>
              ) : (
                filteredAnomalyOrders.map((order) => {
                  const isHighRisk = order.anomalySeverity === 'high';
                  const isMediumRisk = order.anomalySeverity === 'medium';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      {/* ID & Dispatch */}
                      <td className="py-3 px-3.5">
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          {order.id}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          批次: {order.dispatchId}
                        </div>
                      </td>

                      {/* Merchant & Task */}
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-slate-900 truncate max-w-[160px]" title={order.merchantName}>
                          {order.merchantName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px] mt-0.5" title={order.taskName}>
                          {order.taskName}
                        </div>
                      </td>

                      {/* Store & Contact */}
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-slate-900 truncate max-w-[160px]" title={order.contactCompany}>
                          {order.contactCompany}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {order.contactName} ({order.contactPhone})
                        </div>
                      </td>

                      {/* Anomaly Tags & Severity */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isHighRisk && (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">
                              高危异常
                            </span>
                          )}
                          {isMediumRisk && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                              中危风险
                            </span>
                          )}
                          {order.anomalyTags && order.anomalyTags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded border border-slate-200/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Audit Reject Count Button */}
                        {order.auditRejectCount && order.auditRejectCount > 0 && (
                          <button
                            onClick={() => setSelectedRejectHistoryOrder(order)}
                            className="text-[11px] text-amber-700 hover:text-amber-900 font-medium underline flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            <History className="w-3 h-3" />
                            查看 {order.auditRejectCount} 条质检驳回意见
                          </button>
                        )}
                      </td>

                      {/* Overdue hours */}
                      <td className="py-3 px-3.5 font-mono text-[11px]">
                        {order.unassignedHours && (
                          <div className="text-rose-600 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            未接单 {order.unassignedHours}h
                          </div>
                        )}
                        {order.stalledHours && (
                          <div className="text-yellow-700 font-bold flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            滞留 {order.stalledHours}h
                          </div>
                        )}
                        {order.gpsDeviationMeters && (
                          <div className="text-indigo-600 font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            偏移 {order.gpsDeviationMeters}m
                          </div>
                        )}
                        {order.lastRemindedAt && (
                          <div className="text-[10px] text-emerald-600 mt-0.5">
                            已催单: {order.lastRemindedAt.substring(11, 16)}
                          </div>
                        )}
                      </td>

                      {/* Courier */}
                      <td className="py-3 px-3.5 text-slate-700">
                        {order.routeInfo?.courierName ? (
                          <div>
                            <div className="font-medium text-slate-900">
                              {order.routeInfo.courierName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {order.routeInfo.stationName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">尚未指派小哥</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Urge / Remind Button */}
                          {(order.isTimeoutUnassigned || order.isExecutionStalled || order.status === 'waiting_assign') && (
                            <button
                              onClick={() => remindOrderCourier(order.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium rounded transition flex items-center gap-1 cursor-pointer"
                              title="向网格调度主管与小哥下发催单加急通知"
                            >
                              <Zap className="w-3 h-3" />
                              催单
                            </button>
                          )}

                          {/* Reassign Button */}
                          {(order.isTimeoutUnassigned || (order.auditRejectCount && order.auditRejectCount >= 2)) && (
                            <button
                              onClick={() => reassignOrder(order.id)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded transition flex items-center gap-1 cursor-pointer"
                              title="重新指派就近网格小哥"
                            >
                              <UserCheck className="w-3 h-3" />
                              重派
                            </button>
                          )}

                          {/* Resubmit Audit */}
                          {order.status === 'inner_auditing_waiting' && order.auditRejectCount && (
                            <button
                              onClick={() => resubmitOrderAudit(order.id, '运营人工发起质检复议')}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium rounded transition flex items-center gap-1 cursor-pointer"
                              title="提交内审重新质检"
                            >
                              <RotateCw className="w-3 h-3" />
                              重审
                            </button>
                          )}

                          {/* View Full Detail */}
                          <button
                            onClick={() => handleViewOrderDetail(order.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            详情
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

      {/* Audit Reject History Modal */}
      <Modal
        isOpen={!!selectedRejectHistoryOrder}
        onClose={() => setSelectedRejectHistoryOrder(null)}
        title="质检驳回意见与审核历史记录"
        size="lg"
      >
        {selectedRejectHistoryOrder && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  工单号: {selectedRejectHistoryOrder.id}
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">
                  驳回次数: {selectedRejectHistoryOrder.auditRejectCount || 0} 次
                </span>
              </div>
              <div className="mt-1 text-slate-600">
                受检网点: {selectedRejectHistoryOrder.contactCompany} ({selectedRejectHistoryOrder.address})
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                驳回意见时间线
              </h4>

              {selectedRejectHistoryOrder.auditRejectHistory && selectedRejectHistoryOrder.auditRejectHistory.length > 0 ? (
                <div className="space-y-3">
                  {selectedRejectHistoryOrder.auditRejectHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-amber-600" />
                          第 {idx + 1} 次质检驳回 · {item.stage}
                        </span>
                        <span className="text-[11px] font-mono text-amber-700">
                          {item.time}
                        </span>
                      </div>
                      <div className="text-slate-800 bg-white p-2.5 rounded-lg border border-amber-100 text-[11px]">
                        <span className="font-semibold text-slate-900">驳回原因：</span>
                        {item.reason}
                      </div>
                      {item.suggestedAction && (
                        <div className="text-[11px] text-amber-800 flex items-center gap-1">
                          <span className="font-semibold">整改要求：</span>
                          {item.suggestedAction}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 text-right">
                        审核人: {item.auditor}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  暂无详细驳回历史明细
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  resubmitOrderAudit(selectedRejectHistoryOrder.id, '质检复核确认');
                  setSelectedRejectHistoryOrder(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition cursor-pointer"
              >
                发起内审重新复核
              </button>
              <button
                onClick={() => setSelectedRejectHistoryOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
