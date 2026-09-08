import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Lock,
  Unlock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Phone,
  User,
  Calendar,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Store,
  Compass,
  Cpu,
  Clock,
  FileCheck2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Merchant, TaskItem, TaskStatus } from '../../types';
import { Modal } from '../common/Modal';

export const MerchantManagement: React.FC = () => {
  const {
    merchants,
    tasks,
    addMerchant,
    updateMerchant,
    toggleFreezeMerchant,
    showToast,
  } = useApp();

  // Tabs: 选址参谋、丰策智能体、丰迹 (默认选丰迹tab)
  const [activeTab, setActiveTab] = useState<'fengji' | 'xuanzhi' | 'fengce'>('fengji');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | '试用版' | '付费版'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modals & Detail View
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editMerchantData, setEditMerchantData] = useState<Merchant | null>(null);
  const [detailMerchant, setDetailMerchant] = useState<Merchant | null>(null);
  const [freezeConfirmMerchant, setFreezeConfirmMerchant] = useState<Merchant | null>(null);
  const [viewTaskDetail, setViewTaskDetail] = useState<TaskItem | null>(null);

  // Detail page task filtering & pagination
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [taskCurrentPage, setTaskCurrentPage] = useState(1);
  const taskPageSize = 20;

  // New Merchant Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'试用版' | '付费版'>('付费版');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [formError, setFormError] = useState('');

  // Edit Merchant Form State
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'试用版' | '付费版'>('付费版');
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminPhone, setEditAdminPhone] = useState('');
  const [editFormError, setEditFormError] = useState('');

  // Filter and sort merchants: Default created time descending
  const filteredMerchants = useMemo(() => {
    return merchants
      .filter((m) => {
        // Tab filter
        let matchTab = true;
        if (activeTab === 'fengji') {
          matchTab = m.authorizedProducts?.includes('丰迹') ?? true;
        } else if (activeTab === 'xuanzhi') {
          matchTab = m.authorizedProducts?.includes('选址参谋') ?? false;
        } else if (activeTab === 'fengce') {
          matchTab = m.authorizedProducts?.includes('丰策智能体') ?? false;
        }

        // Search match
        const matchSearch =
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.adminPhone.includes(searchTerm);

        const matchType = typeFilter === 'all' || m.type === typeFilter;

        return matchTab && matchSearch && matchType;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [merchants, activeTab, searchTerm, typeFilter]);

  // Pagination for merchants table
  const totalPages = Math.max(1, Math.ceil(filteredMerchants.length / pageSize));
  const paginatedMerchants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMerchants.slice(start, start + pageSize);
  }, [filteredMerchants, currentPage, pageSize]);

  // Tasks for the active detail merchant
  const merchantTasks = useMemo(() => {
    if (!detailMerchant) return [];
    return tasks
      .filter((t) => t.merchantId === detailMerchant.id)
      .filter((t) => taskStatusFilter === 'all' || t.status === taskStatusFilter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tasks, detailMerchant, taskStatusFilter]);

  const taskTotalPages = Math.max(1, Math.ceil(merchantTasks.length / taskPageSize));
  const paginatedTasks = useMemo(() => {
    const start = (taskCurrentPage - 1) * taskPageSize;
    return merchantTasks.slice(start, start + taskPageSize);
  }, [merchantTasks, taskCurrentPage, taskPageSize]);

  // Handlers
  const handleOpenAdd = () => {
    setNewName('');
    setNewType('付费版');
    setNewAdminName('');
    setNewAdminPhone('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    const trimmedAdmin = newAdminName.trim();
    const trimmedPhone = newAdminPhone.trim();

    if (!trimmedName) {
      setFormError('商户名称为必填项');
      return;
    }
    if (trimmedName.length > 50) {
      setFormError('商户名称最多支持50个字符');
      return;
    }
    // Check duplication
    const exists = merchants.some((m) => m.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      setFormError('商户名称已存在，不能重复');
      return;
    }
    if (!trimmedAdmin) {
      setFormError('管理员姓名为必填项');
      return;
    }
    if (trimmedAdmin.length > 20) {
      setFormError('管理员姓名最多支持20个字符');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(trimmedPhone)) {
      setFormError('请输入合法的11位管理员手机号码（作为租户端登录账号）');
      return;
    }

    addMerchant({
      name: trimmedName,
      type: newType,
      adminName: trimmedAdmin,
      adminPhone: trimmedPhone,
      creditCode: `91${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`,
      authorizedProducts: ['丰迹', '选址参谋'],
      apiCallsQuota: 50000,
      apiCallsUsed: 0,
      balance: newType === '付费版' ? 50000 : 0,
    });

    setIsAddModalOpen(false);
    showToast('创建成功', `企业商户【${trimmedName}】已创建，管理员可使用手机号登录租户端`);
  };

  const handleOpenEdit = (m: Merchant) => {
    setEditMerchantData(m);
    setEditName(m.name);
    setEditType(m.type);
    setEditAdminName(m.adminName || '');
    setEditAdminPhone(m.adminPhone || '');
    setEditFormError('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMerchantData) return;
    const trimmedName = editName.trim();
    const trimmedAdmin = editAdminName.trim();
    const trimmedPhone = editAdminPhone.trim();

    if (!trimmedName) {
      setEditFormError('商户名称为必填项');
      return;
    }
    if (trimmedName.length > 50) {
      setEditFormError('商户名称最多50字');
      return;
    }
    const duplicate = merchants.some(
      (m) => m.id !== editMerchantData.id && m.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setEditFormError('商户名称已存在，不能与其他商户重复');
      return;
    }
    if (!trimmedAdmin) {
      setEditFormError('管理员姓名为必填项');
      return;
    }
    if (trimmedAdmin.length > 20) {
      setEditFormError('管理员姓名最多20字');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(trimmedPhone)) {
      setEditFormError('请输入合法的11位管理员手机号码');
      return;
    }

    updateMerchant(editMerchantData.id, {
      name: trimmedName,
      type: editType,
      adminName: trimmedAdmin,
      adminPhone: trimmedPhone,
    });

    if (detailMerchant && detailMerchant.id === editMerchantData.id) {
      setDetailMerchant({
        ...detailMerchant,
        name: trimmedName,
        type: editType,
        adminName: trimmedAdmin,
        adminPhone: trimmedPhone,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    }

    setEditMerchantData(null);
    showToast('修改成功', `商户及管理员信息已更新`);
  };

  const handleConfirmFreezeToggle = () => {
    if (!freezeConfirmMerchant) return;
    toggleFreezeMerchant(freezeConfirmMerchant.id);
    const willBeFrozen = freezeConfirmMerchant.status === '正常';
    if (detailMerchant && detailMerchant.id === freezeConfirmMerchant.id) {
      setDetailMerchant({
        ...detailMerchant,
        status: willBeFrozen ? '冻结' : '正常',
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    }
    setFreezeConfirmMerchant(null);
  };

  // If viewing merchant detail, render 3.1.1.3 商户详情页
  if (detailMerchant) {
    const currentDetailLive = merchants.find((m) => m.id === detailMerchant.id) || detailMerchant;
    const isFrozen = currentDetailLive.status === '冻结';

    return (
      <div className="space-y-6 pb-12 w-full">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setDetailMerchant(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回商户列表</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEdit(currentDetailLive)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>编辑商户</span>
            </button>
            <button
              onClick={() => setFreezeConfirmMerchant(currentDetailLive)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                isFrozen
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                  : 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
              }`}
            >
              {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isFrozen ? '解冻商户' : '冻结商户'}</span>
            </button>
          </div>
        </div>

        {/* 页面上部 — 商户基本信息 (3.1.1.3) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Building2 className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">{currentDetailLive.name}</h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                      currentDetailLive.type === '付费版'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {currentDetailLive.type}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      currentDetailLive.status === '正常'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        currentDetailLive.status === '正常' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {currentDetailLive.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  商户ID: {currentDetailLive.id}
                </div>
              </div>
            </div>
          </div>

          {/* Key-Value Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">商户ID</div>
              <div className="font-mono font-bold text-slate-900 text-sm">{currentDetailLive.id}</div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">商户名称</div>
              <div className="font-semibold text-slate-900 text-sm truncate">{currentDetailLive.name}</div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">商户类型</div>
              <div className="font-bold text-slate-900 text-sm">{currentDetailLive.type}</div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">管理员 (姓名与手机)</div>
              <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                <span>{currentDetailLive.adminName}</span>
                <span className="text-slate-500 font-mono text-xs">({currentDetailLive.adminPhone})</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">账户状态</div>
              <div className="font-bold text-slate-900 text-sm">
                {currentDetailLive.status === '正常' ? (
                  <span className="text-emerald-600">正常活跃 (租户可登录)</span>
                ) : (
                  <span className="text-rose-600">已冻结 (租户禁止登录)</span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">创建时间</div>
              <div className="font-mono text-slate-700 text-xs">
                {currentDetailLive.createdAt}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">最后更新时间</div>
              <div className="font-mono text-slate-700 text-xs">
                {currentDetailLive.updatedAt || currentDetailLive.createdAt}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">任务总数</div>
              <div className="font-bold text-indigo-600 text-sm font-mono">
                {merchantTasks.length} 个任务
              </div>
            </div>
          </div>
        </div>

        {/* 页面下部 — 任务列表 (3.1.1.3) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>该商户下关联任务列表</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                默认按创建时间倒序排列，支持按任务状态筛选查看
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={taskStatusFilter}
                onChange={(e) => {
                  setTaskStatusFilter(e.target.value);
                  setTaskCurrentPage(1);
                }}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
              >
                <option value="all">所有状态 (待配置 / 已生效 / 已失效)</option>
                <option value="待配置">待配置</option>
                <option value="已生效">已生效</option>
                <option value="已失效">已失效</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4 whitespace-nowrap">任务名称</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">任务编号</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">任务状态</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">负责人</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">创建时间</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      该商户暂无符合筛选条件的工作任务
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setViewTaskDetail(task)}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-left transition cursor-pointer"
                        >
                          {task.name}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{task.id}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            task.status === '已生效'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : task.status === '已失效'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {task.responsiblePerson || '运营专员 (李雷)'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {task.createdAt}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setViewTaskDetail(task)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>查看详情</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Task Pagination */}
          {taskTotalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                共 {merchantTasks.length} 条任务记录，第 {taskCurrentPage} / {taskTotalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={taskCurrentPage === 1}
                  onClick={() => setTaskCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={taskCurrentPage === taskTotalPages}
                  onClick={() => setTaskCurrentPage((p) => Math.min(taskTotalPages, p + 1))}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Task Detail Modal */}
        <Modal
          isOpen={!!viewTaskDetail}
          onClose={() => setViewTaskDetail(null)}
          title="任务详情（3.2.1.4）"
          maxWidth="max-w-2xl"
        >
          {viewTaskDetail && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{viewTaskDetail.name}</span>
                  <span className="px-2.5 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {viewTaskDetail.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2">
                  <div>任务ID: <span className="font-mono font-bold text-slate-900">{viewTaskDetail.id}</span></div>
                  <div>所属商户: <span className="font-bold text-slate-900">{viewTaskDetail.merchantName}</span></div>
                  <div>负责人: <span className="font-medium text-slate-900">{viewTaskDetail.responsiblePerson || '李雷'}</span></div>
                  <div>创建时间: <span className="font-mono text-slate-700">{viewTaskDetail.createdAt}</span></div>
                  <div>工单总量: <span className="font-mono font-bold text-indigo-600">{viewTaskDetail.orderCount} 笔</span></div>
                  <div>已完成量: <span className="font-mono font-bold text-emerald-600">{viewTaskDetail.completedCount} 笔</span></div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewTaskDetail(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Merchant Modal */}
        <Modal
          isOpen={!!editMerchantData}
          onClose={() => setEditMerchantData(null)}
          title="编辑商户信息"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            {editFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                商户名称 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={50}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="请输入企业全称（最多50字）"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                商户类型 <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="editTypeDetail"
                    value="付费版"
                    checked={editType === '付费版'}
                    onChange={() => setEditType('付费版')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>付费版 (企业旗舰)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="editTypeDetail"
                    value="试用版"
                    checked={editType === '试用版'}
                    onChange={() => setEditType('试用版')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>试用版 (测试体验)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                管理员姓名 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={20}
                value={editAdminName}
                onChange={(e) => setEditAdminName(e.target.value)}
                placeholder="请输入主管理员姓名（最多20字）"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                管理员手机号 <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                maxLength={11}
                value={editAdminPhone}
                onChange={(e) => setEditAdminPhone(e.target.value)}
                placeholder="请输入11位管理员手机号（作为租户端登录账号）"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
              <div className="text-[11px] text-slate-400 mt-1">作为租户端登录账号</div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditMerchantData(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition cursor-pointer shadow-xs"
              >
                保存修改
              </button>
            </div>
          </form>
        </Modal>

        {/* Freeze Confirm Modal */}
        <Modal
          isOpen={!!freezeConfirmMerchant}
          onClose={() => setFreezeConfirmMerchant(null)}
          title={freezeConfirmMerchant?.status === '正常' ? '确认冻结该商户？' : '确认解冻该商户？'}
          maxWidth="max-w-md"
        >
          {freezeConfirmMerchant && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">
                    {freezeConfirmMerchant.status === '正常'
                      ? '冻结后，该企业租户管理员及所有成员将无法登录租户端！'
                      : '解冻后，该企业租户管理员可恢复正常登录和下单功能。'}
                  </div>
                  <div className="text-slate-600 mt-1">商户：{freezeConfirmMerchant.name}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setFreezeConfirmMerchant(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFreezeToggle}
                  className={`px-4 py-2 font-semibold text-white rounded-xl transition cursor-pointer shadow-xs ${
                    freezeConfirmMerchant.status === '正常'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {freezeConfirmMerchant.status === '正常' ? '确认冻结' : '确认解冻'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // Otherwise render 3.1.1.1 商户列表 (丰迹tab)
  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Building2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">商户管理</h1>
            </div>
            <p className="text-xs text-slate-500 max-w-4xl leading-relaxed">
              商户管理复用开放平台统一体系（选址参谋、丰策智能体已有商户管理），丰迹在现有商户管理页面新增独立tab页，专门管理丰迹商户。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>新建商户</span>
            </button>
          </div>
        </div>

        {/* Tabs: 选址参谋、丰策智能体、丰迹 */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => {
              setActiveTab('fengji');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'fengji'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span>丰迹 ({merchants.filter((m) => m.authorizedProducts?.includes('丰迹')).length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('xuanzhi');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'xuanzhi'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>选址参谋 ({merchants.filter((m) => m.authorizedProducts?.includes('选址参谋')).length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('fengce');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'fengce'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span>丰策智能体 ({merchants.filter((m) => m.authorizedProducts?.includes('丰策智能体')).length})</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden w-full">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索商户名、商户ID、管理员姓名、手机号..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl w-72 sm:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="all">所有商户类型 (试用版 / 付费版)</option>
              <option value="付费版">付费版</option>
              <option value="试用版">试用版</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 whitespace-nowrap">
            共 <span className="font-bold text-slate-900">{filteredMerchants.length}</span> 家商户（默认按创建时间倒序）
          </div>
        </div>

        {/* 3.1.1.1 Table Fields */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4 whitespace-nowrap w-36">商户ID</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[240px]">商户名称</th>
                <th className="py-3.5 px-4 whitespace-nowrap w-28 text-center">商户类型</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[220px]">管理员</th>
                <th className="py-3.5 px-4 whitespace-nowrap w-44">创建时间</th>
                <th className="py-3.5 px-4 whitespace-nowrap w-28 text-center">任务数量</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-right min-w-[220px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMerchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    未找到匹配商户数据
                  </td>
                </tr>
              ) : (
                paginatedMerchants.map((merchant) => {
                  const isFrozen = merchant.status === '冻结';
                  const taskCount = tasks.filter((t) => t.merchantId === merchant.id).length;

                  return (
                    <tr
                      key={merchant.id}
                      className={`transition ${
                        isFrozen
                          ? 'bg-slate-100/70 text-slate-400 opacity-75'
                          : 'hover:bg-slate-50/70 text-slate-800'
                      }`}
                    >
                      {/* 商户ID */}
                      <td className="py-4 px-4 font-mono font-bold">
                        <span className={isFrozen ? 'text-slate-400' : 'text-slate-900'}>
                          {merchant.id}
                        </span>
                      </td>

                      {/* 商户名称 */}
                      <td className="py-4 px-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className={isFrozen ? 'text-slate-500 line-through' : 'text-slate-900'}>
                            {merchant.name}
                          </span>
                          {isFrozen && (
                            <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 rounded font-semibold whitespace-nowrap">
                              已冻结 (禁止登录)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 商户类型 */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                            isFrozen
                              ? 'bg-slate-200 text-slate-500 border-slate-300'
                              : merchant.type === '付费版'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {merchant.type}
                        </span>
                      </td>

                      {/* 管理员 */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{merchant.adminName}</span>
                          <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {merchant.adminPhone}
                          </span>
                        </div>
                      </td>

                      {/* 创建时间 */}
                      <td className="py-4 px-4 font-mono text-slate-500 text-[11px]">
                        {merchant.createdAt}
                      </td>

                      {/* 任务数量 */}
                      <td className="py-4 px-4 text-center font-mono font-bold text-indigo-600">
                        {taskCount}
                      </td>

                      {/* 操作: 编辑/冻结/解冻/查看 */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {/* 查看 */}
                          <button
                            type="button"
                            onClick={() => {
                              setDetailMerchant(merchant);
                              setTaskStatusFilter('all');
                              setTaskCurrentPage(1);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>查看</span>
                          </button>

                          {/* 编辑 */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(merchant)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>编辑</span>
                          </button>

                          {/* 冻结 / 解冻 */}
                          <button
                            type="button"
                            onClick={() => setFreezeConfirmMerchant(merchant)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                              isFrozen
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                : 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            <span>{isFrozen ? '解冻' : '冻结'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination: 每页20条 */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              共 {filteredMerchants.length} 家商户，第 {currentPage} / {totalPages} 页（每页 {pageSize} 条）
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

      {/* 3.1.1.2 新建商户 Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="新建丰迹商户（3.1.1.2）"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <p className="text-slate-500 leading-relaxed">
            创建丰迹商户，同时创建企业租户管理员账号。创建成功后，管理员可使用手机号登录租户端。
          </p>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. 商户名称 (必填, 最多50字) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              商户名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={50}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="请输入企业名称（最多50字，且不能重复）"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="text-[11px] text-slate-400 mt-1">企业名称，最多50字，不可重复</div>
          </div>

          {/* 2. 商户类型 (单选: 试用版/付费版) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              商户类型 <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="newType"
                  value="付费版"
                  checked={newType === '付费版'}
                  onChange={() => setNewType('付费版')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>付费版</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="newType"
                  value="试用版"
                  checked={newType === '试用版'}
                  onChange={() => setNewType('试用版')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>试用版</span>
              </label>
            </div>
          </div>

          {/* 3. 管理员姓名 (必填, 最多20字) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              管理员姓名 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={20}
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              placeholder="请输入企业管理员姓名（最多20字）"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* 4. 管理员手机号 (必填, 手机号格式校验) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              管理员手机号 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={11}
              value={newAdminPhone}
              onChange={(e) => setNewAdminPhone(e.target.value)}
              placeholder="请输入11位管理员手机号"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
            />
            <div className="text-[11px] text-slate-400 mt-1">作为租户端登录账号</div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition cursor-pointer shadow-xs"
            >
              立即创建
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Merchant Modal */}
      <Modal
        isOpen={!!editMerchantData}
        onClose={() => setEditMerchantData(null)}
        title="编辑商户（3.1.1.1）"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {editFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{editFormError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              商户名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={50}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="请输入企业全称（最多50字）"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              商户类型 <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="editType"
                  value="付费版"
                  checked={editType === '付费版'}
                  onChange={() => setEditType('付费版')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>付费版</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="editType"
                  value="试用版"
                  checked={editType === '试用版'}
                  onChange={() => setEditType('试用版')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>试用版</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              管理员姓名 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={20}
              value={editAdminName}
              onChange={(e) => setEditAdminName(e.target.value)}
              placeholder="请输入主管理员姓名（最多20字）"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              管理员手机号 <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              maxLength={11}
              value={editAdminPhone}
              onChange={(e) => setEditAdminPhone(e.target.value)}
              placeholder="请输入11位管理员手机号（作为租户端登录账号）"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
            />
            <div className="text-[11px] text-slate-400 mt-1">作为租户端登录账号</div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditMerchantData(null)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition cursor-pointer shadow-xs"
            >
              保存修改
            </button>
          </div>
        </form>
      </Modal>

      {/* Freeze Confirm Modal */}
      <Modal
        isOpen={!!freezeConfirmMerchant}
        onClose={() => setFreezeConfirmMerchant(null)}
        title={freezeConfirmMerchant?.status === '正常' ? '确认冻结商户？' : '确认解冻商户？'}
        maxWidth="max-w-md"
      >
        {freezeConfirmMerchant && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">
                  {freezeConfirmMerchant.status === '正常'
                    ? '确认后商户状态变为冻结，租户将无法登录租户端！'
                    : '确认后商户状态恢复正常，租户可恢复正常登录。'}
                </div>
                <div className="text-slate-600 mt-1">商户名称：{freezeConfirmMerchant.name}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setFreezeConfirmMerchant(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer font-medium"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmFreezeToggle}
                className={`px-4 py-2 font-semibold text-white rounded-xl transition cursor-pointer shadow-xs ${
                  freezeConfirmMerchant.status === '正常'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {freezeConfirmMerchant.status === '正常' ? '确认冻结' : '确认解冻'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
