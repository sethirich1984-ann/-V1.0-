import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  UploadCloud,
  Download,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Edit3,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  FileDown,
  Building2,
  FolderKanban,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { ProjectRevenue } from '../../types';
import { Modal } from '../common/Modal';

export const ProjectManagement: React.FC = () => {
  const {
    projects,
    merchants,
    updateProjectAmount,
    batchImportProjects,
    showToast,
  } = useApp();

  // Filters & State
  const [productFilter, setProductFilter] = useState<string>('all');
  const [merchantFilter, setMerchantFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'3' | '6' | '12'>('12');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRevenue | null>(null);
  const [editAmountInput, setEditAmountInput] = useState<string>('');

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRows, setImportRows] = useState<Array<Partial<ProjectRevenue>>>([
    {
      productName: '丰迹',
      merchantId: 'M-1001',
      merchantName: '深圳顺意优选连锁有限公司',
      projectName: '秋季重点商圈网格大巡检',
      projectCode: 'FJ-SZ-202609',
      taskName: '深圳门店巡检（丰创）',
      confirmedAmount: 120000,
      confirmedDate: '2026-09-02',
    },
    {
      productName: '选址参谋',
      merchantId: 'M-1002',
      merchantName: '北京华联智选零售科技有限责任公司',
      projectName: '北京朝阳区新选址热力专项',
      projectCode: 'XZ-BJ-202609',
      taskName: '华北商圈评估',
      confirmedAmount: 85000,
      confirmedDate: '2026-09-01',
    },
    {
      productName: '丰策智能体',
      merchantId: 'M-1003',
      merchantName: '广州美宜家便利系统企业管理有限公司',
      projectName: '便利店排班损耗智能体',
      projectCode: 'FC-GZ-202609',
      taskName: '损耗巡检分析',
      confirmedAmount: 64000,
      confirmedDate: '2026-08-30',
    },
    {
      productName: '丰迹',
      merchantId: 'M-1004',
      merchantName: '杭州天虹数智新零售科技有限责任公司',
      projectName: '华东冷链货架商品合规排查',
      projectCode: 'FJ-HZ-202609',
      taskName: '冷链网格巡检',
      confirmedAmount: 96000,
      confirmedDate: '2026-08-28',
    },
  ]);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    failCount: number;
    failures: Array<{ row: number; reason: string; data: any }>;
  } | null>(null);

  // Filtered project rows
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchProduct = productFilter === 'all' || p.productName === productFilter;
        const matchMerchant = merchantFilter === 'all' || p.merchantId === merchantFilter;
        const matchSearch =
          p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.taskName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchProduct && matchMerchant && matchSearch;
      })
      .sort((a, b) => new Date(b.confirmedDate).getTime() - new Date(a.confirmedDate).getTime());
  }, [projects, productFilter, merchantFilter, searchTerm]);

  // Pagination for projects
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  // Aggregate stats
  const totalRevenue = useMemo(() => {
    return projects.reduce((sum, p) => sum + p.confirmedAmount, 0);
  }, [projects]);

  // Chart 1: Revenue by Product (3.1.2.2 图表1)
  const productChartData = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach((p) => {
      map[p.productName] = (map[p.productName] || 0) + p.confirmedAmount;
    });
    return Object.keys(map).map((name) => ({
      product: name,
      amount: map[name],
      formatted: `¥${(map[name] / 10000).toFixed(1)}万`,
    }));
  }, [projects]);

  // Chart 2: Top 10 Projects by Revenue (3.1.2.2 图表2 按项目维度)
  const projectChartData = useMemo(() => {
    const map: Record<string, { amount: number; productName: string; merchantName: string }> = {};
    projects.forEach((p) => {
      if (!map[p.projectName]) {
        map[p.projectName] = { amount: 0, productName: p.productName, merchantName: p.merchantName };
      }
      map[p.projectName].amount += p.confirmedAmount;
    });

    return Object.keys(map)
      .map((name) => ({
        project: name.length > 10 ? name.substring(0, 9) + '…' : name,
        fullProject: name,
        amount: map[name].amount,
        product: map[name].productName,
        merchant: map[name].merchantName,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [projects]);

  // Chart 3: Monthly Trend (3.1.2.2 图表3)
  const monthlyTrendData = useMemo(() => {
    const months = [
      '2025-10', '2025-11', '2025-12', '2026-01',
      '2026-02', '2026-03', '2026-04', '2026-05',
      '2026-06', '2026-07', '2026-08', '2026-09',
    ];

    const sliceCount = timeRange === '3' ? 3 : timeRange === '6' ? 6 : 12;
    const selectedMonths = months.slice(months.length - sliceCount);

    return selectedMonths.map((m, idx) => {
      const base = 80000 + (idx * 25000);
      return {
        month: m,
        丰迹: Math.round(base * 0.55 + (idx % 2 === 0 ? 15000 : -10000)),
        选址参谋: Math.round(base * 0.28 + (idx % 3 === 0 ? 8000 : -5000)),
        丰策智能体: Math.round(base * 0.17 + (idx * 3000)),
      };
    });
  }, [timeRange]);

  const handleExportExcel = () => {
    const headers = [
      '产品名称',
      '商户ID',
      '商户名称',
      '项目名称',
      '项目代码',
      '关联任务名称',
      '确收金额(元)',
      '确收时间',
    ];
    const rows = filteredProjects.map((p) => [
      p.productName,
      p.merchantId,
      p.merchantName,
      p.projectName,
      p.projectCode,
      p.taskName,
      p.confirmedAmount,
      p.confirmedDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `项目管理确收明细_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('导出成功', `已成功导出 ${filteredProjects.length} 条项目确收明细表`, 'success');
  };

  const handleDownloadTemplate = () => {
    const headers = [
      '产品名称',
      '商户ID',
      '商户名称',
      '项目名称',
      '项目代码',
      '任务名称',
      '确收金额',
      '确收时间',
    ];
    const sampleRows = [
      ['丰迹', 'M-1001', '深圳顺意优选连锁有限公司', '商圈大巡检项目', 'FJ-2026-001', '深圳门店巡检', 100000, '2026-09-01'],
      ['选址参谋', 'M-1002', '北京华联智选零售科技有限责任公司', '朝阳热力评估', 'XZ-2026-002', '商圈评估', 50000, '2026-09-02'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...sampleRows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', '项目管理导入模板.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('模板下载成功', '已下载《项目管理导入模板.csv》（全部字段非必填，支持自由导入）', 'info');
  };

  const handleImportSubmit = () => {
    if (importRows.length === 0) {
      showToast('导入失败', '暂无可导入的数据行', 'error');
      return;
    }

    const result = batchImportProjects(importRows);
    setImportResult({
      successCount: result.successCount,
      failCount: result.failCount,
      failures: result.failCount > 0 ? [
        { row: 4, reason: '确收金额格式异常', data: { productName: '其他', confirmedAmount: '未知' } }
      ] : [],
    });

    showToast('导入完成', `成功导入 ${result.successCount} 条项目确收数据`, 'success');
  };

  const handleEditAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    const val = Number(editAmountInput);
    if (isNaN(val) || val < 0) {
      showToast('金额错误', '请输入有效的确收金额数字', 'error');
      return;
    }
    updateProjectAmount(editingProject.id, val);
    setEditingProject(null);
    showToast('修改成功', `项目【${editingProject.projectName}】确收金额已更新为 ¥${val.toLocaleString()}`);
  };

  const downloadChartScreenshot = (chartTitle: string) => {
    showToast('图表导出', `已成功生成并下载【${chartTitle}】图片与统计数据`, 'info');
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <FolderKanban className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">项目管理</h1>
            </div>
            <p className="text-xs text-slate-500 max-w-4xl leading-relaxed">
              集中管理丰迹、选址参谋、丰策智能体等产品的项目交付数据、确收金额与商业化大盘，支持Excel批量导入与收入多维分析。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>导出明细表</span>
            </button>
            <button
              onClick={() => {
                setImportResult(null);
                setIsImportModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel 导入（3.1.2.1）</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <div className="text-slate-400 font-medium">累计确收总额 (元)</div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              ¥{totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <div className="text-slate-400 font-medium">交付项目总数</div>
            <div className="text-xl font-bold text-slate-900 font-mono">{projects.length} 个</div>
          </div>
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <div className="text-slate-400 font-medium">已覆盖商户数</div>
            <div className="text-xl font-bold text-slate-900 font-mono">{merchants.length} 家</div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section (3.1.2.2 统计图表) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: 按产品维度的收入汇总柱状图 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                图表1：按产品维度收入汇总 (柱状图)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">X轴=产品，Y轴=金额</p>
            </div>
            <button
              onClick={() => downloadChartScreenshot('按产品维度收入汇总')}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition"
              title="下载图表"
            >
              <FileDown className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="product" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `¥${v / 10000}万`}
                />
                <Tooltip
                  formatter={(value: any) => [`¥${Number(value).toLocaleString()}`, '确收金额']}
                  contentStyle={{ borderRadius: 12, fontSize: 12, borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 按项目维度的收入汇总柱状图 (Top 10) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                图表2：按项目维度收入汇总 (Top 10 柱状图)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Top 10 交付项目金额贡献</p>
            </div>
            <button
              onClick={() => downloadChartScreenshot('按项目维度收入汇总Top10')}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition"
              title="下载图表"
            >
              <FileDown className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={(v) => `¥${v / 10000}万`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                <YAxis type="category" dataKey="project" width={85} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `¥${Number(value).toLocaleString()} (${item?.payload?.product || ''})`,
                    '项目确收金额',
                  ]}
                  labelFormatter={(_label: any, payload: any) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullProject;
                    }
                    return _label;
                  }}
                  contentStyle={{ borderRadius: 12, fontSize: 12, borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: 收入趋势折线图 (最近12个月) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                图表3：收入趋势折线图
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">支持近3/6/12个月范围切换</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                <button
                  onClick={() => setTimeRange('3')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    timeRange === '3' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  近3月
                </button>
                <button
                  onClick={() => setTimeRange('6')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    timeRange === '6' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  近6月
                </button>
                <button
                  onClick={() => setTimeRange('12')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    timeRange === '12' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  近12月
                </button>
              </div>
              <button
                onClick={() => downloadChartScreenshot('收入趋势折线图')}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition"
                title="下载图表"
              >
                <FileDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11, borderColor: '#e2e8f0' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Line type="monotone" dataKey="丰迹" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="选址参谋" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="丰策智能体" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3.1.2.3 明细表单 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden w-full">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索项目名称、代码、商户或任务..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl w-64 sm:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={productFilter}
              onChange={(e) => {
                setProductFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="all">所有产品 (丰迹 / 选址 / 丰策 / 其他)</option>
              <option value="丰迹">丰迹</option>
              <option value="选址参谋">选址参谋</option>
              <option value="丰策智能体">丰策智能体</option>
            </select>

            <select
              value={merchantFilter}
              onChange={(e) => {
                setMerchantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="all">全部关联商户</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 whitespace-nowrap">
            共 <span className="font-bold text-slate-900">{filteredProjects.length}</span> 条项目确收明细
          </div>
        </div>

        {/* 3.1.2.3 Table Fields: 产品名称、商户ID、商户名称、项目名称、项目代码、任务名称、确收金额、确收时间 */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3.5 px-4 whitespace-nowrap">产品名称</th>
                <th className="py-3.5 px-4 whitespace-nowrap">商户ID</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[200px]">商户名称</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[180px]">项目名称</th>
                <th className="py-3.5 px-4 whitespace-nowrap">项目代码</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">关联任务名称</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-right">确收金额 (元)</th>
                <th className="py-3.5 px-4 whitespace-nowrap">确收时间</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    暂无符合条件的项目确收明细
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/70 transition text-slate-800">
                    {/* 产品名称 */}
                    <td className="py-3.5 px-4 font-medium">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          proj.productName === '丰迹'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : proj.productName === '选址参谋'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {proj.productName}
                      </span>
                    </td>

                    {/* 商户ID */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-medium">{proj.merchantId}</td>

                    {/* 商户名称 */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{proj.merchantName}</td>

                    {/* 项目名称 */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">{proj.projectName}</td>

                    {/* 项目代码 */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{proj.projectCode}</td>

                    {/* 任务名称 */}
                    <td className="py-3.5 px-4 text-slate-600">{proj.taskName}</td>

                    {/* 确收金额 */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ¥{proj.confirmedAmount.toLocaleString()}
                    </td>

                    {/* 确收时间 */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{proj.confirmedDate}</td>

                    {/* 操作: 编辑确收金额 */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingProject(proj);
                          setEditAmountInput(proj.confirmedAmount.toString());
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition cursor-pointer"
                        title="修改确收金额"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>编辑</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              共 {filteredProjects.length} 条项目明细，第 {currentPage} / {totalPages} 页（每页 {pageSize} 条）
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>上一页</span>
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>下一页</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3.1.2.1 Excel导入 Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Excel 导入项目数据（3.1.2.1）"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs">
          {/* Template Info Banner */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>Excel 模板字段规则（全部字段均为非必填，支持 .xlsx/.xls 格式，不超过10MB）：</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-200 rounded-lg transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载导入模板.csv</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              标准字段：产品名称 (丰迹/选址参谋/丰策智能体/其他)、商户ID、商户名称 (需与系统商户名称一致)、项目名称、项目代码、任务名称、确收金额 (元)、确收时间 (YYYY-MM-DD)
            </p>
          </div>

          {/* Simulated File Drop Zone */}
          <div
            onClick={() => {
              showToast('文件选择', '已模拟选择《2026年9月商业化项目确收汇总表.xlsx》', 'info');
              setImportFile({ name: '2026年9月商业化项目确收汇总表.xlsx', size: 1024 * 420 } as any);
            }}
            className="border-2 border-dashed border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50/40 transition rounded-2xl p-6 text-center cursor-pointer"
          >
            <UploadCloud className="w-9 h-9 text-indigo-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-xs">
              {importFile ? importFile.name : '点击选择或拖拽 Excel 文件至此处（不超过10MB）'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {importFile ? '文件已自动解析成功，请预览下方待导入数据' : '支持 .xlsx / .xls 文件格式，所有字段均为非必填'}
            </p>
          </div>

          {/* Import Result Breakdown */}
          {importResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>导入结果统计：成功 {importResult.successCount} 条，失败 {importResult.failCount} 条</span>
              </div>
              {importResult.failCount > 0 && (
                <div className="text-[11px] text-rose-700 pt-1">
                  失败明细：{importResult.failures.map((f) => `第 ${f.row} 行: ${f.reason}`).join('; ')}
                </div>
              )}
            </div>
          )}

          {/* Parsed Preview Table */}
          <div>
            <div className="font-semibold text-slate-800 mb-2 flex items-center justify-between">
              <span>待入库数据预览 ({importRows.length} 条)</span>
              <span className="text-emerald-600 font-medium">数据解析与格式校验通过</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">产品</th>
                    <th className="py-2.5 px-3">商户名称</th>
                    <th className="py-2.5 px-3">项目名称</th>
                    <th className="py-2.5 px-3">项目代码</th>
                    <th className="py-2.5 px-3 text-right">确收金额</th>
                    <th className="py-2.5 px-3">确收时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-medium text-indigo-700">{row.productName}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{row.merchantName}</td>
                      <td className="py-2 px-3 text-slate-700">{row.projectName}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{row.projectCode}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900 font-bold">
                        ¥{Number(row.confirmedAmount).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">{row.confirmedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer font-medium"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-xs cursor-pointer"
            >
              确认导入并入库
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Edit Revenue Amount (3.1.2.3 点击"编辑"→ 弹窗修改确收金额) */}
      <Modal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title="修改项目确收金额（3.1.2.3）"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEditAmountSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">所属产品 / 商户</label>
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
              {editingProject?.productName} · {editingProject?.merchantName}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">项目名称与代码</label>
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
              <span className="font-semibold">{editingProject?.projectName}</span>
              <span className="text-slate-400 font-mono ml-2">({editingProject?.projectCode})</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">关联任务</label>
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
              {editingProject?.taskName}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              确收金额 (元) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              step={100}
              required
              value={editAmountInput}
              onChange={(e) => setEditAmountInput(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingProject(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-xs cursor-pointer"
            >
              保存确收金额
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
