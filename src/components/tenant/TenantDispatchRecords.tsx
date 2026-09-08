import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Building2,
  Phone,
  MapPin,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { DispatchRecord, OrderItem } from '../../types';

export const TenantDispatchRecords: React.FC = () => {
  const {
    currentTenant,
    dispatchRecords,
    orders,
    tasks,
    selectedDispatchId,
    setSelectedDispatchId,
    setSelectedOrderId,
    setActiveTenantTab,
    executeDispatch,
    showToast,
  } = useApp();

  const [taskFilter, setTaskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Only current tenant's dispatch records
  const tenantDispatches = useMemo(() => {
    if (!currentTenant) return [];
    return dispatchRecords.filter((d) => d.merchantId === currentTenant.id);
  }, [dispatchRecords, currentTenant]);

  // Filtered dispatches (sorted by createdAt desc)
  const filteredDispatches = useMemo(() => {
    return tenantDispatches
      .filter((d) => {
        const matchTask = taskFilter === 'all' || d.taskId === taskFilter;
        const matchStatus = statusFilter === 'all' || d.status === statusFilter;
        const matchSearch =
          d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.channel.toLowerCase().includes(searchTerm.toLowerCase());
        return matchTask && matchStatus && matchSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tenantDispatches, taskFilter, statusFilter, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDispatches.length / pageSize));
  const paginatedDispatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDispatches.slice(start, start + pageSize);
  }, [filteredDispatches, currentPage]);

  // Active Dispatch Detail
  const activeDispatch = useMemo(() => {
    if (!selectedDispatchId) return null;
    return tenantDispatches.find((d) => d.id === selectedDispatchId) || null;
  }, [tenantDispatches, selectedDispatchId]);

  // Orders under active dispatch
  const activeDispatchOrders = useMemo(() => {
    if (!activeDispatch) return [];
    return orders.filter((o) => o.dispatchId === activeDispatch.id);
  }, [orders, activeDispatch]);

  const handleExecuteDispatch = (dispatchId: string) => {
    executeDispatch(dispatchId);
    showToast('下发指令已触发', `正在向丰创渠道下发流水号 ${dispatchId} 的工单数据`, 'info');
  };

  const renderStatusBadge = (status: DispatchRecord['status']) => {
    switch (status) {
      case '全部成功':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            全部成功
          </span>
        );
      case '下发中':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            下发中
          </span>
        );
      case '待下发':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            待下发
          </span>
        );
      case '部分成功':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            部分成功
          </span>
        );
      case '全部失败':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            全部失败
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleViewOrderStatus = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveTenantTab('order_status');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 顶部标题栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            下单记录
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            展示当前商户的全部下单流水记录、点位下发数量及执行状态
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTenantTab('new_dispatch')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          新建下单
        </button>
      </div>

      {/* 筛选与搜索 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* 搜索 */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索流水号、任务名称、渠道..."
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
            <span className="text-slate-500">下单状态:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">全部状态</option>
              <option value="待下发">待下发</option>
              <option value="下发中">下发中</option>
              <option value="全部成功">全部成功</option>
              <option value="部分成功">部分成功</option>
              <option value="全部失败">全部失败</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500">
          共 <span className="font-bold text-slate-900">{filteredDispatches.length}</span> 条下单记录
        </div>
      </div>

      {/* 表格区 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">下单流水号</th>
                <th className="py-3 px-4">所属任务</th>
                <th className="py-3 px-4">执行渠道</th>
                <th className="py-3 px-4 text-center">订单数量</th>
                <th className="py-3 px-4 text-center">成功数</th>
                <th className="py-3 px-4 text-center">失败数</th>
                <th className="py-3 px-4">状态</th>
                <th className="py-3 px-4">下单时间</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDispatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    暂无符合条件的下单记录
                  </td>
                </tr>
              ) : (
                paginatedDispatches.map((record) => (
                  <tr
                    key={record.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      selectedDispatchId === record.id ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-indigo-700">
                      <button
                        onClick={() => setSelectedDispatchId(record.id)}
                        className="hover:underline cursor-pointer"
                      >
                        {record.id}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{record.taskName}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-[11px] font-semibold">
                        {record.channel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                      {record.orderCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-emerald-600">
                      {record.successCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold">
                      {record.failureCount > 0 ? (
                        <span className="text-rose-600">{record.failureCount}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{renderStatusBadge(record.status)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{record.createdAt}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.status === '待下发' && (
                          <button
                            type="button"
                            onClick={() => handleExecuteDispatch(record.id)}
                            className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 font-semibold cursor-pointer"
                          >
                            立即下发
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedDispatchId(record.id)}
                          className="px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 rounded font-semibold transition cursor-pointer"
                        >
                          查看
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页控制器（每页20条） */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div>
              显示第 {(currentPage - 1) * pageSize + 1} 至{' '}
              {Math.min(currentPage * pageSize, filteredDispatches.length)} 条，共{' '}
              {filteredDispatches.length} 条（每页 20 条）
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

      {/* 下单记录详情 Modal */}
      <Modal
        isOpen={!!activeDispatch}
        onClose={() => setSelectedDispatchId(null)}
        title={activeDispatch ? `下单记录详情 · ${activeDispatch.id}` : ''}
        maxWidth="max-w-4xl"
      >
        {activeDispatch && (
          <div className="space-y-5 text-xs">
            {/* 基本信息 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                下单基本信息
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">下单流水号</span>
                  <span className="font-mono font-bold text-slate-900">{activeDispatch.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">所属任务</span>
                  <span className="font-semibold text-slate-900">{activeDispatch.taskName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">执行渠道</span>
                  <span className="font-semibold text-blue-700">{activeDispatch.channel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">当前状态</span>
                  <div className="mt-0.5">{renderStatusBadge(activeDispatch.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block">订单数量</span>
                  <span className="font-mono font-bold text-slate-900">{activeDispatch.orderCount} 单</span>
                </div>
                <div>
                  <span className="text-slate-400 block">成功下发数</span>
                  <span className="font-mono font-bold text-emerald-600">{activeDispatch.successCount} 单</span>
                </div>
                <div>
                  <span className="text-slate-400 block">失败数</span>
                  <span className="font-mono font-bold text-rose-600">{activeDispatch.failureCount} 单</span>
                </div>
                <div>
                  <span className="text-slate-400 block">下单时间</span>
                  <span className="font-mono text-slate-600">{activeDispatch.createdAt}</span>
                </div>
              </div>

              {activeDispatch.status === '待下发' && (
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-amber-800 text-[11px]">
                    ⚠️ 本批次工单目前处于【待下发】状态，可点击右侧按钮立即下发至顺丰丰创通道。
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExecuteDispatch(activeDispatch.id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    立即下发工单
                  </button>
                </div>
              )}
            </div>

            {/* 订单列表（该批次下的所有订单） */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  该记录包含的订单列表 ({activeDispatchOrders.length} 单)
                </h4>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                      <th className="py-2.5 px-3">订单ID</th>
                      <th className="py-2.5 px-3">渠道订单号</th>
                      <th className="py-2.5 px-3">联系人</th>
                      <th className="py-2.5 px-3">受检网点</th>
                      <th className="py-2.5 px-3">状态</th>
                      <th className="py-2.5 px-3">失败原因</th>
                      <th className="py-2.5 px-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeDispatchOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          暂无关联订单数据
                        </td>
                      </tr>
                    ) : (
                      activeDispatchOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{ord.id}</td>
                          <td className="py-2.5 px-3 font-mono text-indigo-600">
                            {ord.channelOrderId || <span className="text-slate-400 font-normal">待下发</span>}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {ord.contactName} ({ord.contactPhone})
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate">
                            {ord.contactCompany}
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={ord.status} />
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {ord.status === 'cancelled' ? (
                              <span className="text-rose-600">商户主动取消派单</span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDispatchId(null);
                                handleViewOrderStatus(ord.id);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer inline-flex items-center gap-0.5"
                            >
                              <span>详情</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 弹窗底部操作 */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDispatchId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer"
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
