import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OpenPlatformApiDoc } from '../../types';
import {
  Terminal,
  Code2,
  Play,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  BookOpen,
  Send,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const ApiHub: React.FC = () => {
  const { apiDocs, executeApiSandboxTest, showToast } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedApi, setSelectedApi] = useState<OpenPlatformApiDoc>(apiDocs[0]);

  // Sandbox State
  const [customAppId, setCustomAppId] = useState<string>('sf_app_sy_20260301');
  const [customBody, setCustomBody] = useState<string>(selectedApi?.requestSample || '{}');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sandboxResult, setSandboxResult] = useState<{
    statusCode: number;
    latency: number;
    response: string;
    executedAt?: string;
  } | null>(null);

  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');

  // Handle API switch
  const handleSelectApi = (api: OpenPlatformApiDoc) => {
    setSelectedApi(api);
    setCustomBody(api.requestSample);
    setSandboxResult(null);
  };

  // Run Sandbox Request
  const handleExecuteSandbox = async () => {
    setIsLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-SF-AppId': customAppId,
        'X-SF-Timestamp': Math.floor(Date.now() / 1000).toString(),
        'X-SF-Signature': 'mock_sha256_sig_' + Math.random().toString(36).substring(7),
      };
      const result = await executeApiSandboxTest(selectedApi.id, headers, customBody);
      setSandboxResult({
        ...result,
        executedAt: new Date().toLocaleTimeString(),
      });
      showToast('沙箱调试成功', `接口响应 HTTP ${result.statusCode} OK，耗时 ${result.latency}ms`, 'success');
    } catch (e: any) {
      showToast('调试出错', e.message || '请求执行失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
    showToast('已复制到剪贴板', '', 'info');
  };

  const filteredApis = apiDocs.filter((api) => {
    const matchCategory = selectedCategory === '全部' || api.category === selectedCategory;
    const matchSearch =
      api.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      api.path.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      api.description.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchCategory && matchSearch;
  });

  const categories = ['全部', '空间核验', '网格调度', '智能决策'];

  // Code Snippet Generator
  const generateSnippet = () => {
    const url = `https://openapi.sf-express.com${selectedApi.path}`;
    if (codeLanguage === 'curl') {
      return `curl -X ${selectedApi.method} '${url}' \\
  -H 'Content-Type: application/json' \\
  -H 'X-SF-AppId: ${customAppId}' \\
  -H 'X-SF-Timestamp: ${Math.floor(Date.now() / 1000)}' \\
  -H 'X-SF-Signature: your_hmac_sha256_signature' \\
  -d '${customBody.replace(/\n/g, '')}'`;
    } else if (codeLanguage === 'javascript') {
      return `import axios from 'axios';

const response = await axios({
  method: '${selectedApi.method.toLowerCase()}',
  url: '${url}',
  headers: {
    'Content-Type': 'application/json',
    'X-SF-AppId': '${customAppId}',
    'X-SF-Signature': 'your_hmac_sha256_signature'
  },
  data: ${customBody}
});

console.log(response.data);`;
    } else {
      return `import requests

url = "${url}"
headers = {
    "Content-Type": "application/json",
    "X-SF-AppId": "${customAppId}",
    "X-SF-Signature": "your_hmac_sha256_signature"
}
payload = ${customBody}

response = requests.${selectedApi.method.toLowerCase()}(url, json=payload, headers=headers)
print(response.json())`;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Terminal className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">开放能力与 API 接口中心</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            顺丰空间数智与线下履约统一 OpenAPI 规范，提供商户应用鉴权、在线沙箱联调、SDK 代码生成与签名规范。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-700">网关基地址 Base URL</div>
            <div className="text-[11px] font-mono text-indigo-600 font-bold">
              https://openapi.sf-express.com
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>网关 v2.4 正常运行</span>
          </span>
        </div>
      </div>

      {/* Main Split: Left API Catalog & Right Sandbox / Docs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 cols: API List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="搜索接口名称 / 路径..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* API Cards */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredApis.map((api) => {
              const isSelected = selectedApi?.id === api.id;
              return (
                <div
                  key={api.id}
                  onClick={() => handleSelectApi(api)}
                  className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          api.method === 'POST'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {api.method}
                      </span>
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">{api.name}</span>
                    </div>
                  </div>

                  <div className="font-mono text-[11px] text-slate-500 mt-1 truncate">
                    {api.path}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {api.description}
                  </p>

                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-[10px] text-slate-400">
                    <span className="text-indigo-600 font-medium">调用量: {api.callCount.toLocaleString()}</span>
                    <span>平均耗时: {api.avgLatency}ms</span>
                    <span className="text-emerald-600 font-medium">{api.successRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 cols: Sandbox & Documentation */}
        <div className="lg:col-span-8 space-y-6">
          {/* Selected API Title & Meta */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      selectedApi.method === 'POST'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedApi.method}
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                    {selectedApi.path}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 font-medium">
                    {selectedApi.category}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 pt-1">{selectedApi.name}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(`https://openapi.sf-express.com${selectedApi.path}`)}
                  className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制路径</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{selectedApi.description}</p>

            {/* Parameters Table */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>请求参数定义 (Request Parameters)</span>
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">参数名</th>
                      <th className="py-2.5 px-3">类型</th>
                      <th className="py-2.5 px-3">必填</th>
                      <th className="py-2.5 px-3">说明</th>
                      <th className="py-2.5 px-3">示例值</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedApi.params.map((param) => (
                      <tr key={param.name} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-700">{param.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{param.type}</td>
                        <td className="py-2 px-3">
                          {param.required ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                              必填
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">
                              可选
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700">{param.description}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                          {param.sample}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Interactive API Sandbox */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Play className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">在线联调沙箱 (Interactive Sandbox)</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCustomBody(selectedApi.requestSample)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置入参</span>
                </button>
              </div>
            </div>

            {/* Sandbox Config Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  模拟调用凭证 (AppId)
                </label>
                <select
                  value={customAppId}
                  onChange={(e) => setCustomAppId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="sf_app_sy_20260301">顺意优选·智慧门店 (sf_app_sy_20260301)</option>
                  <option value="sf_app_hl_20260412">北京华联·巡检调度 (sf_app_hl_20260412)</option>
                  <option value="sf_app_xz_20260605">西子商管·选址分析 (sf_app_xz_20260605)</option>
                  <option value="sf_app_sandbox_test">公共沙箱账号 (sf_app_sandbox_test)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  鉴权方式 (Auth Mode)
                </label>
                <div className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 font-mono text-[11px] flex items-center justify-between">
                  <span>HMAC-SHA256 签名网关鉴权</span>
                  <span className="text-emerald-600 font-bold text-[10px]">自动注入</span>
                </div>
              </div>
            </div>

            {/* Request Body Editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>请求体 (Request JSON Body)</span>
                <span className="text-[11px] font-normal text-slate-400">支持自由编辑测试参数</span>
              </label>
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                rows={7}
                className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>沙箱环境隔离，不产生实际扣费与工单下发</span>
              </div>

              <button
                onClick={handleExecuteSandbox}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>网关请求中...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>发送调试请求 (Send Request)</span>
                  </>
                )}
              </button>
            </div>

            {/* Execution Result Box */}
            {sandboxResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white space-y-3 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      HTTP {sandboxResult.statusCode} OK
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      耗时: <strong className="text-white">{sandboxResult.latency}ms</strong>
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      执行时间: {sandboxResult.executedAt}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(sandboxResult.response)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                  >
                    {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedResponse ? '已复制' : '复制响应'}</span>
                  </button>
                </div>

                <pre className="text-xs font-mono text-cyan-300 overflow-x-auto p-2 bg-black/40 rounded-lg max-h-72">
                  {sandboxResult.response}
                </pre>
              </div>
            )}
          </div>

          {/* Code Generation Snippet */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span>快速接入代码生成 (Code Snippet)</span>
              </h3>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {(['curl', 'javascript', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLanguage(lang)}
                    className={`px-2.5 py-0.5 rounded text-xs font-medium transition cursor-pointer ${
                      codeLanguage === lang
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'Node.js' : 'Python'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="text-xs font-mono text-slate-200 bg-slate-900 p-4 rounded-xl overflow-x-auto">
                {generateSnippet()}
              </pre>
              <button
                onClick={() => handleCopy(generateSnippet())}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                title="复制代码"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
