import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Edit2,
  XCircle,
  Eye,
  Play,
  RotateCw,
  Building2,
  Phone,
  User,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OrderItem, OrderStatusCode } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { OrderDetailView } from './OrderDetailView';

export const OrderManagement: React.FC = () => {
  const {
    orders,
    tasks,
    merchants,
    updateOrder,
    cancelOrder,
    simulateStepOrder,
    simulateAllActiveOrders,
    selectedOrderId,
    setSelectedOrderId,
    showToast,
  } = useApp();

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [merchantFilter, setMerchantFilter] = useState<string>('all');
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // Pagination State (PRD: Default 20 per page, sorted by createdAt desc)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Edit / Cancel Modal State
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<OrderItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Extract channels
  const channelList = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.channel) set.add(o.channel);
    });
    if (!set.has('丰创')) set.add('丰创');
    if (!set.has('顺丰同城')) set.add('顺丰同城');
    return Array.from(set);
  }, [orders]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const matchSearch =
          o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (o.channelOrderId && o.channelOrderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (o.dispatchId && o.dispatchId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          o.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.contactCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.contactPhone.includes(searchTerm) ||
          o.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchMerchant = merchantFilter === 'all' || o.merchantId === merchantFilter;
        const matchTask = taskFilter === 'all' || o.taskId === taskFilter;
        const matchChannel = channelFilter === 'all' || o.channel === channelFilter;
        return matchSearch && matchStatus && matchMerchant && matchTask && matchChannel;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchTerm, statusFilter, merchantFilter, taskFilter, channelFilter]);

  // Pagination Slice
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Active Selected Order for Dedicated Detail Page
  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // If an order is selected, render the dedicated OrderDetailView page!
  if (activeOrder) {
    return <OrderDetailView order={activeOrder} onBack={() => setSelectedOrderId(null)} />;
  }

  const openEditModal = (o: OrderItem) => {
    if (o.status !== 'waiting_assign' && o.status !== 'created') {
      showToast('无法修改', '只有【待接单】或【待下发】状态的订单可以修改信息', 'warning');
      return;
    }
    setEditingOrder(o);
    setEditName(o.contactName);
    setEditPhone(o.contactPhone);
    setEditCompany(o.contactCompany);
    setEditAddress(o.address);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    const res = updateOrder(editingOrder.id, {
      contactName: editName.trim(),
      contactPhone: editPhone.trim(),
      contactCompany: editCompany.trim(),
      address: editAddress.trim(),
    });
    if (res.success) {
      setEditingOrder(null);
    }
  };

  const openCancelModal = (o: OrderItem) => {
    if (o.status !== 'waiting_assign' && o.status !== 'created') {
      showToast('无法取消', '只有【待接单】或【待下发】状态的订单可以取消，现场已作业订单不可取消', 'warning');
      return;
    }
    setCancellingOrder(o);
  };

  const handleConfirmCancel = () => {
    if (!cancellingOrder) return;
    cancelOrder(cancellingOrder.id);
    setCancellingOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              订单管理 (PRD 3.2.3)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              展示丰迹全量业务工单，支持多维度过滤筛选、跳转详情新页面、信息修改与渠道取消对接
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={simulateAllActiveOrders}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition cursor-pointer"
              title="一键批量将进行中工单推进一个节点"
            >
              <RotateCw className="w-3.5 h-3.5" />
              一键推进活跃订单
            </button>
          </div>
        </div>

        {/* 3.2.3.1 Filter Bar (状态筛选、任务筛选、商户筛选、渠道筛选、按联系人/渠道订单号搜索) */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索联系人 / 渠道单号 / 订单ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="all">全部订单状态</option>
              <option value="created">已下单</option>
              <option value="waiting_assign">待接单</option>
              <option value="assigned_assign">已接单</option>
              <option value="processing_start">执行中</option>
              <option value="processing_complete">已完成 (已采集)</option>
              <option value="inner_auditing_waiting">待审核 (内审待审)</option>
              <option value="inner_auditing_pass">内审通过</option>
              <option value="outer_auditing_waiting">外审中</option>
              <option value="outer_auditing_pass">外审通过</option>
              <option value="completed">已完成 (全流程归档)</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          {/* Task Filter */}
          <div>
            <select
              value={taskFilter}
              onChange={(e) => {
                setTaskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="all">全部所属任务</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Merchant Filter */}
          <div>
            <select
              value={merchantFilter}
              onChange={(e) => {
                setMerchantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="all">全部关联商户</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Filter */}
          <div>
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="all">全部执行渠道</option>
              {channelList.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3.2.3.1 Order List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>
            已筛选出 <span className="font-bold text-slate-900">{totalItems}</span> 个订单
            {searchTerm && <span className="ml-1 text-slate-400">（匹配关键词: "{searchTerm}"）</span>}
          </div>
          <div className="flex items-center gap-2">
            <span>每页展示:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 cursor-pointer"
            >
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页 (默认)</option>
              <option value={50}>50 条/页</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th className="px-4 py-3.5 whitespace-nowrap">订单ID</th>
                <th className="px-4 py-3.5 whitespace-nowrap">下单流水号</th>
                <th className="px-4 py-3.5 whitespace-nowrap">渠道订单号</th>
                <th className="px-4 py-3.5 whitespace-nowrap">关联商户</th>
                <th className="px-4 py-3.5 whitespace-nowrap">所属任务</th>
                <th className="px-4 py-3.5 whitespace-nowrap">执行渠道</th>
                <th className="px-4 py-3.5 whitespace-nowrap">联系人 / 受检单位</th>
                <th className="px-4 py-3.5 whitespace-nowrap">状态</th>
                <th className="px-4 py-3.5 whitespace-nowrap">创建时间</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <span>未找到符合筛选条件的订单记录</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const canModify = order.status === 'waiting_assign' || order.status === 'created';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-indigo-50/40 transition group"
                    >
                      {/* 丰迹订单ID */}
                      <td className="px-4 py-3.5 font-mono font-bold text-indigo-600 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="hover:underline text-left cursor-pointer"
                          title="点击跳转查看订单详情新页面"
                        >
                          {order.id}
                        </button>
                      </td>

                      {/* 下单流水号 */}
                      <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {order.dispatchId}
                      </td>

                      {/* 渠道订单号 */}
                      <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                        {order.channelOrderId ? (
                          <span className="text-purple-700 font-semibold">{order.channelOrderId}</span>
                        ) : (
                          <span className="text-slate-400 italic">待下发生成</span>
                        )}
                      </td>

                      {/* 关联商户 */}
                      <td className="px-4 py-3.5 text-slate-800 font-medium max-w-[160px] truncate" title={order.merchantName}>
                        {order.merchantName}
                      </td>

                      {/* 所属任务 */}
                      <td className="px-4 py-3.5 text-slate-800 font-medium max-w-[180px] truncate" title={order.taskName}>
                        {order.taskName}
                      </td>

                      {/* 执行渠道 */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {order.channel}
                        </span>
                      </td>

                      {/* 联系人 / 受检单位 */}
                      <td className="px-4 py-3.5 max-w-[180px]">
                        <div className="font-semibold text-slate-900 truncate" title={order.contactCompany}>
                          {order.contactCompany}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {order.contactName} ({order.contactPhone})
                        </div>
                      </td>

                      {/* 状态 */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* 创建时间 */}
                      <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {order.createdAt}
                      </td>

                      {/* 操作 (查看/修改/取消) */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* 查看 -> 跳转订单详情新页面 */}
                          <button
                            onClick={() => setSelectedOrderId(order.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition cursor-pointer flex items-center gap-1"
                            title="跳转查看完整订单详情页面"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            查看
                          </button>

                          {/* 修改 (待接单/待下发可用) */}
                          <button
                            onClick={() => openEditModal(order)}
                            disabled={!canModify}
                            className={`px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1 ${
                              canModify
                                ? 'text-slate-700 hover:bg-slate-100 cursor-pointer font-medium'
                                : 'text-slate-300 cursor-not-allowed'
                            }`}
                            title={canModify ? '修改网点联系人与地址' : '当前状态不可修改'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            修改
                          </button>

                          {/* 取消 (待接单/待下发可用) */}
                          <button
                            onClick={() => openCancelModal(order)}
                            disabled={!canModify}
                            className={`px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1 ${
                              canModify
                                ? 'text-rose-600 hover:bg-rose-50 cursor-pointer font-medium'
                                : 'text-slate-300 cursor-not-allowed'
                            }`}
                            title={canModify ? '调用渠道取消工单' : '当前状态不可取消'}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            取消
                          </button>

                          {/* 快捷推进演示按钮 */}
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => simulateStepOrder(order.id)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="单步推进生命周期"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (PRD 3.2.3.1: 分页每页20条) */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 bg-white">
          <div>
            第 <span className="font-semibold text-slate-900">{currentPage}</span> /{' '}
            <span className="font-semibold text-slate-900">{totalPages}</span> 页 · 共{' '}
            <span className="font-semibold text-slate-900">{totalItems}</span> 条记录
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                currentPage === 1
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              上一页
            </button>

            {/* Page number chips */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition cursor-pointer ${
                          currentPage === p
                            ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                currentPage === totalPages
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium'
              }`}
            >
              下一页
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Order Modal */}
      <Modal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title="修改订单信息 (PRD 3.2.3.1)"
        subtitle={`订单ID: ${editingOrder?.id} · 仅在【待接单】或【待下发】状态允许修改网点联系人与地址`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">受检单位 (联系人公司)</label>
            <input
              type="text"
              required
              value={editCompany}
              onChange={(e) => setEditCompany(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">联系电话</label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">详细地址</label>
            <textarea
              rows={3}
              required
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium cursor-pointer"
            >
              保存修改
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Order Confirm Modal */}
      <Modal
        isOpen={!!cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        title="确认取消订单 (PRD 3.2.3.1)"
        subtitle="向渠道发起取消工单请求，取消后该工单将不可恢复"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">您正在取消以下工单：</p>
              <p className="mt-1 font-mono text-[11px]">
                {cancellingOrder?.id} · {cancellingOrder?.contactCompany}
              </p>
              <p className="mt-1 text-[11px] text-amber-700">
                所属任务：{cancellingOrder?.taskName}
              </p>
            </div>
          </div>

          <p className="text-slate-600">
            确认后将调用渠道取消订单接口，订单状态变更为【已取消】。
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => setCancellingOrder(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition cursor-pointer font-medium"
            >
              返回
            </button>
            <button
              onClick={handleConfirmCancel}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition font-medium cursor-pointer"
            >
              确认取消订单
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
