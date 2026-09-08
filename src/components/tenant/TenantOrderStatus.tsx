import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Building2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Play,
  CheckCircle2,
  Eye,
  Layers,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Truck,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { OrderDetailSubPage } from '../common/OrderDetailSubPage';
import { OrderItem } from '../../types';

// 8个标准业务流转进度节点 (PRD 3.3.3.2)
const TIMELINE_STEPS = [
  { key: 'created', label: '已下单' },
  { key: 'waiting_assign', label: '待接单' },
  { key: 'assigned_assign', label: '已接单' },
  { key: 'processing_start', label: '执行中' },
  { key: 'inner_auditing_waiting', label: '待审核' },
  { key: 'inner_auditing_pass', label: '内审通过' },
  { key: 'outer_auditing_waiting', label: '外审中' },
  { key: 'completed', label: '已完成' },
];

const STATUS_ORDER_RANK: Record<string, number> = {
  created: 1,
  waiting_assign: 2,
  assigned_assign: 3,
  processing_start: 4,
  processing_complete: 4.5,
  inner_auditing_waiting: 5,
  inner_auditing_pass: 6,
  outer_auditing_waiting: 7,
  outer_auditing_pass: 7.5,
  completed: 8,
  cancelled: -1,
};

export const TenantOrderStatus: React.FC = () => {
  const {
    currentTenant,
    orders,
    tasks,
    selectedOrderId,
    setSelectedOrderId,
    selectedDispatchId,
    setSelectedDispatchId,
    setActiveTenantTab,
    simulateStepOrder,
    updateOrder,
    cancelOrder,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // 修改订单与取消订单 Modal 状态
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [editCompany, setEditCompany] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const [cancellingOrder, setCancellingOrder] = useState<OrderItem | null>(null);

  const handleOpenEdit = (order: OrderItem) => {
    setEditingOrder(order);
    setEditCompany(order.contactCompany);
    setEditName(order.contactName);
    setEditPhone(order.contactPhone);
    setEditAddress(order.address);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    const res = updateOrder(editingOrder.id, {
      contactCompany: editCompany,
      contactName: editName,
      contactPhone: editPhone,
      address: editAddress,
    });
    if (res.success) {
      setEditingOrder(null);
    }
  };

  const handleConfirmCancel = () => {
    if (!cancellingOrder) return;
    const res = cancelOrder(cancellingOrder.id);
    if (res.success) {
      setCancellingOrder(null);
    }
  };

  // Tenant orders only
  const tenantOrders = useMemo(() => {
    if (!currentTenant) return [];
    return orders.filter((o) => o.merchantId === currentTenant.id);
  }, [orders, currentTenant]);

  // Filtered and sorted by createdAt desc
  const filteredOrders = useMemo(() => {
    return tenantOrders
      .filter((o) => {
        const matchDispatch = !selectedDispatchId || o.dispatchId === selectedDispatchId;
        const matchSearch =
          o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (o.channelOrderId && o.channelOrderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          o.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.contactCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.contactPhone.includes(searchTerm) ||
          o.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchTask = taskFilter === 'all' || o.taskId === taskFilter;
        return matchDispatch && matchSearch && matchStatus && matchTask;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tenantOrders, selectedDispatchId, searchTerm, statusFilter, taskFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return tenantOrders.find((o) => o.id === selectedOrderId) || null;
  }, [tenantOrders, selectedOrderId]);

  // Determine which steps are reached based on order status and operateTimes
  const getStepStatus = (order: OrderItem, stepKey: string, stepIndex: number) => {
    const currentRank = STATUS_ORDER_RANK[order.status] ?? 1;
    const stepRank = STATUS_ORDER_RANK[stepKey] ?? (stepIndex + 1);
    const operateTime = order.operateTimes?.[stepKey as keyof typeof order.operateTimes];

    const reached = currentRank >= stepRank;
    const isCurrent =
      order.status === stepKey ||
      (stepKey === 'processing_start' && order.status === 'processing_complete') ||
      (stepKey === 'outer_auditing_waiting' && order.status === 'outer_auditing_pass');

    return {
      reached,
      isCurrent,
      time: operateTime || (reached ? order.updatedAt || order.createdAt : null),
    };
  };

  // Dynamically generate complete timeline logs
  const getTimelineEvents = (order: OrderItem) => {
    const events: Array<{ action: string; details: string; time: string }> = [];
    const currentRank = STATUS_ORDER_RANK[order.status] ?? 1;

    if (order.operateTimes?.created || order.createdAt) {
      events.push({
        action: '工单已创建',
        details: '租户批量导入生成待下发工单',
        time: order.operateTimes?.created || order.createdAt,
      });
    }
    if (order.channelOrderId || currentRank >= 2) {
      events.push({
        action: '下发渠道成功',
        details: `已生成顺丰渠道单号 ${order.channelOrderId || 'FC-' + order.id.slice(-6)}，推送到顺丰网格调度大厅`,
        time: order.operateTimes?.waiting_assign || order.operateTimes?.created || order.createdAt,
      });
    }
    if (order.operateTimes?.waiting_assign || currentRank >= 2) {
      events.push({
        action: '顺丰网格接单池',
        details: `${order.routeInfo?.stationName || '顺丰速运网格营业部'}系统已匹配对应作业网格，正在智能指派专员`,
        time: order.operateTimes?.waiting_assign || order.operateTimes?.created || order.createdAt,
      });
    }
    if (order.operateTimes?.assigned_assign || currentRank >= 3) {
      events.push({
        action: '顺丰小哥已接单',
        details: `专员【${order.routeInfo?.courierName || '顺丰现场专员'}】已承揽工单，准备前往网点作业`,
        time: order.operateTimes?.assigned_assign || order.updatedAt || order.createdAt,
      });
    }
    if (order.operateTimes?.processing_start || currentRank >= 4) {
      events.push({
        action: '现场开始作业',
        details: '小哥已到达网点POI围栏内，开始核查门头及拍摄巡检问卷证据',
        time: order.operateTimes?.processing_start || order.updatedAt || order.createdAt,
      });
    }
    if (order.operateTimes?.processing_complete || currentRank >= 4.5) {
      events.push({
        action: '现场采集完毕',
        details: '现场照片及巡检核验答案已全部上传至顺丰大网',
        time: order.operateTimes?.processing_complete || order.updatedAt || order.createdAt,
      });
    }
    if (order.operateTimes?.inner_auditing_waiting || currentRank >= 5) {
      events.push({
        action: '进入内审质检',
        details: '工单资料进入丰迹运营中台内审质检队列',
        time: order.operateTimes?.inner_auditing_waiting || order.updatedAt || order.createdAt,
      });
    }
    if (order.operateTimes?.inner_auditing_pass || currentRank >= 6) {
      events.push({
        action: '内审质检通过',
        details: '丰迹平台质检审核通过，确认照片真实且无翻拍翻照风险',
        time: order.operateTimes?.inner_auditing_pass || order.updatedAt || order.createdAt,
      });
    }
    if (order.operateTimes?.outer_auditing_waiting || currentRank >= 7) {
      events.push({
        action: '等待租户外审',
        details: '已推送至租户端数据中心供业务部门确认复核',
        time: order.operateTimes?.outer_auditing_waiting || order.updatedAt || order.createdAt,
      });
    }
    if (order.operateTimes?.completed || currentRank >= 8) {
      events.push({
        action: '工单结单归档',
        details: '客户外审通过，全链路作业圆满闭环并归档至数据中心',
        time: order.operateTimes?.completed || order.updatedAt || order.createdAt,
      });
    }

    if (order.status === 'cancelled') {
      events.push({
        action: '工单已取消',
        details: order.failureReason || '工单已取消执行',
        time: order.updatedAt || order.createdAt,
      });
    }

    return events;
  };

  const handleSimulateNextStep = (orderId: string) => {
    simulateStepOrder(orderId);
    showToast('模拟推进成功', '工单执行节点已推进至下一业务阶段', 'success');
  };

  if (activeOrder) {
    return (
      <div className="max-w-7xl mx-auto">
        <OrderDetailSubPage
          order={activeOrder}
          onBack={() => setSelectedOrderId(null)}
          userRole="tenant_admin"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 顶部介绍 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            订单监控
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            实时监控顺丰末端网格小哥的工单履约进度，全透明查看流转时间轴与执行路由信息
          </p>
        </div>
        <div className="text-xs text-slate-500">
          商户：<span className="font-semibold text-slate-800">{currentTenant?.name}</span>
        </div>
      </div>

      {/* 筛选与搜索 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* 搜索 */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索订单ID、联系人、手机、网点..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-64 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* 按任务筛选 */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">所属任务:</span>
            <select
              value={taskFilter}
              onChange={(e) => {
                setTaskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">全部任务</option>
              {tasks
                .filter((t) => t.merchantId === currentTenant?.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          {/* 按状态筛选 */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">当前状态:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">全部状态</option>
              <option value="waiting_assign">待接单</option>
              <option value="assigned_assign">已接单</option>
              <option value="processing_start">执行中</option>
              <option value="completed">已完成</option>
              <option value="inner_auditing_waiting">待审核</option>
              <option value="inner_auditing_pass">内审通过</option>
              <option value="outer_auditing_waiting">外审中</option>
              <option value="outer_auditing_pass">外审通过</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          {/* 关联下单记录过滤标签 */}
          {selectedDispatchId && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-medium border border-indigo-200">
              <span>关联下单记录: <b className="font-mono">{selectedDispatchId}</b></span>
              <button
                type="button"
                onClick={() => setSelectedDispatchId(null)}
                className="hover:text-rose-600 transition cursor-pointer ml-1 p-0.5"
                title="清除下单记录筛选"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="text-slate-500">
          共 <span className="font-bold text-slate-900">{filteredOrders.length}</span> 条订单
        </div>
      </div>

      {/* 订单表格 (PRD 3.3.3.1 规范) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">订单ID</th>
                <th className="py-3 px-4">所属任务</th>
                <th className="py-3 px-4">联系人</th>
                <th className="py-3 px-4">联系电话</th>
                <th className="py-3 px-4">当前状态</th>
                <th className="py-3 px-4">创建时间</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    暂无符合条件的订单记录
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      selectedOrderId === order.id ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        className="hover:text-indigo-600 cursor-pointer"
                      >
                        {order.id}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{order.taskName}</div>
                      <div className="text-[11px] text-slate-400 font-normal mt-0.5 truncate max-w-[200px]">
                        {order.contactCompany}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{order.contactName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{order.contactPhone}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {order.createdAt}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* 当待接单状态时，可以修改和去掉操作 */}
                        {(order.status === 'waiting_assign' || order.status === 'created') && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(order)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition cursor-pointer text-xs"
                              title="修改网点联系人与地址"
                            >
                              <Edit2 className="w-3 h-3 text-slate-500" />
                              <span>修改</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancellingOrder(order)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded font-medium transition cursor-pointer text-xs"
                              title="取消/去掉该订单"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                              <span>去掉</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className="px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 rounded font-semibold transition cursor-pointer"
                        >
                          详情
                        </button>
                        {order.evidenceData && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              setActiveTenantTab('order_data');
                            }}
                            className="px-2.5 py-1 text-purple-600 hover:bg-purple-50 rounded font-medium transition cursor-pointer"
                          >
                            采集数据
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页器（每页20条） */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div>
              显示第 {(currentPage - 1) * pageSize + 1} 至{' '}
              {Math.min(currentPage * pageSize, filteredOrders.length)} 条，共{' '}
              {filteredOrders.length} 条（每页 20 条）
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-mono font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 订单详情 Modal */}
      <Modal
        isOpen={!!activeOrder}
        onClose={() => setSelectedOrderId(null)}
        title={activeOrder ? `订单详情 · ${activeOrder.id}` : ''}
        maxWidth="max-w-4xl"
      >
        {activeOrder && (
          <div className="space-y-6 text-xs">
            {/* 1. 基本信息 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  订单基本信息
                </h4>
                {(activeOrder.status === 'waiting_assign' || activeOrder.status === 'created') && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(activeOrder)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded font-medium transition cursor-pointer text-xs shadow-xs"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>修改信息</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancellingOrder(activeOrder)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded font-medium transition cursor-pointer text-xs shadow-xs"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                      <span>去掉订单</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block">订单ID (丰迹)</span>
                  <span className="font-mono font-bold text-slate-900">{activeOrder.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">所属任务</span>
                  <span className="font-semibold text-slate-900">{activeOrder.taskName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">受检网点</span>
                  <span className="font-semibold text-slate-900">{activeOrder.contactCompany}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">联系人 / 手机</span>
                  <span className="font-medium text-slate-800">
                    {activeOrder.contactName} ({activeOrder.contactPhone})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">当前状态</span>
                  <div className="mt-0.5">
                    <StatusBadge status={activeOrder.status} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block">创建时间 / 更新时间</span>
                  <span className="font-mono text-slate-600 text-[11px]">{activeOrder.createdAt}</span>
                </div>
                <div className="col-span-2 md:col-span-3">
                  <span className="text-slate-400 block">网点地址 (POI)</span>
                  <span className="text-slate-700 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {activeOrder.address}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. 执行进度（时间轴展示，未到达节点灰色显示） */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  执行进度时间轴（未到达节点灰色显示）
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateNextStep(activeOrder.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition cursor-pointer text-[11px]"
                  >
                    <Play className="w-3 h-3" />
                    <span>模拟推进下一节点</span>
                  </button>
                </div>
              </div>

              {/* 横向进度条 (8个阶段) */}
              <div className="pt-4 pb-2 overflow-x-auto">
                <div className="flex items-center min-w-[700px] justify-between relative px-4">
                  {/* 连接底线 */}
                  <div className="absolute left-8 right-8 top-4 h-0.5 bg-slate-200 -z-0" />

                  {TIMELINE_STEPS.map((step, idx) => {
                    const { reached, isCurrent, time } = getStepStatus(activeOrder, step.key, idx);
                    return (
                      <div key={step.key} className="flex flex-col items-center relative z-10 text-center w-20">
                        {/* 节点图标 */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm'
                              : reached
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {reached ? <Check className="w-4 h-4" /> : <span className="text-[11px] font-mono">{idx + 1}</span>}
                        </div>

                        {/* 节点文本 */}
                        <span
                          className={`mt-2 font-semibold text-xs whitespace-nowrap ${
                            isCurrent
                              ? 'text-indigo-600 font-bold'
                              : reached
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>

                        {/* 时间 */}
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {time ? time.split(' ')[1] || time : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 节点流转流水明细 */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-slate-500 font-medium block mb-2 text-[11px]">阶段流转记录：</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {getTimelineEvents(activeOrder).map((item, i) => (
                    <div
                      key={i}
                      className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800">{item.action}</span>
                        <span className="text-slate-500">· {item.details}</span>
                      </div>
                      <span className="font-mono text-slate-400 text-[10px] shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. 路由信息 (PRD 3.3.3.2: 执行站点、接单人（姓名、联系方式）) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-indigo-600" />
                顺丰末端网格路由信息
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] mb-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>执行站点（末端网格营业部）</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {activeOrder.routeInfo?.stationName || '顺丰速运·深圳南山科技园营业部'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    服务代码: 755W-0982 · 顺丰大网直营服务点
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>接单人（末端现场执行专员）</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>{activeOrder.routeInfo?.courierName || '周武（顺丰专员）'}</span>
                    <span className="text-xs px-2 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                      在岗执行中
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{activeOrder.routeInfo?.courierPhone || '13900139004'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 弹窗底部操作 */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                {activeOrder.evidenceData && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrderId(activeOrder.id);
                      setActiveTenantTab('order_data');
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition cursor-pointer text-xs shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>查看该订单现场采集数据</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer text-xs"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 修改订单 Modal (待接单状态可用) */}
      <Modal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title="修改订单信息"
        subtitle={`订单流水号: ${editingOrder?.id} · 仅在【待接单】状态支持修改受检网点联系人与地址`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">受检网点 (门店/单位)</label>
            <input
              type="text"
              required
              value={editCompany}
              onChange={(e) => setEditCompany(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">网点联系人</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">联系电话</label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">详细履约地址 (POI)</label>
            <textarea
              rows={3}
              required
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingOrder(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition cursor-pointer font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-semibold cursor-pointer shadow-xs"
            >
              保存修改
            </button>
          </div>
        </form>
      </Modal>

      {/* 取消/去掉订单确认 Modal (待接单状态可用) */}
      <Modal
        isOpen={!!cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        title="确认去掉订单"
        subtitle="向顺丰运力中心同步取消工单指令，取消后该工单将终止履约"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">您确定要去掉以下待接单工单吗？</p>
              <p className="mt-1 font-mono text-[11px] text-amber-800">
                订单号: <span className="font-bold">{cancellingOrder?.id}</span> · {cancellingOrder?.contactCompany}
              </p>
              <p className="mt-0.5 text-[11px] text-amber-700">
                联系人: {cancellingOrder?.contactName} ({cancellingOrder?.contactPhone})
              </p>
            </div>
          </div>

          <p className="text-slate-600">
            确认去掉后，系统将自动向顺丰大网调度池撤回该笔工单，订单状态将变更为【已取消】。
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCancellingOrder(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition cursor-pointer font-medium"
            >
              返回
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition font-semibold cursor-pointer shadow-xs"
            >
              确认去掉
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
