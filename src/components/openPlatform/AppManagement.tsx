import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OpenPlatformApp, ApiGatewayLog } from '../../types';
import {
  KeyRound,
  ShieldCheck,
  Globe2,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Radio,
  Send,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Server,
  Layers,
  Activity,
  Terminal,
  Search,
  ExternalLink,
} from 'lucide-react';

export const AppManagement: React.FC = () => {
  const {
    openApps,
    merchants,
    gatewayLogs,
    addOpenApp,
    updateOpenApp,
    toggleAppStatus,
    regenerateAppSecret,
    sendWebhookTestPing,
    showToast,
  } = useApp();

  const [selectedApp, setSelectedApp] = useState<OpenPlatformApp>(openApps[0] || null);
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals & Forms
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newAppName, setNewAppName] = useState<string>('');
  const [newMerchantId, setNewMerchantId] = useState<string>(merchants[0]?.id || '');
  const [newPermissions, setNewPermissions] = useState<string[]>([
    'order:create',
    'order:query',
    'poi:verify',
  ]);

  // IP Whitelist Add
  const [newIpInput, setNewIpInput] = useState<string>('');

  // Webhook Test State
  const [isPinging, setIsPinging] = useState<boolean>(false);

  // Filter logs
  const [logSearch, setLogSearch] = useState<string>('');

  const handleCopy = (text: string, keyIdentifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyIdentifier);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('已复制到剪贴板', text, 'info');
  };

  const toggleShowSecret = (appId: string) => {
    setShowSecretMap((prev) => ({ ...prev, [appId]: !prev[appId] }));
  };

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) {
      showToast('请填写应用名称', '', 'warning');
      return;
    }
    const merchant = merchants.find((m) => m.id === newMerchantId) || merchants[0];
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const randomAppId = `sf_app_${Date.now().toString(36)}`;

    addOpenApp({
      appName: newAppName.trim(),
      appId: randomAppId,
      appSecret: `sec_${randomHex}`,
      merchantId: merchant.id,
      merchantName: merchant.name,
      status: '启用',
      ipWhitelist: [],
      permissions: newPermissions,
      webhookUrl: '',
      subscribedEvents: ['ORDER_CREATED', 'ORDER_STATUS_CHANGED'],
    });

    setIsCreateModalOpen(false);
    setNewAppName('');
  };

  const handleAddIp = () => {
    if (!newIpInput.trim() || !selectedApp) return;
    const currentIps = selectedApp.ipWhitelist || [];
    if (currentIps.includes(newIpInput.trim())) {
      showToast('IP 已存在', '', 'warning');
      return;
    }
    const updated = [...currentIps, newIpInput.trim()];
    updateOpenApp(selectedApp.id, { ipWhitelist: updated });
    setSelectedApp((prev) => ({ ...prev, ipWhitelist: updated }));
    setNewIpInput('');
  };

  const handleRemoveIp = (ipToRemove: string) => {
    if (!selectedApp) return;
    const updated = (selectedApp.ipWhitelist || []).filter((ip) => ip !== ipToRemove);
    updateOpenApp(selectedApp.id, { ipWhitelist: updated });
    setSelectedApp((prev) => ({ ...prev, ipWhitelist: updated }));
  };

  const handleSaveWebhook = (url: string, secret: string, events: string[]) => {
    if (!selectedApp) return;
    updateOpenApp(selectedApp.id, {
      webhookUrl: url,
      webhookSecret: secret,
      subscribedEvents: events,
    });
    setSelectedApp((prev) => ({
      ...prev,
      webhookUrl: url,
      webhookSecret: secret,
      subscribedEvents: events,
    }));
  };

  const handleTestWebhook = async () => {
    if (!selectedApp) return;
    setIsPinging(true);
    await sendWebhookTestPing(selectedApp.id);
    setIsPinging(false);
  };

  const availablePermissions = [
    { key: 'order:create', label: '工单下发创建权限 (order:create)' },
    { key: 'order:query', label: '工单流转与轨迹查询 (order:query)' },
    { key: 'poi:verify', label: '空间门店真实性核验 (poi:verify)' },
    { key: 'geo:accuracy', label: '地址逆地理与网格编码 (geo:accuracy)' },
    { key: 'location:eval', label: '选址商圈客流分析 (location:eval)' },
    { key: 'webhook:event', label: '网关事件推送监听 (webhook:event)' },
  ];

  const availableEvents = [
    { key: 'ORDER_CREATED', label: '工单创建成功 (ORDER_CREATED)' },
    { key: 'ORDER_STATUS_CHANGED', label: '工单状态流转变更 (ORDER_STATUS_CHANGED)' },
    { key: 'MEDIA_COLLECT_COMPLETED', label: '现场多媒体采集回传 (MEDIA_COLLECT_COMPLETED)' },
    { key: 'AUDIT_PASSED', label: '工单内审质检通过 (AUDIT_PASSED)' },
    { key: 'EVAL_REPORT_GENERATED', label: '智能选址推演报告生成 (EVAL_REPORT_GENERATED)' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <KeyRound className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">应用凭证与安全配置</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            管理商户开放平台接入凭证 (AppID / AppSecret)、IP 白名单、调用鉴权范围及 Webhook 事件订阅推送。
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>创建开发者应用</span>
        </button>
      </div>

      {/* Main Grid: Left App Selection & Right App Detail / Security Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 cols: App List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-700 px-1 flex items-center justify-between">
            <span>已登记应用 ({openApps.length})</span>
            <span className="text-[11px] font-normal text-slate-400">选择应用以管理凭证</span>
          </div>

          <div className="space-y-2.5">
            {openApps.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 rounded-xl border transition cursor-pointer text-left space-y-2 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{app.appName}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        app.status === '启用'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 truncate">{app.merchantName}</div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>AppID: {app.appId}</span>
                    <span className="text-indigo-600 font-medium">今日调用: {app.todayCalls}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 cols: Active App Details */}
        {selectedApp && (
          <div className="lg:col-span-8 space-y-6">
            {/* App Credentials Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{selectedApp.appName}</h2>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        selectedApp.status === '启用'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {selectedApp.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    所属企业：{selectedApp.merchantName} · 创建于 {selectedApp.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAppStatus(selectedApp.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      selectedApp.status === '启用'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {selectedApp.status === '启用' ? '停用应用' : '启用应用'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('重置后旧 AppSecret 将立即失效，确认生成新密钥吗？')) {
                        const newSec = regenerateAppSecret(selectedApp.id);
                        setSelectedApp((prev) => ({ ...prev, appSecret: newSec }));
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重置密钥</span>
                  </button>
                </div>
              </div>

              {/* Key Values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AppID */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>应用唯一标识 (AppID)</span>
                    <button
                      onClick={() => handleCopy(selectedApp.appId, 'appId')}
                      className="text-indigo-600 hover:text-indigo-800 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'appId' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'appId' ? '已复制' : '复制'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-900 select-all">
                    {selectedApp.appId}
                  </div>
                </div>

                {/* AppSecret */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>应用私钥 (AppSecret)</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleShowSecret(selectedApp.id)}
                        className="text-slate-500 hover:text-slate-800 text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {showSecretMap[selectedApp.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showSecretMap[selectedApp.id] ? '隐藏' : '显示'}</span>
                      </button>
                      <button
                        onClick={() => handleCopy(selectedApp.appSecret, 'appSecret')}
                        className="text-indigo-600 hover:text-indigo-800 text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'appSecret' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'appSecret' ? '已复制' : '复制'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-900 select-all truncate">
                    {showSecretMap[selectedApp.id] ? selectedApp.appSecret : '••••••••••••••••••••••••••••••••'}
                  </div>
                </div>
              </div>

              {/* IP Whitelist Section */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>IP 安全白名单 (IP Whitelist)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    未配置白名单时默认允许所有客户端 IP 发起请求
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="输入公网 IP 地址 (例如: 112.97.64.120)"
                    value={newIpInput}
                    onChange={(e) => setNewIpInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                  <button
                    onClick={handleAddIp}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    添加 IP
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedApp.ipWhitelist?.length > 0 ? (
                    selectedApp.ipWhitelist.map((ip) => (
                      <span
                        key={ip}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-medium border border-slate-200"
                      >
                        <span>{ip}</span>
                        <button
                          onClick={() => handleRemoveIp(ip)}
                          className="hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                      当前未限制 IP 白名单 (生产环境建议配置以防凭证泄露)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Webhook Callback Settings */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
                    <Radio className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Webhook 异步事件推送订阅</h3>
                </div>

                <button
                  onClick={handleTestWebhook}
                  disabled={isPinging || !selectedApp.webhookUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{isPinging ? '发送测试 Ping 中...' : '发送测试 Webhook Ping'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">商户接收回调 URL</label>
                  <input
                    type="text"
                    value={selectedApp.webhookUrl || ''}
                    onChange={(e) =>
                      setSelectedApp((prev) => ({ ...prev, webhookUrl: e.target.value }))
                    }
                    onBlur={(e) =>
                      handleSaveWebhook(
                        e.target.value,
                        selectedApp.webhookSecret || '',
                        selectedApp.subscribedEvents || []
                      )
                    }
                    placeholder="https://your-domain.com/sf-gateway/webhook"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Webhook 验签密钥 (Token)</label>
                  <input
                    type="text"
                    value={selectedApp.webhookSecret || ''}
                    onChange={(e) =>
                      setSelectedApp((prev) => ({ ...prev, webhookSecret: e.target.value }))
                    }
                    onBlur={(e) =>
                      handleSaveWebhook(
                        selectedApp.webhookUrl || '',
                        e.target.value,
                        selectedApp.subscribedEvents || []
                      )
                    }
                    placeholder="whsec_xxxxxxxxxxxx"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Subscribed Events Checklist */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 block">订阅推送事件类型</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableEvents.map((evt) => {
                    const isChecked = selectedApp.subscribedEvents?.includes(evt.key);
                    return (
                      <label
                        key={evt.key}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...(selectedApp.subscribedEvents || []), evt.key]
                              : (selectedApp.subscribedEvents || []).filter((k) => k !== evt.key);
                            handleSaveWebhook(
                              selectedApp.webhookUrl || '',
                              selectedApp.webhookSecret || '',
                              next
                            );
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-mono text-[11px]">{evt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gateway Call History Logs for this app / all apps */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>开放网关调用监控日志 (Gateway Access Logs)</span>
            </h3>
            <p className="text-xs text-slate-500">
              记录所有通过应用凭证鉴权的接口请求与 Webhook 推送详情
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索接口路径 / IP / 商户..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">请求时间</th>
                <th className="py-2.5 px-3">AppID / 商户</th>
                <th className="py-2.5 px-3">请求方式 & 接口路径</th>
                <th className="py-2.5 px-3">客户端 IP</th>
                <th className="py-2.5 px-3">响应状态</th>
                <th className="py-2.5 px-3">耗时</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gatewayLogs
                .filter(
                  (l) =>
                    !logSearch ||
                    l.apiPath.includes(logSearch) ||
                    l.merchantName.includes(logSearch) ||
                    l.clientIp.includes(logSearch)
                )
                .map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                    <td className="py-2 px-3 text-slate-500">{log.timestamp}</td>
                    <td className="py-2 px-3">
                      <div className="text-slate-900 font-bold font-sans">{log.merchantName}</div>
                      <div className="text-slate-400 text-[10px]">{log.appId}</div>
                    </td>
                    <td className="py-2 px-3 text-indigo-600 font-bold">
                      <span className="text-slate-500 mr-1.5">{log.method}</span>
                      {log.apiPath}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{log.clientIp}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {log.statusCode} OK
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-bold">{log.latencyMs}ms</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create App Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">创建新开发者应用</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">应用名称 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 顺意优选·智慧门店系统"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">归属企业商户 *</label>
                <select
                  value={newMerchantId}
                  onChange={(e) => setNewMerchantId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">初始授权接口权限 (Scopes)</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {availablePermissions.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPermissions.includes(perm.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewPermissions((prev) => [...prev, perm.key]);
                          } else {
                            setNewPermissions((prev) => prev.filter((k) => k !== perm.key));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] text-slate-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20"
                >
                  立即创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
