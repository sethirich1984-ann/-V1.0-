import React, { useState } from 'react';
import {
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Database,
  ShieldCheck,
  Code,
  RotateCw,
  Search,
  Eye,
  Server,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SyncLog } from '../../types';
import { Modal } from '../common/Modal';

export const DataSync: React.FC = () => {
  const {
    syncLogs,
    orders,
    runIncrementalSync,
    retrySyncLog,
    triggerWebhookPush,
    showToast,
  } = useApp();

  // Filters & State
  const [typeFilter, setTypeFilter] = useState<'all' | '订单数据' | '订单状态' | '增量同步'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);

  // Webhook Simulator State
  const [simWebhookType, setSimWebhookType] = useState<'订单数据' | '订单状态'>('订单数据');
  const [simSelectedOrderId, setSimSelectedOrderId] = useState<string>(orders[0]?.id || '');

  const filteredLogs = syncLogs.filter((l) => {
    const matchType = typeFilter === 'all' || l.type === typeFilter;
    const matchSearch =
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.orderId && l.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      l.payload.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const handleTriggerWebhook = () => {
    triggerWebhookPush(simWebhookType, simSelectedOrderId);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              数据同步
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              管理丰创执行引擎 Webhook 实时回调入库、增量轮询补偿机制、防倒流与消息幂等控制
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const anomalous = orders.filter((o) => o.anomalySeverity === 'high' || o.isTimeoutUnassigned || (o.auditRejectCount && o.auditRejectCount > 0));
                showToast('异常工单专项对账已启动', `正在向丰创主动拉取 ${anomalous.length} 笔异常工单的最新执行轨迹与驳回附件`, 'info');
                setTimeout(() => {
                  runIncrementalSync();
                }, 800);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded-lg transition border border-rose-200 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              异常工单定向补偿对账
            </button>
            <button
              onClick={runIncrementalSync}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              立即触发增量同步
            </button>
          </div>
        </div>

        {/* Sync Mechanism Cards (PRD 3.2.4.1 & 3.2.4.2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
          {/* Card 1 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Zap className="w-4 h-4 text-amber-500" />
              Webhook 实时回调 (PRD 3.2.4.1)
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              丰创在工单状态变更（接单、完成、审核）或多媒体证据（照片/视频/表单）采集完成时，毫秒级推送回调数据至丰迹。
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              回调端点正常监听中 (HTTPS)
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              幂等鉴权与防倒流 (PRD 3.2.4.1.3)
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              基于消息ID做唯一幂等防重处理；按照工单8大状态生命周期严格执行防倒流策略，忽略过期或乱序的回调报文。
            </p>
            <div className="pt-1 text-[11px] text-indigo-600 font-mono">
              Idempotency: Active (SHA-256)
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Database className="w-4 h-4 text-blue-600" />
              增量补偿同步 (PRD 3.2.4.2)
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              每15分钟轮询丰创“已变更订单列表”接口，主动拉取差异数据进行对账补偿，确保极端网络波动下数据零遗漏。
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5" />
              下次自动同步: 12分钟后
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Webhook Simulator Panel */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold">丰创回调联调模拟器 (Developer Webhook Tester)</h3>
              <p className="text-[11px] text-indigo-200 mt-0.5">
                模拟丰创执行引擎向丰迹发送状态流转或现场多媒体证据采集回传报文
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={simWebhookType}
              onChange={(e) => setSimWebhookType(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-800 border border-indigo-400/30 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="订单数据">订单多媒体数据回调 (照片/视频/表单)</option>
              <option value="订单状态">订单状态变更回调 (流转审核)</option>
            </select>

            <select
              value={simSelectedOrderId}
              onChange={(e) => setSimSelectedOrderId(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-indigo-400/30 rounded-lg text-xs text-white focus:outline-none"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} ({o.contactCompany})
                </option>
              ))}
            </select>

            <button
              onClick={handleTriggerWebhook}
              className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              发送模拟回调
            </button>
          </div>
        </div>
      </div>

      {/* Sync Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索日志ID、订单号、报文内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">全部同步类型</option>
              <option value="订单数据">订单数据回调</option>
              <option value="订单状态">订单状态回调</option>
              <option value="增量同步">增量同步补偿</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            共 <span className="font-semibold text-slate-900">{filteredLogs.length}</span> 条同步审计日志
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">日志流水ID</th>
                <th className="py-3.5 px-4">同步类型</th>
                <th className="py-3.5 px-4">关联工单号</th>
                <th className="py-3.5 px-4">处理状态</th>
                <th className="py-3.5 px-4">请求报文 Payload 摘要</th>
                <th className="py-3.5 px-4">同步时间戳</th>
                <th className="py-3.5 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    暂无符合条件的同步日志
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">{log.id}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          log.type === '订单数据'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : log.type === '订单状态'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{log.orderId || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium ${
                          log.status === '成功'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.status === '成功' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 max-w-xs truncate" title={log.payload}>
                      {log.payload}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{log.timestamp}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded transition font-medium cursor-pointer"
                        >
                          报文详情
                        </button>
                        {log.status === '失败' && (
                          <button
                            onClick={() => retrySyncLog(log.id)}
                            className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded transition font-medium cursor-pointer flex items-center gap-1"
                          >
                            <RotateCw className="w-3 h-3" />
                            重试
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
      </div>

      {/* Modal: Log Inspection Details */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="同步报文深度审计"
        subtitle={`查看流水号 ${selectedLog?.id} 的原始 JSON Payload 与系统响应`}
        maxWidth="2xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block">同步类型</span>
                <span className="font-semibold text-slate-900">{selectedLog.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block">关联工单</span>
                <span className="font-mono text-slate-800">{selectedLog.orderId || '批量对账'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">接收时间</span>
                <span className="font-mono text-slate-800">{selectedLog.timestamp}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">接收到的原始 Payload:</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                {selectedLog.payload}
              </pre>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">平台处理响应 Response:</span>
              <pre className="p-3 bg-slate-900 text-sky-300 rounded-lg font-mono text-[11px] overflow-x-auto max-h-40 border border-slate-800">
                {selectedLog.response}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
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
