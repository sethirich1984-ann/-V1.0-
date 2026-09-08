import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Code,
  ShieldCheck,
  Zap,
  Power,
  ExternalLink,
  Info,
  FileText,
  Globe,
  Radio,
  Search,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PlatformService } from '../../types';
import { Modal } from '../common/Modal';

export const ServiceMarketAdmin: React.FC = () => {
  const { services, apiDocs, addService, updateService, showToast } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<'all' | '前置校验' | '增值服务'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | '开放平台' | '自定义接入'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states: null means closed, 'add' means new service, PlatformService means edit
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [currentEditingService, setCurrentEditingService] = useState<PlatformService | null>(null);

  // Form states matching PRD 3.2.6.2
  const [formData, setFormData] = useState({
    name: '', // 最多30字
    type: '前置校验服务' as '前置校验服务' | '增值服务', // 下拉选择
    description: '', // 最多200字
    marketingCopy: '', // 营销文案
    source: '开放平台' as '开放平台' | '自定义接入', // 单选
    openPlatformServiceKey: '', // 当服务来源=开放平台时下拉选择
    apiEndpoint: '', // 当服务来源=自定义接入时填写API接口地址
    priceDescription: '',
    freeTrialQuota: 50,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: '前置校验服务',
      description: '',
      marketingCopy: '',
      source: '开放平台',
      openPlatformServiceKey: apiDocs[0]?.id || '',
      apiEndpoint: '',
      priceDescription: '',
      freeTrialQuota: 50,
    });
    setFormErrors({});
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setCurrentEditingService(null);
  };

  const openEditModal = (service: PlatformService) => {
    setCurrentEditingService(service);
    setFormData({
      name: service.name || '',
      type: service.type || (service.category === '前置校验' ? '前置校验服务' : '增值服务'),
      description: service.description || '',
      marketingCopy: service.marketingCopy || '',
      source: service.source || (service.interfaceType === 'custom_api' ? '自定义接入' : '开放平台'),
      openPlatformServiceKey: service.openPlatformServiceKey || '',
      apiEndpoint: service.apiEndpoint || '',
      priceDescription: service.priceDescription || '',
      freeTrialQuota: service.freeTrialQuota ?? 20,
    });
    setFormErrors({});
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentEditingService(null);
    setFormErrors({});
  };

  // Validate form based on PRD 3.2.6.2
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = '服务名称为必填项';
    } else if (formData.name.trim().length > 30) {
      errors.name = '服务名称最多30字';
    }

    if (!formData.type) {
      errors.type = '请选择服务类型';
    }

    if (!formData.description.trim()) {
      errors.description = '服务说明为必填项';
    } else if (formData.description.trim().length > 200) {
      errors.description = '服务说明最多200字';
    }

    if (!formData.source) {
      errors.source = '请选择服务来源';
    }

    if (formData.source === '开放平台') {
      if (!formData.openPlatformServiceKey) {
        errors.openPlatformServiceKey = '请从开放平台服务列表中选择服务';
      }
    } else if (formData.source === '自定义接入') {
      if (!formData.apiEndpoint.trim()) {
        errors.apiEndpoint = '请填写自定义接入 API 接口地址';
      } else if (!/^https?:\/\//i.test(formData.apiEndpoint.trim()) && !formData.apiEndpoint.trim().startsWith('/')) {
        errors.apiEndpoint = '接口地址须以 http://, https:// 或 / 开头';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const category: '前置校验' | '增值服务' = formData.type === '前置校验服务' ? '前置校验' : '增值服务';
    const interfaceType: 'open_platform' | 'custom_api' = formData.source === '开放平台' ? 'open_platform' : 'custom_api';

    // Derive or keep apiEndpoint
    let endpoint = formData.apiEndpoint.trim();
    if (formData.source === '开放平台') {
      const selectedDoc = apiDocs.find((d) => d.id === formData.openPlatformServiceKey);
      endpoint = selectedDoc ? selectedDoc.path : endpoint || '/api/v1/service/call';
    }

    if (modalMode === 'add') {
      addService({
        name: formData.name.trim(),
        category,
        type: formData.type,
        source: formData.source,
        interfaceType,
        description: formData.description.trim(),
        marketingCopy: formData.marketingCopy.trim(),
        openPlatformServiceKey: formData.source === '开放平台' ? formData.openPlatformServiceKey : undefined,
        apiEndpoint: endpoint,
        status: '启用',
        priceDescription: formData.priceDescription.trim() || '按次计费（支持免费体验）',
        freeTrialQuota: Number(formData.freeTrialQuota) || 20,
      });
      showToast('发布成功', `服务【${formData.name.trim()}】已成功上架至服务市场`, 'success');
    } else if (modalMode === 'edit' && currentEditingService) {
      updateService(currentEditingService.id, {
        name: formData.name.trim(),
        category,
        type: formData.type,
        source: formData.source,
        interfaceType,
        description: formData.description.trim(),
        marketingCopy: formData.marketingCopy.trim(),
        openPlatformServiceKey: formData.source === '开放平台' ? formData.openPlatformServiceKey : undefined,
        apiEndpoint: endpoint,
        priceDescription: formData.priceDescription.trim() || currentEditingService.priceDescription,
        freeTrialQuota: Number(formData.freeTrialQuota) || currentEditingService.freeTrialQuota || 20,
      });
      showToast('更新成功', `服务【${formData.name.trim()}】配置已更新并刷新列表`, 'success');
    }

    closeModal();
  };

  const toggleServiceStatus = (s: PlatformService) => {
    const next = s.status === '启用' ? '停用' : '启用';
    updateService(s.id, { status: next });
    showToast(next === '启用' ? '服务已启用' : '服务已停用', `服务【${s.name}】状态已变更`, 'info');
  };

  // Filtered services
  const filteredServices = services.filter((s) => {
    const matchCategory =
      categoryFilter === 'all' ||
      s.category === categoryFilter ||
      (categoryFilter === '前置校验' && s.type === '前置校验服务') ||
      (categoryFilter === '增值服务' && s.type === '增值服务');

    const sSource = s.source || (s.interfaceType === 'custom_api' ? '自定义接入' : '开放平台');
    const matchSource = sourceFilter === 'all' || sSource === sourceFilter;

    const matchSearch =
      !searchTerm.trim() ||
      s.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      (s.marketingCopy && s.marketingCopy.toLowerCase().includes(searchTerm.trim().toLowerCase()));

    return matchCategory && matchSource && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              服务市场管理
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              管理可供任务绑定与租户下单前置核验校验能力、以及完结后拓展的增值服务
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            新建服务
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium mr-1">分类筛选:</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              全部服务 ({services.length})
            </button>
            <button
              onClick={() => setCategoryFilter('前置校验')}
              className={`px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === '前置校验'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              前置校验服务 ({services.filter((s) => s.category === '前置校验' || s.type === '前置校验服务').length})
            </button>
            <button
              onClick={() => setCategoryFilter('增值服务')}
              className={`px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === '增值服务'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              增值服务 ({services.filter((s) => s.category === '增值服务' || s.type === '增值服务').length})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">来源:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="all">全部来源</option>
                <option value="开放平台">开放平台</option>
                <option value="自定义接入">自定义接入</option>
              </select>
            </div>

            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索服务名称 / 说明..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => {
          const isPre = service.category === '前置校验' || service.type === '前置校验服务';
          const isEnabled = service.status === '启用';
          const source = service.source || (service.interfaceType === 'custom_api' ? '自定义接入' : '开放平台');

          return (
            <div
              key={service.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition duration-200 flex flex-col justify-between ${
                isEnabled ? 'border-slate-200 hover:border-purple-300' : 'border-slate-200 bg-slate-50/50 opacity-70'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isPre ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {isPre ? <ShieldCheck className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{service.name}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">{service.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        isPre
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {service.type || (isPre ? '前置校验服务' : '增值服务')}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        isEnabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>
                </div>

                {/* Service Description */}
                <div className="mt-3">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                </div>

                {/* Marketing Copy (if present) */}
                {service.marketingCopy && (
                  <div className="mt-2.5 p-2 bg-amber-50/60 rounded-lg border border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">
                      <strong className="font-semibold text-amber-900">营销文案：</strong>
                      {service.marketingCopy}
                    </span>
                  </div>
                )}

                {/* Meta details */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">服务来源</span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      {source === '开放平台' ? (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200">
                          开放平台
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] border border-purple-200">
                          自定义接入
                        </span>
                      )}
                    </span>
                  </div>

                  {source === '开放平台' && service.openPlatformServiceKey && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">服务绑定</span>
                      <span className="font-mono text-[11px] text-blue-600 max-w-[180px] truncate" title={service.openPlatformServiceKey}>
                        {apiDocs.find((d) => d.id === service.openPlatformServiceKey)?.name || service.openPlatformServiceKey}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">接口地址</span>
                    <span className="font-mono text-[11px] text-slate-600 max-w-[180px] truncate" title={service.apiEndpoint}>
                      {service.apiEndpoint || '未配置'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">计费策略</span>
                    <span className="text-purple-700 font-medium text-[11px]">{service.priceDescription || '免费试用'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400">
                  体验配额: <strong className="font-mono text-slate-700">{service.freeTrialQuota ?? 20} 次</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(service)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition font-medium cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    编辑
                  </button>
                  <button
                    onClick={() => toggleServiceStatus(service)}
                    className={`px-2.5 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                      isEnabled
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {isEnabled ? '停用' : '启用'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">未找到符合条件的服务</p>
          <p className="text-xs text-slate-400 mt-1">可以尝试更改筛选条件或新建发布新服务</p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            新建服务配置
          </button>
        </div>
      )}

      {/* PRD 3.2.6.2 Modal: Service Edit / Add Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'add' ? '新建服务配置' : '服务编辑'}
        subtitle={
          modalMode === 'add'
            ? 'PRD 3.2.6.2：录入前置校验或增值服务配置信息，支持选择开放平台或自定义接入'
            : `PRD 3.2.6.2：编辑【${currentEditingService?.name}】服务配置与接入规则`
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* 1. 服务名称 (文本输入, 必填, 最多30字) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-800 font-semibold flex items-center gap-1">
                服务名称 <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] ${
                  formData.name.length > 30 ? 'text-rose-500 font-bold' : 'text-slate-400'
                }`}
              >
                {formData.name.length}/30字
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={30}
              placeholder="请输入服务名称（最多30字，如：门店营业状态核验）"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
              }}
              className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none ${
                formErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-white'
              }`}
            />
            {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
          </div>

          {/* 2. 服务类型 (下拉选择, 必填: 前置校验服务 / 增值服务) */}
          <div>
            <label className="block text-slate-800 font-semibold mb-1">
              服务类型 <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => {
                setFormData({ ...formData, type: e.target.value as any });
                if (formErrors.type) setFormErrors({ ...formErrors, type: '' });
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="前置校验服务">前置校验服务（在租户下单导入网点时自动触发清洗与拦截）</option>
              <option value="增值服务">增值服务（在工单履约完结后为商户与点位提供拓展能力）</option>
            </select>
            {formErrors.type && <p className="text-[11px] text-rose-500 mt-1">{formErrors.type}</p>}
          </div>

          {/* 3. 服务说明 (文本输入/多行文本, 必填, 最多200字) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-800 font-semibold flex items-center gap-1">
                服务说明 <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] ${
                  formData.description.length > 200 ? 'text-rose-500 font-bold' : 'text-slate-400'
                }`}
              >
                {formData.description.length}/200字
              </span>
            </div>
            <textarea
              rows={3}
              required
              maxLength={200}
              placeholder="详细描述该服务的技术实现、适用场景与业务价值（最多200字）..."
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
              }}
              className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none ${
                formErrors.description ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-white'
              }`}
            />
            {formErrors.description && (
              <p className="text-[11px] text-rose-500 mt-1">{formErrors.description}</p>
            )}
          </div>

          {/* 4. 营销文案 (文本输入, 否: 用于向租户展示的服务介绍文案) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-800 font-semibold flex items-center gap-1">
                营销文案 <span className="text-slate-400 font-normal">(选填)</span>
              </label>
              <span className="text-[11px] text-slate-400">用于向租户展示的服务介绍文案</span>
            </div>
            <input
              type="text"
              placeholder="例如：自动化甄别虚假闭店网点，降低外勤跑空成本30%以上"
              value={formData.marketingCopy}
              onChange={(e) => setFormData({ ...formData, marketingCopy: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              该文案将在租户端下单推荐卡片及服务市场详情中以高亮标语展示。
            </p>
          </div>

          {/* 5. 服务来源 (单选, 必填: 开放平台 / 自定义接入) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-slate-800 font-semibold mb-2">
                服务来源 <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sourceChoice"
                    value="开放平台"
                    checked={formData.source === '开放平台'}
                    onChange={() => {
                      setFormData({
                        ...formData,
                        source: '开放平台',
                        openPlatformServiceKey: formData.openPlatformServiceKey || apiDocs[0]?.id || '',
                      });
                      if (formErrors.source) setFormErrors({ ...formErrors, source: '' });
                    }}
                    className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-900">开放平台</span>
                  <span className="text-[11px] text-slate-500">（顺丰开放平台标准接口能力）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sourceChoice"
                    value="自定义接入"
                    checked={formData.source === '自定义接入'}
                    onChange={() => {
                      setFormData({ ...formData, source: '自定义接入' });
                      if (formErrors.source) setFormErrors({ ...formErrors, source: '' });
                    }}
                    className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-900">自定义接入</span>
                  <span className="text-[11px] text-slate-500">（外部独立 HTTP/REST API）</span>
                </label>
              </div>
              {formErrors.source && <p className="text-[11px] text-rose-500 mt-1">{formErrors.source}</p>}
            </div>

            {/* 6. 条件渲染：服务选择 (当服务来源=开放平台时显示并必填) */}
            {formData.source === '开放平台' && (
              <div className="pt-2 border-t border-slate-200/80">
                <label className="block text-slate-800 font-semibold mb-1">
                  服务选择 <span className="text-rose-500">* (从开放平台服务列表中选择)</span>
                </label>
                <select
                  required
                  value={formData.openPlatformServiceKey}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const doc = apiDocs.find((d) => d.id === selectedId);
                    setFormData({
                      ...formData,
                      openPlatformServiceKey: selectedId,
                      apiEndpoint: doc ? doc.path : formData.apiEndpoint,
                    });
                    if (formErrors.openPlatformServiceKey) {
                      setFormErrors({ ...formErrors, openPlatformServiceKey: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-slate-900 bg-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none ${
                    formErrors.openPlatformServiceKey ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  <option value="">-- 请选择开放平台接口服务 --</option>
                  {apiDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      [{doc.id}] {doc.name} ({doc.method} {doc.path})
                    </option>
                  ))}
                </select>
                {formErrors.openPlatformServiceKey && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.openPlatformServiceKey}</p>
                )}
                {formData.openPlatformServiceKey && (
                  <div className="mt-2 p-2 bg-blue-50/60 rounded border border-blue-200 text-[11px] text-blue-800">
                    <span className="font-semibold">已关联开放平台接口：</span>
                    {apiDocs.find((d) => d.id === formData.openPlatformServiceKey)?.description || ''}
                  </div>
                )}
              </div>
            )}

            {/* 7. 条件渲染：接口地址 (当服务来源=自定义接入时显示并必填) */}
            {formData.source === '自定义接入' && (
              <div className="pt-2 border-t border-slate-200/80">
                <label className="block text-slate-800 font-semibold mb-1">
                  接口地址 <span className="text-rose-500">* (外部服务的 API 接口地址)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://api.external-service.com/v1/verify"
                  value={formData.apiEndpoint}
                  onChange={(e) => {
                    setFormData({ ...formData, apiEndpoint: e.target.value });
                    if (formErrors.apiEndpoint) setFormErrors({ ...formErrors, apiEndpoint: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none ${
                    formErrors.apiEndpoint ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-white'
                  }`}
                />
                {formErrors.apiEndpoint && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.apiEndpoint}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  请输入支持 HTTPS 调用的外部 API 接口地址，履约引擎将通过标准 HTTP POST/GET 协议发起调度。
                </p>
              </div>
            )}
          </div>

          {/* 辅助计费与配额 (选填) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-800 font-semibold mb-1">计费策略说明</label>
              <input
                type="text"
                placeholder="例如：按次计费，0.15元/次"
                value={formData.priceDescription}
                onChange={(e) => setFormData({ ...formData, priceDescription: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-semibold mb-1">默认免费体验配额 (次)</label>
              <input
                type="number"
                min={0}
                value={formData.freeTrialQuota}
                onChange={(e) => setFormData({ ...formData, freeTrialQuota: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition cursor-pointer font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {modalMode === 'add' ? '确认发布服务' : '保存服务配置'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
