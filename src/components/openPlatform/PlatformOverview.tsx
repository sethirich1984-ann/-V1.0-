import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Zap,
  Globe2,
  Radio,
  FileCode2,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Sparkles,
  BarChart3,
  Server,
  Compass,
  Store,
  MapPin,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const PlatformOverview: React.FC = () => {
  const {
    merchants,
    projects,
    openApps,
    apiDocs,
    gatewayLogs,
    setActiveOpenTab,
    setSystemMode,
    switchTenantDirectly,
    setSelectedMerchantId,
  } = useApp();

  const totalRevenue = projects.reduce((acc, p) => acc + p.confirmedAmount, 0);
  const totalApiCalls = merchants.reduce((acc, m) => acc + (m.apiCallsUsed || 0), 0);
  const activeAppsCount = openApps.filter((a) => a.status === '启用').length;

  const productDistribution = [
    {
      name: '丰迹 (线下网格履约)',
      value: projects.filter((p) => p.productName.includes('丰迹')).reduce((acc, p) => acc + p.confirmedAmount, 0),
      color: '#4f46e5',
    },
    {
      name: '选址参谋 (空间数智)',
      value: projects.filter((p) => p.productName.includes('选址')).reduce((acc, p) => acc + p.confirmedAmount, 0) || 350000,
      color: '#06b6d4',
    },
    {
      name: '丰策智能体 (AI决策中台)',
      value: projects.filter((p) => p.productName.includes('丰策')).reduce((acc, p) => acc + p.confirmedAmount, 0) || 280000,
      color: '#10b981',
    },
    {
      name: '空间核验与增值服务',
      value: 120000,
      color: '#f59e0b',
    },
  ];

  const monthlyCallsData = [
    { month: '3月', 丰迹: 12500, 选址参谋: 8200, 丰策智能体: 4500 },
    { month: '4月', 丰迹: 21000, 选址参谋: 14500, 丰策智能体: 9800 },
    { month: '5月', 丰迹: 34000, 选址参谋: 22000, 丰策智能体: 15600 },
    { month: '6月', 丰迹: 48000, 选址参谋: 31000, 丰策智能体: 24000 },
    { month: '7月', 丰迹: 62000, 选址参谋: 42000, 丰策智能体: 38000 },
    { month: '8月', 丰迹: 78000, 选址参谋: 56000, 丰策智能体: 49000 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Ecosystem Headline */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>顺丰科技·企业数智底座与能力开放中台 V1.0</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              连接物理空间与商业决策的统一开放生态
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              基于顺丰百亿级物流网格、空间数智大模型与现场触达能力，为各行业商户提供统一身份认证、多产品矩阵授权（丰迹 / 选址参谋 / 丰策智能体）、API 开放网关与自动化财务结算。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveOpenTab('api_hub')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>API 接口沙箱联调</span>
            </button>
            <button
              onClick={() => setActiveOpenTab('merchants')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-medium text-xs transition cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>商户矩阵管理</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>接入企业商户</span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {merchants.length} <span className="text-xs font-normal text-slate-400">家</span>
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>本月新增 3 家企业</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>已颁发应用密钥</span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {openApps.length} <span className="text-xs font-normal text-slate-400">个应用</span>
            </div>
            <div className="text-[11px] text-cyan-300">
              {activeAppsCount} 个应用正常在线调用
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>多产品累计API调用</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {totalApiCalls.toLocaleString()} <span className="text-xs font-normal text-slate-400">次</span>
            </div>
            <div className="text-[11px] text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>网关可用性 99.98%</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>累计确认项目收入</span>
            </div>
            <div className="text-2xl font-bold text-amber-400 tracking-tight">
              ¥{(totalRevenue / 10000).toFixed(2)} <span className="text-xs font-normal text-slate-400">万元</span>
            </div>
            <div className="text-[11px] text-amber-300">
              共 {projects.length} 个跨业务核销项目
            </div>
          </div>
        </div>
      </div>

      {/* Ecosystem Architecture Visual */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>顺丰科技开放平台系统架构与产品协同拓扑</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              开放平台统一管理商户账号体系、应用鉴权与接口路由，向各垂直业务系统（丰迹、选址参谋、丰策）精准赋能。
            </p>
          </div>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full w-fit">
            统一底座 · 多元中台
          </span>
        </div>

        {/* Multi-tier diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Level 1: Open Platform Base */}
          <div className="bg-gradient-to-b from-indigo-50/70 to-slate-50 p-4 rounded-xl border border-indigo-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>开放平台企业底座</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-200/60 text-indigo-800 font-semibold">
                主数据层
              </span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                <span><strong>企业商户中心</strong>：统一社会信用代码、法人鉴权与多级租户体系</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                <span><strong>跨产品矩阵授权</strong>：丰迹 / 选址参谋 / 丰策智能体一键授权开通</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                <span><strong>财务确认收入中枢</strong>：跨业务线项目台账、对账与结算审计</span>
              </li>
            </ul>
            <button
              onClick={() => setActiveOpenTab('merchants')}
              className="w-full mt-2 py-1.5 text-xs text-indigo-700 bg-white hover:bg-indigo-50 rounded-lg border border-indigo-200 font-medium transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>查看商户矩阵</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Level 2: API Gateway */}
          <div className="bg-gradient-to-b from-cyan-50/70 to-slate-50 p-4 rounded-xl border border-cyan-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-cyan-600" />
                <span>统一 API 开放网关</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-200/60 text-cyan-800 font-semibold">
                能力中枢
              </span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 mt-0.5 shrink-0" />
                <span><strong>凭证与签名安全</strong>：AppID / AppSecret HMAC-SHA256 毫秒鉴权</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 mt-0.5 shrink-0" />
                <span><strong>IP白名单与频控</strong>：网关级防刷、配额扣减与细粒度权限管控</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 mt-0.5 shrink-0" />
                <span><strong>Webhook 异步订阅</strong>：工单状态、多媒体回传、内审结果全自动回调</span>
              </li>
            </ul>
            <button
              onClick={() => setActiveOpenTab('api_hub')}
              className="w-full mt-2 py-1.5 text-xs text-cyan-700 bg-white hover:bg-cyan-50 rounded-lg border border-cyan-200 font-medium transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>进入 API 中心</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Level 3: Vertical Business Engines */}
          <div className="bg-gradient-to-b from-emerald-50/70 to-slate-50 p-4 rounded-xl border border-emerald-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>垂直应用中台业务矩阵</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-800 font-semibold">
                业务落地
              </span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span><strong>丰迹运营后台</strong>：网格巡检、顺丰线下小哥触达、8 阶段工单闭环</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span><strong>选址参谋</strong>：商圈客流密度热力评估、周边竞品洞察与选址决策</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span><strong>丰策智能体</strong>：空间大模型智能推演与全自动商业策划分发</span>
              </li>
            </ul>
            <button
              onClick={() => setSystemMode('operator')}
              className="w-full mt-2 py-1.5 text-xs text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 font-medium transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>切换至丰迹运营后台</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics & Product Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Multi-product API Call Trend */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>多产品矩阵 API 调用与活跃趋势 (近6个月)</span>
              </h3>
              <p className="text-xs text-slate-500">按丰迹网格、选址参谋与丰策智能体统计调用分布</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">单位：次</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCallsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="丰迹" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="选址参谋" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="丰策智能体" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 cols: Revenue Proportion */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>跨业务线确认收入占比</span>
              </h3>
              <p className="text-xs text-slate-500">累计已确认营收结构分析</p>
            </div>
            <button
              onClick={() => setActiveOpenTab('projects')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>项目台账</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {productDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`¥${Number(value).toLocaleString()}`, '确认金额']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Featured Open Capabilities Cards & Gateway Real-time Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Featured APIs */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>开放能力矩阵与核心 API 服务</span>
              </h3>
              <p className="text-xs text-slate-500">标准 RESTful 接口，支持毫秒级响应与沙箱调试</p>
            </div>
            <button
              onClick={() => setActiveOpenTab('api_hub')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>查看全部 {apiDocs.length} 个接口</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {apiDocs.slice(0, 3).map((api) => (
              <div
                key={api.id}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/60 transition group flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {api.method}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800">{api.path}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                      {api.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">{api.name}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{api.description}</p>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="text-[11px] text-emerald-600 font-semibold">
                    成功率 {api.successRate}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    平均耗时 {api.avgLatency}ms
                  </div>
                  <button
                    onClick={() => setActiveOpenTab('api_hub')}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    <span>在线调试</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 cols: Live Gateway Traffic Log */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>API 网关实时调用流水</span>
              </h3>
              <p className="text-xs text-slate-500">商户应用调用实时监控</p>
            </div>
            <button
              onClick={() => setActiveOpenTab('apps')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>应用与密钥</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {gatewayLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-indigo-600 font-bold">
                    {log.apiPath}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    {log.statusCode} OK
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 truncate font-medium">
                  {log.merchantName}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>{log.timestamp.substring(11)}</span>
                  <span>IP: {log.clientIp}</span>
                  <span className="text-slate-500 font-mono">{log.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
