import React, { useState, useMemo } from 'react';
import {
  Send,
  Download,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Layers,
  ArrowRight,
  Info,
  Check,
  Sparkles,
  MapPin,
  RefreshCw,
  FileUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PoiRow {
  contactName: string;
  contactPhone: string;
  contactCompany: string;
  address: string;
}

export const TenantNewDispatch: React.FC = () => {
  const {
    currentTenant,
    tasks,
    createDispatchRecord,
    setActiveTenantTab,
    setSelectedDispatchId,
    showToast,
  } = useApp();

  // 当前商户已生效（已就绪）的任务
  const readyTasks = useMemo(() => {
    if (!currentTenant) return [];
    return tasks.filter((t) => t.merchantId === currentTenant.id && t.status === '已生效');
  }, [tasks, currentTenant]);

  // 步骤1：选择任务
  const [selectedTaskId, setSelectedTaskId] = useState<string>(readyTasks[0]?.id || '');
  // 步骤2：选择渠道，默认丰创（V1.0）
  const [selectedChannel, setSelectedChannel] = useState<'丰创' | '自主能力'>('丰创');

  // 步骤3：Excel 上传及点位数据
  const [uploadedFileName, setUploadedFileName] = useState<string>('顺意优选_南山福田巡检点位.xlsx');
  const [isUploading, setIsUploading] = useState(false);
  const [isValidated, setIsValidated] = useState(true);
  const [poiRows, setPoiRows] = useState<PoiRow[]>([
    {
      contactName: '张店长',
      contactPhone: '13811223344',
      contactCompany: `${currentTenant?.name || '顺意优选'}·深圳福田购物公园店`,
      address: '广东省深圳市福田区民田路138号购物公园B1层',
    },
    {
      contactName: '李副店长',
      contactPhone: '13811223345',
      contactCompany: `${currentTenant?.name || '顺意优选'}·深圳南山海岸城店`,
      address: '广东省深圳市南山区粤海街道海德三道海岸城购物中心3层',
    },
    {
      contactName: '王经理',
      contactPhone: '13811223346',
      contactCompany: `${currentTenant?.name || '顺意优选'}·深圳罗湖万象城店`,
      address: '广东省深圳市罗湖区宝安南路1881号华润万象城负一层',
    },
  ]);

  // 步骤4：前置服务推荐状态
  const [preServiceActionTaken, setPreServiceActionTaken] = useState<boolean>(false);

  const activeTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // 判断任务是否配置了前置服务
  const preService = useMemo(() => {
    if (!activeTask) return null;
    const sName =
      activeTask.serviceConfig?.preValidationService ||
      (activeTask.serviceConfig?.preValidationServices && activeTask.serviceConfig.preValidationServices[0]);
    if (sName) {
      return {
        name: sName,
        desc: '智能优化您的地址数据，提升订单有效率',
      };
    }
    return {
      name: '地址精确度校验',
      desc: '智能优化您的地址数据，提升订单有效率',
    };
  }, [activeTask]);

  // 下载模板
  const handleDownloadTemplate = () => {
    if (!activeTask) {
      showToast('请先选择任务', '请在步骤1选择有效的执行任务', 'warning');
      return;
    }
    const templateFileName =
      activeTask.channelConfigs['丰创']?.templateFile ||
      activeTask.channelConfigs['无需配置（自主能力）']?.templateFile ||
      `${activeTask.name}_${selectedChannel}_下单模板.xlsx`;

    showToast('下单模板下载成功', `已下载任务专属格式模板：《${templateFileName}》`, 'success');
  };

  // 模拟上传 Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setTimeout(() => {
        setUploadedFileName(file.name);
        setIsUploading(false);
        setIsValidated(true);
        showToast(
          'Excel 数据校验通过',
          `已成功解析【${file.name}】，共 3 个受检网点，格式校验 100% 合格`,
          'success'
        );
      }, 600);
    }
  };

  // 点击"使用此服务"
  const handleUsePreService = () => {
    showToast('服务即将上线，敬请期待', '前置空间智能校验服务正在灰度测试中，敬请期待！已为您保留原始优质地址数据。', 'info');
    setPreServiceActionTaken(true);
  };

  // 点击"跳过，直接下单"
  const handleSkipPreService = () => {
    showToast('已跳过前置服务', '已保留原始Excel地址数据，可直接进入确认提交', 'info');
    setPreServiceActionTaken(true);
  };

  // 步骤5：确认提交
  const handleSubmitDispatch = () => {
    if (!currentTenant) {
      showToast('未登录商户', '请先登录商户管理员账号', 'error');
      return;
    }
    if (!selectedTaskId) {
      showToast('请选择任务', '请先选择要下发执行的任务', 'warning');
      return;
    }
    if (poiRows.length === 0) {
      showToast('点位数据为空', '请上传包含网点数据的 Excel 文件', 'warning');
      return;
    }

    // 生成下单记录 + 订单（状态 = 待下发）
    // immediateDispatch: false 即状态为 "待下发"
    const recordId = createDispatchRecord({
      merchantId: currentTenant.id,
      taskId: selectedTaskId,
      channel: selectedChannel,
      items: poiRows,
      immediateDispatch: false,
      creatorRole: '租户',
      creatorName: `${currentTenant.adminName}（管理员）`,
    });

    showToast(
      '下单成功',
      `已生成下单流水记录 ${recordId} 及 ${poiRows.length} 个待下发工单，正在跳转下单记录列表`,
      'success'
    );

    setSelectedDispatchId(recordId);
    // 跳转下单记录列表
    setActiveTenantTab('dispatches');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 顶部介绍 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">新建下单</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              按照向导选择已就绪任务、指定执行渠道、上传 Excel 点位清单并提交下发
            </p>
          </div>
        </div>
      </div>

      {/* 主流程卡片 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
        {/* 步骤1：选择任务 */}
        <div className="space-y-2">
          <label className="block text-slate-800 font-bold flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">
              1
            </span>
            <span>选择任务</span>
            <span className="text-[11px] text-slate-400 font-normal">（当前商户已就绪的任务）</span>
          </label>

          {readyTasks.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
              当前商户暂无处于【已生效】状态的任务。请联系运营人员配置渠道订单类型编码并发布任务后，即可在此进行批量下单。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {readyTasks.map((t) => {
                const isSelected = selectedTaskId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTaskId(t.id);
                      setPreServiceActionTaken(false);
                    }}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                          已就绪
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2 space-y-1">
                        <div>任务编号: {t.id}</div>
                        <div>业务类型: {t.type}</div>
                        <div>截止日期: {t.deadline}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-indigo-600 font-medium">
                      <span>{isSelected ? '✓ 已选择此任务' : '点击选择'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 步骤2：选择渠道 */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <label className="block text-slate-800 font-bold flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">
              2
            </span>
            <span>选择渠道</span>
            <span className="text-[11px] text-slate-400 font-normal">（默认丰创 V1.0）</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setSelectedChannel('丰创')}
              className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                selectedChannel === '丰创'
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-200 shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">丰创（顺丰速运）</span>
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold">
                    默认渠道 (V1.0)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  直连顺丰末端网格中台，支持小哥现场签到、照片水印拍摄、结构化问卷采集
                </p>
              </div>
              <div className="w-5 h-5 rounded-full border border-blue-600 flex items-center justify-center shrink-0">
                {selectedChannel === '丰创' && <div className="w-3 h-3 rounded-full bg-blue-600" />}
              </div>
            </div>

            <div
              onClick={() => setSelectedChannel('自主能力')}
              className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                selectedChannel === '自主能力'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">无需配置（自主能力）</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">
                    自营团队
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  由商户自有外勤团队或线下人员直接执行并录入反馈
                </p>
              </div>
              <div className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center shrink-0">
                {selectedChannel === '自主能力' && <div className="w-3 h-3 rounded-full bg-indigo-600" />}
              </div>
            </div>
          </div>
        </div>

        {/* 步骤3：下载模板并上传 */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="block text-slate-800 font-bold flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">
              3
            </span>
            <span>下载模板并上传</span>
          </label>

          {/* 下载模板 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  {activeTask
                    ? `${activeTask.name}_${selectedChannel}_下单模板.xlsx`
                    : '请先在步骤1选择任务以获取专属下单模板.xlsx'}
                </span>
                <span className="text-[11px] text-slate-500">
                  包含受检网点标准字段：联系人姓名、联系人电话、联系人单位、网点详细地址
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={!activeTask}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-indigo-600 font-semibold rounded-lg shadow-xs transition cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              下载该任务该渠道模板
            </button>
          </div>

          {/* 上传 Excel */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 bg-white text-center hover:border-indigo-400 transition-colors">
            <input
              type="file"
              id="excel-upload-input"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="excel-upload-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-indigo-600 hover:underline">点击上传填写好的 Excel 文件</span>
                <span className="text-slate-500"> 或将文件拖拽至此处</span>
              </div>
              <p className="text-[11px] text-slate-400">支持 .xlsx, .xls 格式文件（单次最大支持 5000 条点位）</p>
            </label>
          </div>

          {/* 校验数据结果展示 */}
          {isValidated && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">
                    系统数据校验通过：当前解析 {poiRows.length} 个受检网点
                  </span>
                </div>
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-[11px] font-medium">
                  ✓ 格式合规
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">网点单位名称</th>
                      <th className="py-2 px-3">现场联系人</th>
                      <th className="py-2 px-3">联系电话</th>
                      <th className="py-2 px-3">详细地址 (POI)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {poiRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-medium text-slate-900">{r.contactCompany}</td>
                        <td className="py-2 px-3 text-slate-700">{r.contactName}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.contactPhone}</td>
                        <td className="py-2 px-3 text-slate-600">{r.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 步骤4：前置服务推荐（如任务配置了前置服务） */}
        {preService && isValidated && (
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="block text-slate-800 font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">
                4
              </span>
              <span>前置服务推荐</span>
              <span className="text-[11px] text-slate-400 font-normal">（如任务配置了前置服务）</span>
            </label>

            {/* 前置服务卡片（PRD 3.3.2.1 规范） */}
            <div className="p-5 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-slate-50 border border-purple-200 rounded-xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎯</span>
                    <h4 className="font-bold text-slate-900 text-sm">
                      推荐使用：{preService.name}
                    </h4>
                    <span className="px-2 py-0.2 bg-purple-100 text-purple-800 rounded font-semibold text-[10px] border border-purple-200">
                      智能优化
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {preService.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleUsePreService}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer text-xs flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>使用此服务</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipPreService}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-lg shadow-2xs transition cursor-pointer text-xs"
                  >
                    跳过，直接下单
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 步骤5：确认提交 */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-slate-500 text-xs">
            提交后将生成 <span className="font-bold text-slate-900">{poiRows.length}</span> 个订单（初始状态为
            <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mx-1">
              待下发
            </span>
            ），并自动跳转至下单记录列表。
          </div>
          <button
            type="button"
            onClick={handleSubmitDispatch}
            disabled={!activeTask || poiRows.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>确认提交</span>
          </button>
        </div>
      </div>
    </div>
  );
};
