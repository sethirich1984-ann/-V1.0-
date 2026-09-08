import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Send,
  RotateCw,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Building2,
  Layers,
  ChevronRight,
  ExternalLink,
  Copy,
  Sparkles,
  ShieldCheck,
  Zap,
  Check,
  Eye,
  AlertTriangle,
  XCircle,
  FileText,
  Truck,
  MapPin,
  Phone,
  User,
  LayoutGrid,
  List,
  Edit3,
  Trash2,
  SlidersHorizontal,
  ChevronLeft,
  X,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DispatchRecord,
  DispatchStatus,
  OrderItem,
  OrderStatusCode,
  TaskItem,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { ExecutionTimeline } from '../common/ExecutionTimeline';
import { Lightbox } from '../common/Lightbox';

export const DispatchManagement: React.FC = () => {
  const {
    dispatchRecords,
    tasks,
    merchants,
    orders,
    createDispatchRecord,
    executeDispatch,
    retryFailedDispatchOrders,
    updateOrder,
    cancelOrder,
    simulateStepOrder,
    dispatchModalOpenRequested,
    setDispatchModalOpenRequested,
    prefilledDispatchTask,
    setPrefilledDispatchTask,
    showToast,
  } = useApp();

  // View state: 'list' (main layout) or 'detail' (PRD 3.2.2.2 record details)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Layout mode: 'grouped' (PRD 3.2.2.1 grouped by task) vs 'flat' (flat table)
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  // Filters (PRD 3.2.2.1: 商户, 任务, 渠道, 状态, 搜索)
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState<string>('all');
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('all');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination (每页20条)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Single order detail modal state
  const [detailModalOrderId, setDetailModalOrderId] = useState<string | null>(null);

  // New Dispatch Wizard State (PRD 3.2.2.3 4-Step Wizard)
  const [isNewDispatchOpen, setIsNewDispatchOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard Step 1: Merchant
  const [wizardMerchantId, setWizardMerchantId] = useState<string>('');
  const [merchantSearchTerm, setMerchantSearchTerm] = useState<string>('');

  // Wizard Step 2: Task
  const [wizardTaskId, setWizardTaskId] = useState<string>('');
  const [taskSearchTerm, setTaskSearchTerm] = useState<string>('');

  // Wizard Step 3: Channel
  const [wizardChannel, setWizardChannel] = useState<'丰创' | '顺丰同城'>('丰创');

  // Wizard Step 4: Template & Upload & Service Config
  const [enablePreValidation, setEnablePreValidation] = useState(true);
  const [autoDispatchImmediately, setAutoDispatchImmediately] = useState(true);
  const [uploadFileName, setUploadFileName] = useState<string>('巡检网点导入清单_2026.xlsx');
  const [isUploading, setIsUploading] = useState(false);

  // 空间智能清洗实时进度状态 (针对百千级点位清洗过程的可视化反馈)
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [cleaningProgress, setCleaningProgress] = useState<number>(0);
  const [cleaningCurrentCount, setCleaningCurrentCount] = useState<number>(0);
  const [cleaningTotalCount, setCleaningTotalCount] = useState<number>(0);
  const [cleaningStatusText, setCleaningStatusText] = useState<string>('');
  const cleaningTimerRef = useRef<any>(null);
  const pendingFinishRef = useRef<(() => void) | null>(null);

  // 清洗进度动画发生器
  const runCleaningAnimation = (totalCount: number, onFinish: () => void) => {
    if (cleaningTimerRef.current) clearInterval(cleaningTimerRef.current);
    pendingFinishRef.current = onFinish;
    setIsCleaning(true);
    setCleaningProgress(0);
    setCleaningCurrentCount(0);
    setCleaningTotalCount(totalCount);
    setCleaningStatusText('正在读取并结构化解析 Excel 表头字段...');

    const startTime = Date.now();
    const duration = totalCount > 50 ? 2500 : 1500;

    cleaningTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(99, Math.floor((elapsed / duration) * 100));
      const processed = Math.min(totalCount, Math.floor((pct / 100) * totalCount));

      setCleaningProgress(pct);
      setCleaningCurrentCount(processed);

      if (pct < 25) {
        setCleaningStatusText('正在读取并结构化解析 Excel 原始字段...');
      } else if (pct < 60) {
        setCleaningStatusText('正在调用顺丰空间智能中心对齐五级标准地址...');
      } else if (pct < 88) {
        setCleaningStatusText('正在匹配顺丰末端履约网格与服务时效圈...');
      } else {
        setCleaningStatusText('正在核验手机号段合规性并归因三态健康度...');
      }

      if (elapsed >= duration) {
        clearInterval(cleaningTimerRef.current);
        setCleaningProgress(100);
        setCleaningCurrentCount(totalCount);
        setCleaningStatusText('顺丰空间智能清洗完成！');
        setTimeout(() => {
          setIsCleaning(false);
          if (pendingFinishRef.current) {
            pendingFinishRef.current();
            pendingFinishRef.current = null;
          }
        }, 250);
      }
    }, 45);
  };

  const handleSkipCleaning = () => {
    if (cleaningTimerRef.current) clearInterval(cleaningTimerRef.current);
    setCleaningProgress(100);
    setCleaningCurrentCount(cleaningTotalCount);
    setCleaningStatusText('顺丰空间智能清洗完成！');
    setIsCleaning(false);
    if (pendingFinishRef.current) {
      pendingFinishRef.current();
      pendingFinishRef.current = null;
    }
  };

  // Mock parsed POI rows with rich SF address governance fields
  const [parsedRows, setParsedRows] = useState<
    Array<{
      contactCompany: string;
      contactName: string;
      contactPhone: string;
      address: string;
      rawAddress?: string;
      cleanAddress?: string;
      gridCode?: string;
      gridName?: string;
      confidence?: number;
      healthStatus?: 'perfect' | 'improved' | 'warning';
      serviceBadges?: Array<{ label: string; type: 'success' | 'info' | 'warning' | 'neutral' }>;
      diffNote?: string;
      isAccepted?: boolean;
      isValid: boolean;
      errorReason?: string;
    }>
  >([
    {
      contactCompany: '喜茶 (深圳万象天地旗舰店)',
      contactName: '李经理',
      contactPhone: '13800138001',
      address: '广东省深圳市南山区粤海街道深南大道9668号华润万象天地NL160号铺',
      rawAddress: '广东省深圳市南山区深南大道9668号万象天地NL160号商铺',
      cleanAddress: '广东省深圳市南山区粤海街道深南大道9668号华润万象天地NL160号铺',
      gridCode: 'SF-GD-SZ0755-NS15',
      gridName: '科技园南区顺丰综合网格',
      confidence: 100,
      healthStatus: 'perfect',
      serviceBadges: [
        { label: '免审合规', type: 'success' },
        { label: '30min极速网格', type: 'success' },
      ],
      diffNote: '标准五级地址与末端网格完全吻合，可免审直接下发',
      isAccepted: true,
      isValid: true,
    },
    {
      contactCompany: '喜茶 (深圳海岸城精选店)',
      contactName: '王店长',
      contactPhone: '13912345678',
      address: '深圳市南山区文心五路33号海岸城购物中心1层182号',
      rawAddress: '深圳市南山区文心五路33号海岸城购物中心1层182号',
      cleanAddress: '广东省深圳市南山区粤海街道文心五路33号海岸城商业广场1层182号铺',
      gridCode: 'SF-GD-SZ0755-NS08',
      gridName: '南山后海中心区网格',
      confidence: 98,
      healthStatus: 'improved',
      serviceBadges: [
        { label: '粤海街道补齐', type: 'info' },
        { label: '网格已覆盖', type: 'success' },
      ],
      diffNote: '智能补齐“广东省深圳市南山区粤海街道”五级行政层级并校准商业广场铺位',
      isAccepted: true,
      isValid: true,
    },
    {
      contactCompany: '喜茶 (深圳壹方城热麦店)',
      contactName: '张店长',
      contactPhone: '13700001111',
      address: '广东省深圳市宝安区新安街道新湖路99号壹方城中心B1层039号铺',
      rawAddress: '宝安区新湖路99号壹方城B1层039号',
      cleanAddress: '广东省深圳市宝安区新安街道新湖路99号壹方城中心B1层039号铺',
      gridCode: 'SF-GD-SZ0755-BA06',
      gridName: '宝安中心区履约网格',
      confidence: 97,
      healthStatus: 'improved',
      serviceBadges: [
        { label: '新安街道补齐', type: 'info' },
        { label: '号码有效', type: 'neutral' },
      ],
      diffNote: '补齐“广东省深圳市宝安区新安街道”行政前缀，对齐顺丰末端标准网格',
      isAccepted: true,
      isValid: true,
    },
    {
      contactCompany: '喜茶 (深圳益田假日广场店)',
      contactName: '赵店长',
      contactPhone: '13611112222',
      address: '广东省深圳市南山区沙河街道深南大道9028号益田假日广场B2层',
      rawAddress: '广东省深圳市南山区深南大道9028号益田假日广场B2层',
      cleanAddress: '广东省深圳市南山区沙河街道深南大道9028号益田假日广场B2层21号铺',
      gridCode: 'SF-GD-SZ0755-NS02',
      gridName: '华侨城网格服务点',
      confidence: 99,
      healthStatus: 'improved',
      serviceBadges: [
        { label: '沙河街道补齐', type: 'info' },
        { label: '时效网格直达', type: 'success' },
      ],
      diffNote: '校准商场B2层末端铺位编号，顺丰小哥可精确直达后厨核验',
      isAccepted: true,
      isValid: true,
    },
    {
      contactCompany: '喜茶 (深圳海雅缤纷城店)',
      contactName: '陈店长',
      contactPhone: '13522223333',
      address: '广东省深圳市宝安区新安街道建安一路99号海雅缤纷城1层L110号',
      rawAddress: '宝民一路海雅缤纷城1层L110',
      cleanAddress: '广东省深圳市宝安区新安街道建安一路99号海雅缤纷城1层L110号',
      gridCode: 'SF-GD-SZ0755-BA02',
      gridName: '宝安新安老城网格',
      confidence: 96,
      healthStatus: 'improved',
      serviceBadges: [
        { label: '路名智能校正', type: 'info' },
        { label: '网格已覆盖', type: 'success' },
      ],
      diffNote: '原录入“宝民一路”存在误差，已精准纠正为建安一路海雅缤纷城标准地址',
      isAccepted: true,
      isValid: true,
    },
  ]);

  // 合一整合模式下的三态分流与过滤状态
  const [healthStatusFilter, setHealthStatusFilter] = useState<'all' | 'perfect' | 'improved' | 'warning'>('all');
  const [poiSearchTerm, setPoiSearchTerm] = useState<string>('');
  const [poiCurrentPage, setPoiCurrentPage] = useState<number>(1);
  const poiPageSize = 10;
  const [showServiceConfigModal, setShowServiceConfigModal] = useState<boolean>(false);
  const [activeServices, setActiveServices] = useState<{
    addressValidation: boolean;
    gridVerification: boolean;
    phoneValidation: boolean;
    temperatureColdChain: boolean;
  }>({
    addressValidation: true,
    gridVerification: true,
    phoneValidation: true,
    temperatureColdChain: false,
  });

  // 跨服务三态统计
  const poiHealthStats = useMemo(() => {
    let perfect = 0;
    let improved = 0;
    let warning = 0;
    parsedRows.forEach((r) => {
      const status =
        r.healthStatus ||
        (!r.isValid || r.errorReason ? 'warning' : r.cleanAddress && r.cleanAddress !== r.rawAddress ? 'improved' : 'perfect');
      if (status === 'perfect') perfect++;
      else if (status === 'warning') warning++;
      else improved++;
    });
    return {
      total: parsedRows.length,
      perfect,
      improved,
      warning,
    };
  }, [parsedRows]);

  // 过滤后的网点
  const filteredPoiRows = useMemo(() => {
    return parsedRows.filter((r) => {
      const status =
        r.healthStatus ||
        (!r.isValid || r.errorReason ? 'warning' : r.cleanAddress && r.cleanAddress !== r.rawAddress ? 'improved' : 'perfect');
      const matchStatus = healthStatusFilter === 'all' || status === healthStatusFilter;
      const matchSearch =
        !poiSearchTerm ||
        r.contactCompany.toLowerCase().includes(poiSearchTerm.toLowerCase()) ||
        r.contactName.toLowerCase().includes(poiSearchTerm.toLowerCase()) ||
        r.contactPhone.includes(poiSearchTerm) ||
        (r.rawAddress || r.address).toLowerCase().includes(poiSearchTerm.toLowerCase()) ||
        (r.cleanAddress || '').toLowerCase().includes(poiSearchTerm.toLowerCase()) ||
        (r.gridCode || '').toLowerCase().includes(poiSearchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [parsedRows, healthStatusFilter, poiSearchTerm]);

  // 分页列表 (支持 1,000 条甚至海量数据流畅渲染)
  const poiTotalPages = Math.max(1, Math.ceil(filteredPoiRows.length / poiPageSize));
  const paginatedPoiRows = useMemo(() => {
    const start = (poiCurrentPage - 1) * poiPageSize;
    return filteredPoiRows.slice(start, start + poiPageSize);
  }, [filteredPoiRows, poiCurrentPage, poiPageSize]);

  // Validation errors preview list
  const [validationErrors, setValidationErrors] = useState<
    Array<{ rowNumber: number; field: string; error: string }>
  >([]);

  // 重新下单源批次ID（通过“修改后重新下单”唤起向导时记录）
  const [reorderSourceDispatchId, setReorderSourceDispatchId] = useState<string | null>(null);

  // 向导第4步网点行内编辑状态
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editRowCompany, setEditRowCompany] = useState('');
  const [editRowName, setEditRowName] = useState('');
  const [editRowPhone, setEditRowPhone] = useState('');
  const [editRowAddress, setEditRowAddress] = useState('');

  // Open dispatch wizard when requested from TaskManagement
  useEffect(() => {
    if (dispatchModalOpenRequested && prefilledDispatchTask) {
      setWizardMerchantId(prefilledDispatchTask.merchantId);
      setWizardTaskId(prefilledDispatchTask.id);
      if (prefilledDispatchTask.channelConfigs['无需配置（自主能力）']) {
        setWizardChannel('丰创');
      } else if (prefilledDispatchTask.channelConfigs['丰创']) {
        setWizardChannel('丰创');
      }
      setWizardStep(4); // Jump directly to template & upload step
      setIsNewDispatchOpen(true);
      setDispatchModalOpenRequested(false);
      setPrefilledDispatchTask(null);
    }
  }, [
    dispatchModalOpenRequested,
    prefilledDispatchTask,
    setDispatchModalOpenRequested,
    setPrefilledDispatchTask,
  ]);

  // Sync initial merchant selection in wizard
  useEffect(() => {
    if (!wizardMerchantId && merchants.length > 0) {
      setWizardMerchantId(merchants[0].id);
    }
  }, [merchants, wizardMerchantId]);

  // Reset task when merchant changes in wizard
  const wizardAvailableTasks = useMemo(() => {
    if (!wizardMerchantId) return [];
    return tasks.filter(
      (t) =>
        t.merchantId === wizardMerchantId &&
        (taskSearchTerm
          ? t.name.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
            t.id.toLowerCase().includes(taskSearchTerm.toLowerCase())
          : true)
    );
  }, [tasks, wizardMerchantId, taskSearchTerm]);

  useEffect(() => {
    if (wizardAvailableTasks.length > 0) {
      if (!wizardTaskId || !wizardAvailableTasks.some((t) => t.id === wizardTaskId)) {
        setWizardTaskId(wizardAvailableTasks[0].id);
      }
    } else {
      setWizardTaskId('');
    }
  }, [wizardAvailableTasks, wizardTaskId]);

  // Filter tasks in filter bar (cascading with selected merchant)
  const filterAvailableTasks = useMemo(() => {
    if (selectedMerchantFilter === 'all') {
      return tasks;
    }
    return tasks.filter((t) => t.merchantId === selectedMerchantFilter);
  }, [tasks, selectedMerchantFilter]);

  // When merchant filter changes, reset task filter if incompatible
  const handleMerchantFilterChange = (merchantId: string) => {
    setSelectedMerchantFilter(merchantId);
    if (merchantId !== 'all') {
      const isTaskValid = tasks.some(
        (t) => t.merchantId === merchantId && t.id === selectedTaskFilter
      );
      if (!isTaskValid) {
        setSelectedTaskFilter('all');
      }
    }
  };

  // Filter dispatch records based on PRD 3.2.2.1 filter bar
  const filteredRecords = useMemo(() => {
    return dispatchRecords.filter((rec) => {
      // Merchant filter
      if (selectedMerchantFilter !== 'all' && rec.merchantId !== selectedMerchantFilter) {
        return false;
      }
      // Task filter
      if (selectedTaskFilter !== 'all' && rec.taskId !== selectedTaskFilter) {
        return false;
      }
      // Channel filter
      if (selectedChannelFilter !== 'all') {
        if (!rec.channel.toLowerCase().includes(selectedChannelFilter.toLowerCase())) {
          return false;
        }
      }
      // Status filter
      if (selectedStatusFilter !== 'all' && rec.status !== selectedStatusFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchBatch = rec.batchNo.toLowerCase().includes(q);
        const matchTask = rec.taskName.toLowerCase().includes(q);
        const matchMerchant = rec.merchantName.toLowerCase().includes(q);
        const matchCreator = rec.createdBy.toLowerCase().includes(q);
        const matchChannel = rec.channel.toLowerCase().includes(q);
        if (!matchBatch && !matchTask && !matchMerchant && !matchCreator && !matchChannel) {
          return false;
        }
      }
      return true;
    });
  }, [
    dispatchRecords,
    selectedMerchantFilter,
    selectedTaskFilter,
    selectedChannelFilter,
    selectedStatusFilter,
    searchTerm,
  ]);

  // Group records by Task (PRD 3.2.2.1 交互规则: 默认按任务分组，同一任务内按时间倒序，任务间按最近下单时间倒序)
  const taskGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        taskId: string;
        taskName: string;
        merchantId: string;
        merchantName: string;
        channel: string;
        records: DispatchRecord[];
        latestCreatedAt: string;
        totalOrdersCount: number;
      }
    >();

    filteredRecords.forEach((rec) => {
      if (!map.has(rec.taskId)) {
        map.set(rec.taskId, {
          taskId: rec.taskId,
          taskName: rec.taskName,
          merchantId: rec.merchantId,
          merchantName: rec.merchantName,
          channel: rec.channel,
          records: [],
          latestCreatedAt: rec.createdAt,
          totalOrdersCount: 0,
        });
      }
      const group = map.get(rec.taskId)!;
      group.records.push(rec);
      group.totalOrdersCount += (rec.totalCount ?? rec.orderCount ?? 0);
      if (new Date(rec.createdAt) > new Date(group.latestCreatedAt)) {
        group.latestCreatedAt = rec.createdAt;
      }
    });

    // Sort records within each task by time descending
    map.forEach((group) => {
      group.records.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    // Sort task groups by their latest dispatch time descending
    const groupsArray = Array.from(map.values());
    groupsArray.sort(
      (a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime()
    );

    return groupsArray;
  }, [filteredRecords]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedMerchantFilter('all');
    setSelectedTaskFilter('all');
    setSelectedChannelFilter('all');
    setSelectedStatusFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // 切换单个点位采纳状态
  const handleToggleAcceptSuggestion = (index: number) => {
    setParsedRows((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          isAccepted: next[index].isAccepted === false ? true : false,
        };
      }
      return next;
    });
  };

  // 一键全部采纳优化
  const handleAcceptAllSuggestions = () => {
    setParsedRows((prev) =>
      prev.map((r) => ({
        ...r,
        isAccepted: true,
      }))
    );
    showToast('已全部采纳优化建议', '已将顺丰五级标准地址与网格服务对齐至本次推单清单', 'success');
  };

  // 一键保留原始录入数据
  const handleRejectAllSuggestions = () => {
    setParsedRows((prev) =>
      prev.map((r) => ({
        ...r,
        isAccepted: false,
      }))
    );
    showToast('已保留原数据', '本次下发将优先使用客户原始录入文本', 'info');
  };

  // 导出数据对比与治理明细表 (.csv)
  const handleDownloadValidatedData = () => {
    const headers = [
      '序号',
      '受检门店/网点',
      '联系人',
      '联系电话',
      '原始录入地址',
      '顺丰五级标准建议',
      '末端履约网格',
      '匹配置信度',
      '健康状态',
      '采纳决策',
      '差异与优化说明',
    ];

    const rows = parsedRows.map((r, idx) => [
      idx + 1,
      `"${(r.contactCompany || '').replace(/"/g, '""')}"`,
      `"${(r.contactName || '').replace(/"/g, '""')}"`,
      `"${r.contactPhone || ''}"`,
      `"${(r.rawAddress || r.address || '').replace(/"/g, '""')}"`,
      `"${(r.cleanAddress || r.address || '').replace(/"/g, '""')}"`,
      `"${r.gridCode || 'SF-GD-SZ0755-FT09'}"`,
      `"${r.confidence || 98}%"`,
      `"${r.healthStatus === 'perfect' ? '免审通过' : r.healthStatus === 'warning' ? '待核异常' : '智能优化'}"`,
      `"${r.isAccepted !== false ? '已采纳建议' : '保留原值'}"`,
      `"${(r.diffNote || r.errorReason || '地址与网格匹配良好').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `顺丰运营端_网点地址治理对比清单_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('导出成功', `已下载 ${parsedRows.length} 笔网点数据治理对比表 (.csv)`, 'success');
  };

  // 一键生成 1,000 条企业级大数据测试样本并展示实时清洗进度
  const handleGenerate1000Pois = () => {
    setIsUploading(false);
    const districts = [
      { d: '南山区', st: '粤海街道', g: 'SF-GD-SZ0755-NS15', gn: '科技园南区顺丰网格' },
      { d: '福田区', st: '福保街道', g: 'SF-GD-SZ0755-FT09', gn: '福田保税区综合网格' },
      { d: '宝安区', st: '新安街道', g: 'SF-GD-SZ0755-BA06', gn: '宝安中心区履约网格' },
      { d: '罗湖区', st: '桂园街道', g: 'SF-GD-SZ0755-LH03', gn: '蔡屋围金融网格' },
      { d: '龙华区', st: '民治街道', g: 'SF-GD-SZ0755-LH11', gn: '民治北站时效网格' },
    ];
    const brands = ['喜茶', '奈雪的茶', '星巴克', '瑞幸咖啡', '百果园', '周六福', '名创优品'];
    const malls = ['万象天地', '海岸城', '壹方城', '益田假日', '海雅缤纷城', '天虹商场', '大悦城'];

    const bigData: typeof parsedRows = [];

    for (let i = 1; i <= 1000; i++) {
      const dist = districts[i % districts.length];
      const brand = brands[i % brands.length];
      const mall = malls[i % malls.length];
      const isAnomaly = i % 23 === 0;
      const isPerfect = i % 4 === 0 && !isAnomaly;

      if (isAnomaly) {
        bigData.push({
          contactCompany: `${brand} (深圳${mall}${i}号店)`,
          contactName: `店长${i}`,
          contactPhone: `1380000${String(i).padStart(4, '0')}`,
          address: `广东省深圳市${dist.d}偏远未开发区工业园无名后门`,
          rawAddress: `广东省深圳市${dist.d}偏远未开发区工业园无名后门`,
          cleanAddress: `广东省深圳市${dist.d}${dist.st}后门拟设点位(需人工复勘)`,
          gridCode: `${dist.g}-EX`,
          gridName: `${dist.gn}(边缘)`,
          confidence: 62,
          healthStatus: 'warning',
          serviceBadges: [
            { label: '⚠️ 网格边缘', type: 'warning' },
            { label: '门牌待核', type: 'warning' },
          ],
          diffNote: '超出顺丰网格标准时效圈（>30km），建议人工核验准确门牌',
          isAccepted: false,
          isValid: true,
          errorReason: '超出标准网格服务半径',
        });
      } else if (isPerfect) {
        bigData.push({
          contactCompany: `${brand} (深圳${mall}${i}号店)`,
          contactName: `店长${i}`,
          contactPhone: `1381234${String(i).padStart(4, '0')}`,
          address: `广东省深圳市${dist.d}${dist.st}深南大道${1000 + i}号${mall}中心${(i % 5) + 1}层${100 + (i % 80)}号铺`,
          rawAddress: `广东省深圳市${dist.d}${dist.st}深南大道${1000 + i}号${mall}中心${(i % 5) + 1}层${100 + (i % 80)}号铺`,
          cleanAddress: `广东省深圳市${dist.d}${dist.st}深南大道${1000 + i}号${mall}中心${(i % 5) + 1}层${100 + (i % 80)}号铺`,
          gridCode: dist.g,
          gridName: dist.gn,
          confidence: 100,
          healthStatus: 'perfect',
          serviceBadges: [
            { label: '免审合规', type: 'success' },
            { label: '网格直达', type: 'success' },
          ],
          diffNote: '五级地址与末端网格完全对齐，可免审下发',
          isAccepted: true,
          isValid: true,
        });
      } else {
        bigData.push({
          contactCompany: `${brand} (深圳${mall}${i}号店)`,
          contactName: `店长${i}`,
          contactPhone: `1399876${String(i).padStart(4, '0')}`,
          address: `广东省深圳市${dist.d}${dist.st}人民路${500 + i}号${mall}商业街${(i % 3) + 1}楼`,
          rawAddress: `${dist.d}人民路${500 + i}号${mall}`,
          cleanAddress: `广东省深圳市${dist.d}${dist.st}人民路${500 + i}号${mall}商业街${(i % 3) + 1}楼`,
          gridCode: dist.g,
          gridName: dist.gn,
          confidence: 96,
          healthStatus: 'improved',
          serviceBadges: [
            { label: `${dist.st}补齐`, type: 'info' },
            { label: '末端网格已就绪', type: 'success' },
          ],
          diffNote: `智能补齐“广东省深圳市${dist.d}${dist.st}”规范五级层级`,
          isAccepted: true,
          isValid: true,
        });
      }
    }

    setUploadFileName('企业级万级全国门店巡检点位清单_1000条.xlsx');
    runCleaningAnimation(1000, () => {
      setParsedRows(bigData);
      setPoiCurrentPage(1);
      setHealthStatusFilter('all');
      showToast(
        '清洗完成 · 已载入 1,000 条网点',
        '顺丰空间智能引擎已完成五级地址治理与网格测算，已生成三态健康度分流！',
        'success'
      );
    });
  };

  // 模拟上传日常数据并展示实时清洗进度
  const handleSimulateUpload = () => {
    setIsUploading(false);
    const newName = `运营代理下单_导入清单_${new Date().toISOString().slice(0, 10)}.xlsx`;
    setUploadFileName(newName);
    runCleaningAnimation(parsedRows.length || 5, () => {
      showToast('清洗完成 · 上传解析成功', `已完成 ${parsedRows.length} 条网点数据的五级清洗与网格匹配`, 'success');
    });
  };

  // 打开网点行编辑弹窗
  const handleStartEditRow = (index: number) => {
    const row = parsedRows[index];
    if (!row) return;
    setEditingRowIndex(index);
    setEditRowCompany(row.contactCompany);
    setEditRowName(row.contactName);
    setEditRowPhone(row.contactPhone);
    setEditRowAddress(row.cleanAddress || row.address);
  };

  // 保存网点行编辑
  const handleSaveEditRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRowIndex === null) return;
    setParsedRows((prev) => {
      const next = [...prev];
      const target = next[editingRowIndex];
      next[editingRowIndex] = {
        ...target,
        contactCompany: editRowCompany.trim(),
        contactName: editRowName.trim(),
        contactPhone: editRowPhone.trim(),
        address: editRowAddress.trim(),
        cleanAddress: editRowAddress.trim(),
        healthStatus: 'perfect',
        confidence: 100,
        diffNote: '运营人员已人工核实并修正门牌',
        serviceBadges: [
          { label: '人工已修正', type: 'success' },
          { label: '网格直达', type: 'success' },
        ],
        isValid: true,
        isAccepted: true,
        errorReason: undefined,
      };
      return next;
    });
    setEditingRowIndex(null);
    showToast('网点信息已修正', '数据已更新并校验通过，健康度已更新为【免审通过】', 'success');
  };

  // 删除单条网点
  const handleDeleteRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, i) => i !== index));
    showToast('已移除网点', '该网点已从本次下发清单中剔除', 'info');
  };

  // 恢复向导默认网点模板
  const handleResetWizardDefaults = () => {
    setReorderSourceDispatchId(null);
    setUploadFileName('巡检网点导入清单_2026.xlsx');
    setParsedRows([
      {
        contactCompany: '喜茶 (深圳万象天地旗舰店)',
        contactName: '李经理',
        contactPhone: '13800138001',
        address: '广东省深圳市南山区深南大道9668号万象天地NL160号商铺',
        isValid: true,
      },
      {
        contactCompany: '喜茶 (深圳海岸城精选店)',
        contactName: '王店长',
        contactPhone: '13912345678',
        address: '广东省深圳市南山区文心五路33号海岸城购物中心1层182号',
        isValid: true,
      },
      {
        contactCompany: '喜茶 (深圳壹方城热麦店)',
        contactName: '张店长',
        contactPhone: '13700001111',
        address: '广东省深圳市宝安区新湖路99号壹方城B1层039号',
        isValid: true,
      },
    ]);
    showToast('已恢复默认配置', '已清空失败单导入模式，恢复默认网点模板', 'info');
  };

  // 下载失败订单明细 (CSV 格式，带 UTF-8 BOM，Excel 打开无乱码)
  const handleDownloadFailedOrders = (dispatch: DispatchRecord) => {
    const dispatchBatchKey = dispatch.batchNo || dispatch.id;
    const failedOrders = orders.filter(
      (o) =>
        (o.dispatchId === dispatch.id || o.dispatchBatchNo === dispatchBatchKey) &&
        (o.errorReason ||
          o.status === 'cancelled' ||
          o.status === '下发失败' ||
          o.status === 'failed' ||
          dispatch.status === '全部失败' ||
          dispatch.status === '部分成功')
    );

    const itemsToExport =
      failedOrders.length > 0
        ? failedOrders
        : [
            {
              id: `FAIL-${dispatch.id.slice(-4)}-01`,
              contactCompany: `${dispatch.merchantName || '商户'}·大鹏南澳海滨特约店`,
              contactName: '张敏捷',
              contactPhone: '13811220000',
              address: '广东省深圳市大鹏新区南澳街道海滨路99号后山点位',
              errorReason: 'POI地址超出顺丰网格末端服务半径（>35km），无法调派小哥上门',
            },
          ];

    const headers = ['订单流水号', '受检网点名称', '现场联系人', '联系电话', '履约地址', '下发失败原因', '修改指引建议'];
    const rows = itemsToExport.map((o: any, idx: number) => [
      o.id || `FAIL-ORD-${idx + 1}`,
      `"${(o.contactCompany || '').replace(/"/g, '""')}"`,
      `"${(o.contactName || '').replace(/"/g, '""')}"`,
      `"${o.contactPhone || ''}"`,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      `"${(o.errorReason || o.failureReason || '渠道网格服务校验未通过：联系人电话格式异常或POI地址超出服务半径').replace(/"/g, '""')}"`,
      `"请核对并修正联系人电话为11位有效手机号，或确保受检地址具体到楼栋门牌号后重新下单"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `下单失败订单明细_${dispatchBatchKey}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      '失败订单明细已下载',
      `已成功导出【${dispatchBatchKey}】共 ${itemsToExport.length} 笔失败订单明细表，包含失败原因与修改建议`,
      'success'
    );
  };

  // 修改后重新下单：提取失败订单带入向导第4步进行编辑与重新下发
  const handleModifyAndReorder = (dispatch: DispatchRecord) => {
    const dispatchBatchKey = dispatch.batchNo || dispatch.id;
    const failedOrders = orders.filter(
      (o) =>
        (o.dispatchId === dispatch.id || o.dispatchBatchNo === dispatchBatchKey) &&
        (o.errorReason ||
          o.status === 'cancelled' ||
          o.status === '下发失败' ||
          o.status === 'failed' ||
          dispatch.status === '全部失败' ||
          dispatch.status === '部分成功')
    );

    const initialRows =
      failedOrders.length > 0
        ? failedOrders.map((o) => ({
            contactCompany: o.contactCompany,
            contactName: o.contactName,
            contactPhone: o.contactPhone,
            address: o.address,
            isValid: true,
            errorReason: o.errorReason ? `原失败: ${o.errorReason}` : undefined,
          }))
        : [
            {
              contactCompany: `${dispatch.merchantName || '商户'}·大鹏南澳海滨特约店`,
              contactName: '张敏捷',
              contactPhone: '13811220000',
              address: '广东省深圳市大鹏新区南澳街道海滨路99号后山点位',
              isValid: true,
              errorReason: '原失败: POI地址超出顺丰网格末端服务半径（>35km）',
            },
          ];

    setWizardMerchantId(dispatch.merchantId);
    setWizardTaskId(dispatch.taskId);
    setWizardChannel((dispatch.channel as any) || '丰创');
    setParsedRows(initialRows);
    setUploadFileName(`重新下单_失败修正_${dispatchBatchKey}.xlsx`);
    setReorderSourceDispatchId(dispatchBatchKey);

    // 直接跳至向导第4步（数据核验与下发）
    setWizardStep(4);
    setIsNewDispatchOpen(true);

    showToast(
      '已载入失败订单数据',
      `已将批次【${dispatchBatchKey}】的 ${initialRows.length} 笔失败订单载入向导，您可直接点击【编辑】修改门牌地址与手机号后重新下发`,
      'info'
    );
  };

  // 切换商户时智能联动任务
  const handleWizardMerchantChange = (mId: string) => {
    setWizardMerchantId(mId);
    const available = tasks.filter((t) => t.merchantId === mId);
    if (available.length > 0) {
      setWizardTaskId(available[0].id);
    } else {
      setWizardTaskId('');
    }
  };

  // Open New Dispatch Workspace (方案 C: 合一整合工作台)
  const handleOpenNewWizard = () => {
    setReorderSourceDispatchId(null);
    setUploadFileName('巡检网点导入清单_2026.xlsx');
    setPoiCurrentPage(1);
    setHealthStatusFilter('all');
    setPoiSearchTerm('');

    // 智能默认选中首个具备可用任务的商户
    if (!wizardMerchantId) {
      const merchantWithTasks = merchants.find((m) => tasks.some((t) => t.merchantId === m.id));
      const chosenMerchant = merchantWithTasks || merchants[0];
      if (chosenMerchant) {
        setWizardMerchantId(chosenMerchant.id);
        const available = tasks.filter((t) => t.merchantId === chosenMerchant.id);
        if (available.length > 0) {
          setWizardTaskId(available[0].id);
        }
      }
    } else if (!wizardTaskId) {
      const available = tasks.filter((t) => t.merchantId === wizardMerchantId);
      if (available.length > 0) {
        setWizardTaskId(available[0].id);
      }
    }

    setIsNewDispatchOpen(true);
  };

  // Handle Finish New Dispatch Submit
  const handleFinishNewDispatch = (immediate: boolean) => {
    if (!wizardTaskId || !wizardMerchantId) {
      showToast('表单不完整', '请选定目标商户与执行任务', 'error');
      return;
    }

    const currentTask = tasks.find((t) => t.id === wizardTaskId);
    const channelOrderType =
      wizardChannel === '丰创'
        ? currentTask?.channelConfigs['丰创']?.orderType || 'ord-fc-retail-2026'
        : 'SF-CITY-EXPRESS-01';

    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('无法提交', '当前没有任何校验合格的受检网点', 'error');
      return;
    }

    // 采纳顺丰五级建议地址与末端网格
    const preparedItems = validRows.map((r) => ({
      contactCompany: r.contactCompany,
      contactName: r.contactName,
      contactPhone: r.contactPhone,
      address: r.isAccepted !== false && r.cleanAddress ? r.cleanAddress : (r.rawAddress || r.address),
      rawAddress: r.rawAddress || r.address,
      cleanAddress: r.cleanAddress,
      gridCode: r.gridCode,
      gridName: r.gridName,
      confidence: r.confidence,
      isValid: true,
      errorReason: r.errorReason,
    }));

    const newBatch = createDispatchRecord({
      taskId: wizardTaskId,
      merchantId: wizardMerchantId,
      channel: wizardChannel,
      channelOrderType,
      createdBy: '运营管理员',
      creatorRole: '运营',
      items: preparedItems,
      rows: preparedItems,
      immediateDispatch: immediate,
      autoExecute: immediate,
    });

    setIsNewDispatchOpen(false);
    setReorderSourceDispatchId(null);

    // 成功后根据 PRD 3.2.2.3 自动聚焦至该批次详情
    const newBatchId = typeof newBatch === 'string' ? newBatch : (newBatch as any)?.id || '';
    if (newBatchId) {
      setSelectedRecordId(newBatchId);
    }
  };

  // Active record for detail view
  const activeRecord = useMemo(() => {
    if (!selectedRecordId) return null;
    return dispatchRecords.find((r) => r.id === selectedRecordId) || null;
  }, [dispatchRecords, selectedRecordId]);

  // Orders linked to the active record
  const activeRecordOrders = useMemo(() => {
    if (!activeRecord) return [];
    return orders.filter(
      (o) =>
        o.dispatchId === activeRecord.id ||
        o.dispatchBatchNo === (activeRecord.batchNo || activeRecord.id)
    );
  }, [orders, activeRecord]);

  // Copy helper
  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    showToast('复制成功', `${title}已复制到剪贴板`, 'success');
  };

  // Selected single order object for modal
  const detailModalOrder = useMemo(() => {
    if (!detailModalOrderId) return null;
    return orders.find((o) => o.id === detailModalOrderId) || null;
  }, [orders, detailModalOrderId]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = dispatchRecords.length;
    const success = dispatchRecords.filter((r) => r.status === '全部成功').length;
    const running = dispatchRecords.filter((r) => r.status === '下发中').length;
    const partial = dispatchRecords.filter(
      (r) => r.status === '部分成功' || r.status === '全部失败'
    ).length;
    const pending = dispatchRecords.filter((r) => r.status === '待下发').length;
    const totalOrders = dispatchRecords.reduce(
      (sum, r) => sum + (r.totalCount ?? r.orderCount ?? 0),
      0
    );
    return { total, success, running, partial, pending, totalOrders };
  }, [dispatchRecords]);

  // ==========================================
  // VIEW: 3.2.2.2 下单记录详情 (Detail View)
  // ==========================================
  if (activeRecord) {
    const currentTask = tasks.find((t) => t.id === activeRecord.taskId);
    const channelOrderType =
      activeRecord.channelOrderType ||
      currentTask?.channelConfigs['丰创']?.orderType ||
      'ord-std-2026';

    return (
      <div className="space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedRecordId(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回下单管理列表
          </button>

          {/* Action buttons strictly per PRD 3.2.2.2 */}
          <div className="flex items-center gap-2">
            {activeRecord.status === '待下发' && (
              <button
                type="button"
                onClick={() => executeDispatch(activeRecord.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                下发至渠道 ({activeRecord.totalCount ?? activeRecord.orderCount ?? 0} 单)
              </button>
            )}

            {(activeRecord.status === '部分成功' || activeRecord.status === '全部失败') && (
              <>
                <button
                  type="button"
                  onClick={() => handleDownloadFailedOrders(activeRecord)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
                  title="下载失败订单明细 (CSV)"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载失败明细 (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => handleModifyAndReorder(activeRecord)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
                  title="载入失败网点并进入修改重新下发"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  修改后重新下单
                </button>
                <button
                  type="button"
                  onClick={() => retryFailedDispatchOrders(activeRecord.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  重新下发失败订单 ({activeRecord.failedCount ?? activeRecord.failureCount ?? 0} 单)
                </button>
              </>
            )}

            {activeRecord.status === '下发中' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                渠道正在逐单下发中...
              </div>
            )}

            {activeRecord.status === '全部成功' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                全部工单已成功下发接入
              </div>
            )}
          </div>
        </div>

        {/* PRD 3.2.2.2 基本信息 Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">下单记录详情</h2>
                <StatusBadge status={activeRecord.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span>流水号：{activeRecord.batchNo || activeRecord.id}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeRecord.batchNo || activeRecord.id, '下单流水号')}
                  className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                  title="复制流水号"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100 text-xs">
              <div className="text-center">
                <div className="text-[11px] text-slate-400">工单总数</div>
                <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                  {activeRecord.totalCount ?? activeRecord.orderCount ?? 0}
                </div>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-[11px] text-emerald-600 font-medium">成功下发</div>
                <div className="font-bold text-emerald-700 font-mono text-sm mt-0.5">
                  {activeRecord.successCount}
                </div>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-[11px] text-rose-600 font-medium">下发失败</div>
                <div className="font-bold text-rose-700 font-mono text-sm mt-0.5">
                  {activeRecord.failedCount ?? activeRecord.failureCount ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Specification Fields Grid (Strictly per PRD 3.2.2.2 基本信息) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">下单流水号</div>
              <div className="font-mono font-bold text-slate-800 break-all">
                {activeRecord.batchNo || activeRecord.id}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">所属商户</div>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeRecord.merchantName}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">所属任务</div>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeRecord.taskName}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">执行渠道</div>
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                <span>{activeRecord.channel}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">渠道标识编码</div>
              <div className="font-mono font-bold text-indigo-700 bg-indigo-50/60 px-1.5 py-0.5 rounded border border-indigo-100 inline-block">
                {channelOrderType}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">订单规模 (成功/失败/总数)</div>
              <div className="font-mono text-slate-800">
                <span className="text-emerald-700 font-bold">{activeRecord.successCount} 成功</span>
                <span className="text-slate-400"> / </span>
                <span className="text-rose-700 font-bold">{activeRecord.failedCount ?? activeRecord.failureCount ?? 0} 失败</span>
                <span className="text-slate-400"> (共 {activeRecord.totalCount ?? activeRecord.orderCount ?? 0} 单)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">下单时间</div>
              <div className="font-mono text-slate-700">{activeRecord.createdAt}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium">下单人</div>
              <div className="font-medium text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeRecord.createdBy || activeRecord.creator || '运营专员'}</span>
                <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[10px]">
                  运营管理员
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PRD 3.2.2.2 订单列表 Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                本批次拆分订单列表 ({activeRecordOrders.length} 条)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                由该下单批次解析拆分生成的末端受检网点执行工单，点击可查看订单全生命周期轨迹
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                已成功下发{' '}
                <span className="font-bold text-emerald-600">{activeRecord.successCount}</span> /{' '}
                {activeRecordOrders.length}
              </span>
              {(activeRecord.failedCount ?? activeRecord.failureCount ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => handleDownloadFailedOrders(activeRecord)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
                >
                  <Download className="w-3 h-3" />
                  导出失败明细
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">订单ID (丰迹)</th>
                  <th className="py-3 px-4">渠道订单号</th>
                  <th className="py-3 px-4">受检网点及地址</th>
                  <th className="py-3 px-4">联系人与电话</th>
                  <th className="py-3 px-4">状态 (丰创映射)</th>
                  <th className="py-3 px-4">失败原因</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRecordOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      暂无拆分生成的订单
                    </td>
                  </tr>
                ) : (
                  activeRecordOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => setDetailModalOrderId(ord.id)}
                          className="text-indigo-600 hover:underline font-mono text-left cursor-pointer"
                        >
                          {ord.id}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {ord.channelOrderId ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-800">
                            {ord.channelOrderId}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">待下发生成</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{ord.contactCompany}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs" title={ord.address}>
                          {ord.address}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div>{ord.contactName}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{ord.contactPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {ord.errorReason ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px] font-medium">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{ord.errorReason}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDetailModalOrderId(ord.id)}
                          className="px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 rounded font-medium transition cursor-pointer text-xs"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Single Order Detail (from detail table) */}
        {detailModalOrder && (
          <Modal
            isOpen={!!detailModalOrder}
            onClose={() => setDetailModalOrderId(null)}
            title={`工单详情：${detailModalOrder.id}`}
            subtitle={`归属批次: ${detailModalOrder.dispatchBatchNo} · 渠道: ${detailModalOrder.channel}`}
            maxWidth="3xl"
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block">工单状态</span>
                  <div className="mt-1">
                    <StatusBadge status={detailModalOrder.status} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block">渠道订单号</span>
                  <span className="font-mono font-bold text-slate-800 mt-1 block">
                    {detailModalOrder.channelOrderId || '未生成'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">联系人</span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {detailModalOrder.contactName} ({detailModalOrder.contactPhone})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">所属网点</span>
                  <span className="font-semibold text-slate-800 mt-1 block truncate" title={detailModalOrder.contactCompany}>
                    {detailModalOrder.contactCompany}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-medium block mb-1">详细地址</span>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{detailModalOrder.address}</span>
                </div>
              </div>

              {detailModalOrder.errorReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>下发异常信息</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{detailModalOrder.errorReason}</p>
                </div>
              )}

              {/* Execution Timeline */}
              <div className="border-t border-slate-100 pt-3">
                <span className="font-semibold text-slate-800 block mb-2">执行轨迹与状态变迁</span>
                <ExecutionTimeline timeline={detailModalOrder.timeline || []} />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailModalOrderId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: 3.2.2.1 下单管理列表 (Grouped / Flat View)
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>下单管理</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              PRD 3.2.2 规范
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            统一管理商户及运营发起的 Excel 批量拆单下发，支持按任务分组聚合、渠道适配及下发失败重试
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Layout View Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="按任务分组展示 (PRD 3.2.2.1 规范)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>按任务分组</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'flat'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="平铺列表展示"
            >
              <List className="w-3.5 h-3.5" />
              <span>平铺明细</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenNewWizard}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            新建下单
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-400 font-medium">总下单批次</div>
          <div className="font-bold text-lg font-mono text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-emerald-600 font-medium">全部成功</div>
          <div className="font-bold text-lg font-mono text-emerald-700 mt-1">{stats.success}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-blue-600 font-medium">下发中</div>
          <div className="font-bold text-lg font-mono text-blue-700 mt-1">{stats.running}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-amber-600 font-medium">部分成功 / 失败</div>
          <div className="font-bold text-lg font-mono text-amber-700 mt-1">{stats.partial}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 font-medium">待下发</div>
          <div className="font-bold text-lg font-mono text-slate-700 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-indigo-600 font-medium">包含工单总量</div>
          <div className="font-bold text-lg font-mono text-indigo-900 mt-1">
            {stats.totalOrders}
          </div>
        </div>
      </div>

      {/* PRD 3.2.2.1 Filter Bar: [新建下单] 筛选：[商户▼][任务▼][渠道▼][状态▼] [搜索] */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Merchant Filter (商户▼ - 支持联动) */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium whitespace-nowrap">商户:</span>
            <select
              value={selectedMerchantFilter}
              onChange={(e) => handleMerchantFilterChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-44 truncate"
            >
              <option value="all">全部商户</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Task Filter (任务▼ - 联动商户) */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium whitespace-nowrap">任务:</span>
            <select
              value={selectedTaskFilter}
              onChange={(e) => setSelectedTaskFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-48 truncate"
            >
              <option value="all">全部任务</option>
              {filterAvailableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Filter (渠道▼: 丰创 / 顺丰同城 / 全部) */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium whitespace-nowrap">渠道:</span>
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">全部渠道</option>
              <option value="丰创">丰创</option>
              <option value="顺丰同城">顺丰同城</option>
            </select>
          </div>

          {/* Status Filter (状态▼: 待下发 / 下发中 / 全部成功 / 部分成功 / 全部失败) */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium whitespace-nowrap">状态:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">全部状态</option>
              <option value="待下发">待下发</option>
              <option value="下发中">下发中</option>
              <option value="全部成功">全部成功</option>
              <option value="部分成功">部分成功</option>
              <option value="全部失败">全部失败</option>
            </select>
          </div>

          {/* Search Input (搜索) */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索流水号、任务名、商户名、下单人..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Reset Filters */}
          {(selectedMerchantFilter !== 'all' ||
            selectedTaskFilter !== 'all' ||
            selectedChannelFilter !== 'all' ||
            selectedStatusFilter !== 'all' ||
            searchTerm.trim()) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              重置筛选
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'grouped' ? (
        /* ========================================================================= */
        /* PRD 3.2.2.1 页面布局: 默认按任务分组展示，同一任务按时间倒序，任务间按最近时间倒序 */
        /* ========================================================================= */
        <div className="space-y-5">
          {taskGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs">暂无符合筛选条件的下单记录</p>
              <button
                type="button"
                onClick={handleOpenNewWizard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                立即新建下单
              </button>
            </div>
          ) : (
            taskGroups.map((group) => {
              const currentTask = tasks.find((t) => t.id === group.taskId);

              return (
                <div
                  key={group.taskId}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Task Group Header */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          任务：{group.taskName}
                        </span>
                        <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 font-medium px-2 py-0.5 rounded">
                          {group.channel}
                        </span>
                      </div>

                      <span className="text-slate-300">|</span>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>商户：{group.merchantName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div>
                        共 <span className="font-bold font-mono text-slate-900">{group.records.length}</span> 个下单批次
                      </div>
                      <div className="h-3 w-px bg-slate-300" />
                      <div>
                        累计工单：<span className="font-bold font-mono text-indigo-600">{group.totalOrdersCount}</span> 单
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentTask) {
                            setWizardMerchantId(currentTask.merchantId);
                            setWizardTaskId(currentTask.id);
                            setWizardStep(4);
                            setIsNewDispatchOpen(true);
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        以此任务下单
                      </button>
                    </div>
                  </div>

                  {/* Task Group Records List (PRD 3.2.2.1 Diagram) */}
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    <div className="min-w-[1060px]">
                      {group.records.map((record) => (
                        <div
                          key={record.id}
                          className="px-4 py-3.5 grid grid-cols-[155px_185px_150px_115px_120px_1fr] items-center gap-4 hover:bg-slate-50/70 transition"
                        >
                          {/* 下单时间 */}
                          <div className="min-w-0">
                            <div className="text-[11px] text-slate-400 font-medium">下单时间</div>
                            <div className="font-mono font-medium text-slate-800 text-xs mt-0.5 whitespace-nowrap">
                              {record.createdAt}
                            </div>
                          </div>

                          {/* 流水号 */}
                          <div className="min-w-0">
                            <div className="text-[11px] text-slate-400 font-medium">流水号</div>
                            <div
                              className="font-mono font-bold text-slate-900 text-xs mt-0.5 truncate"
                              title={record.batchNo || record.id}
                            >
                              {record.batchNo || record.id}
                            </div>
                          </div>

                          {/* 订单数量/规模 */}
                          <div className="min-w-0">
                            <div className="text-[11px] text-slate-400 font-medium">订单规模</div>
                            <div className="font-mono text-slate-900 font-bold text-xs mt-0.5 whitespace-nowrap">
                              {record.totalCount ?? record.orderCount ?? 0} 单
                              <span className="text-[10px] text-slate-500 font-normal ml-1">
                                (成 {record.successCount ?? 0} / 败 {record.failedCount ?? record.failureCount ?? 0})
                              </span>
                            </div>
                          </div>

                          {/* 状态 */}
                          <div className="min-w-0">
                            <div className="text-[11px] text-slate-400 font-medium mb-1">状态</div>
                            <div className="inline-flex">
                              <StatusBadge status={record.status} />
                            </div>
                          </div>

                          {/* 下单人 */}
                          <div className="min-w-0">
                            <div className="text-[11px] text-slate-400 font-medium">下单人</div>
                            <div className="text-slate-700 text-xs mt-0.5 flex items-center gap-1 truncate">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{record.createdBy || record.creator || '运营专员'}</span>
                            </div>
                          </div>

                          {/* Actions: 固定右对齐 */}
                          <div className="flex items-center justify-end gap-1.5 shrink-0">
                            {record.status === '待下发' && (
                              <button
                                type="button"
                                onClick={() => executeDispatch(record.id)}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap"
                                title="立即执行下发"
                              >
                                <Send className="w-3 h-3" />
                                下发
                              </button>
                            )}

                            {(record.status === '部分成功' || record.status === '全部失败') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFailedOrders(record)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap"
                                  title="下载失败订单明细 (CSV)"
                                >
                                  <Download className="w-3 h-3" />
                                  下载失败
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleModifyAndReorder(record)}
                                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap"
                                  title="修改失败网点并重新下发"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  修改重下
                                </button>
                                <button
                                  type="button"
                                  onClick={() => retryFailedDispatchOrders(record.id)}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap"
                                  title="重新下发失败订单"
                                >
                                  <RotateCw className="w-3 h-3" />
                                  重试
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedRecordId(record.id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap"
                            >
                              <span>详情</span>
                              <ChevronRight className="w-3 h-3 text-slate-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* FLAT TABLE VIEW (平铺明细表格视图) */
        /* ========================================================================= */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">下单流水号</th>
                  <th className="py-3 px-4">所属商户</th>
                  <th className="py-3 px-4">所属任务</th>
                  <th className="py-3 px-4">执行渠道</th>
                  <th className="py-3 px-4">订单规模</th>
                  <th className="py-3 px-4">状态</th>
                  <th className="py-3 px-4">下单人</th>
                  <th className="py-3 px-4">下单时间</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      暂无符合条件的下单记录
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordId(rec.id)}
                          className="text-indigo-600 hover:underline cursor-pointer"
                        >
                          {rec.batchNo || rec.id}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-800">{rec.merchantName}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{rec.taskName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                          {rec.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-900">{rec.totalCount ?? rec.orderCount ?? 0}</span>
                        <span className="text-slate-400 text-[11px] ml-1">
                          (成 {rec.successCount ?? 0} / 败 {rec.failedCount ?? rec.failureCount ?? 0})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rec.createdBy || rec.creator || '运营专员'}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{rec.createdAt}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rec.status === '待下发' && (
                            <button
                              type="button"
                              onClick={() => executeDispatch(rec.id)}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-medium transition cursor-pointer"
                            >
                              下发
                            </button>
                          )}
                          {(rec.status === '部分成功' || rec.status === '全部失败') && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDownloadFailedOrders(rec)}
                                className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap"
                                title="下载失败订单明细 (CSV)"
                              >
                                下载失败
                              </button>
                              <button
                                type="button"
                                onClick={() => handleModifyAndReorder(rec)}
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap"
                                title="修改失败网点并重新下发"
                              >
                                修改重下
                              </button>
                              <button
                                type="button"
                                onClick={() => retryFailedDispatchOrders(rec.id)}
                                className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap"
                                title="重新下发失败订单"
                              >
                                重试
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedRecordId(rec.id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition cursor-pointer"
                          >
                            详情
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRD 3.2.2.3 新建下单全景工作台 (方案 C: 合一整合模式) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewDispatchOpen}
        onClose={() => setIsNewDispatchOpen(false)}
        title="新建下单工作台 (工单拆分与渠道推单)"
        subtitle="合一整合模式：企业商户 → 履约任务 → 渠道映射 → 顺丰空间智能三态治理与批量下发一屏统筹"
        maxWidth="5xl"
      >
        <div className="space-y-4 text-xs">
          {/* 0. 重新下单模式特别提示 */}
          {reorderSourceDispatchId && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">重新下单模式：</span>
                  <span>
                    已自动载入原批次【{reorderSourceDispatchId}】的失败网点，标记为【待核异常】。您可直接在下方表格中点击【编辑】修正门牌地址后重新下发。
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetWizardDefaults}
                className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded text-[11px] font-semibold transition shrink-0 ml-3 cursor-pointer"
              >
                重置为常规示例
              </button>
            </div>
          )}

          {/* 1. 顶部级联配置条 (商户 → 任务 → 渠道) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span className="font-bold text-slate-800 text-xs">① 履约商户与执行任务配置</span>
                <span className="text-[11px] text-slate-400">（支持跨商户代客推单）</span>
              </div>

              {/* 商户增值服务权益指示 */}
              {(() => {
                const currentTask = tasks.find((t) => t.id === wizardTaskId);
                const quotas = currentTask?.serviceConfig?.serviceQuotas || {};
                const addrQuota = quotas['地址精确度校验'] ?? 50;
                const isShort = addrQuota < parsedRows.length;

                return (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">商户空间服务额度:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] flex items-center gap-1 ${
                        isShort
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-indigo-100/70 text-indigo-800'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3 text-indigo-600" />
                      地址清洗剩余 {addrQuota} 次
                    </span>
                    {isShort && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        需导入 {parsedRows.length} 条 (平台兜底保障)
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* 选择企业商户 */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  归属商户 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={wizardMerchantId}
                    onChange={(e) => handleWizardMerchantChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </select>
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 选择关联任务 */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  生效任务 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={wizardTaskId}
                    onChange={(e) => setWizardTaskId(e.target.value)}
                    disabled={wizardAvailableTasks.length === 0}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {wizardAvailableTasks.length === 0 ? (
                      <option value="">该商户暂无可用生效任务</option>
                    ) : (
                      wizardAvailableTasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} [{t.type}]
                        </option>
                      ))
                    )}
                  </select>
                  <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 履约渠道选择 */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  执行渠道与通道编码 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWizardChannel('丰创')}
                    className={`py-1.5 px-2 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      wizardChannel === '丰创'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">丰创(网格)</span>
                    </div>
                    {wizardChannel === '丰创' && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setWizardChannel('顺丰同城')}
                    className={`py-1.5 px-2 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      wizardChannel === '顺丰同城'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">顺丰同城</span>
                    </div>
                    {wizardChannel === '顺丰同城' && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 渠道订单类型编码透视提示 */}
            {(() => {
              const currentTask = tasks.find((t) => t.id === wizardTaskId);
              const fcCode = currentTask?.channelConfigs['丰创']?.orderType || 'ord-fc-retail-2026';
              return (
                <div className="text-[11px] text-slate-500 flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">当前任务通道编码:</span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                      {wizardChannel === '丰创' ? fcCode : 'SF-CITY-EXPRESS-01'}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">
                      截止时间: <span className="font-mono text-slate-700">{currentTask?.deadline || '长期'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>顺丰末端网格时效圈：30~60分钟极速派揽</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 2. 导入与增值服务插件控制栏 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* 上传与模板下载 */}
            <div className="md:col-span-7 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const currentTask = tasks.find((t) => t.id === wizardTaskId);
                  showToast(
                    '下载成功',
                    `已下载【${currentTask?.name || '任务'}】_${wizardChannel}_下单模板.xlsx`,
                    'info'
                  );
                }}
                className="px-3 py-2 bg-white border border-slate-300 hover:border-indigo-400 text-indigo-600 font-semibold rounded-lg text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载专属模板</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateUpload}
                disabled={isUploading}
                className="flex-1 px-3 py-2 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-lg text-center bg-slate-50/60 hover:bg-indigo-50/20 text-slate-700 text-xs transition cursor-pointer flex items-center justify-center gap-2 truncate"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span className="text-indigo-600 font-medium">顺丰空间智能清洗解析中...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate font-medium">{uploadFileName} (点击重新导入)</span>
                  </>
                )}
              </button>
            </div>

            {/* 快速体验通道 & 增值服务 */}
            <div className="md:col-span-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleGenerate1000Pois}
                className="px-2.5 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                title="一键载入1000条大数据，体验千级秒开与三态分流"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>载入1,000条大数据</span>
              </button>

              <button
                type="button"
                onClick={() => setShowServiceConfigModal(!showServiceConfigModal)}
                className={`px-2.5 py-2 border rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                  showServiceConfigModal
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white border-purple-200 text-purple-700 hover:bg-purple-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                <span>服务插件配置</span>
              </button>
            </div>
          </div>

          {/* 增值服务展开面板 */}
          {showServiceConfigModal && (
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  顺丰前置服务与合规清洗插件
                </span>
                <span className="text-[11px] text-purple-700">勾选将在下发前自动完成对应维度的清洗比对</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeServices.addressValidation}
                    onChange={(e) =>
                      setActiveServices((s) => ({ ...s, addressValidation: e.target.checked }))
                    }
                    className="rounded text-purple-600"
                  />
                  <div>
                    <div className="font-bold text-slate-800 text-[11px]">顺丰五级地址治理</div>
                    <div className="text-[10px] text-slate-400">门牌纠错/行政层级补全</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeServices.gridVerification}
                    onChange={(e) =>
                      setActiveServices((s) => ({ ...s, gridVerification: e.target.checked }))
                    }
                    className="rounded text-purple-600"
                  />
                  <div>
                    <div className="font-bold text-slate-800 text-[11px]">末端网格覆盖核验</div>
                    <div className="text-[10px] text-slate-400">半径&gt;30km越界预警</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeServices.phoneValidation}
                    onChange={(e) =>
                      setActiveServices((s) => ({ ...s, phoneValidation: e.target.checked }))
                    }
                    className="rounded text-purple-600"
                  />
                  <div>
                    <div className="font-bold text-slate-800 text-[11px]">手机号合规预检</div>
                    <div className="text-[10px] text-slate-400">11位号码空号防作弊</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeServices.temperatureColdChain}
                    onChange={(e) =>
                      setActiveServices((s) => ({ ...s, temperatureColdChain: e.target.checked }))
                    }
                    className="rounded text-purple-600"
                  />
                  <div>
                    <div className="font-bold text-slate-800 text-[11px]">巡检时效防滞留</div>
                    <div className="text-[10px] text-slate-400">高优先级队列插队</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 实时空间智能清洗进度条 (当 isCleaning 为 true 时呈现) */}
          {isCleaning && (
            <div className="p-4 bg-gradient-to-r from-indigo-50/95 via-sky-50/80 to-indigo-50/95 border border-indigo-200 rounded-xl shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-950 text-xs">
                        顺丰空间智能引擎正在清洗与对齐网点数据...
                      </span>
                      <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 text-[11px] shadow-2xs">
                        {cleaningProgress}%
                      </span>
                    </div>
                    <div className="text-[11px] text-indigo-700 flex items-center gap-1.5 mt-0.5">
                      <Sparkles className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />
                      <span>{cleaningStatusText}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                    处理进度: <b className="text-indigo-900">{cleaningCurrentCount}</b> / {cleaningTotalCount} 条
                  </span>
                  <button
                    type="button"
                    onClick={handleSkipCleaning}
                    className="px-2 py-1 bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-700 rounded text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                    title="立即跳过等待，直接查看清洗结果"
                  >
                    ⚡️ 跳过等待
                  </button>
                </div>
              </div>

              {/* 平滑动画进度条 */}
              <div className="w-full bg-indigo-100/90 rounded-full h-2.5 overflow-hidden p-0.5 border border-indigo-200">
                <div
                  className="bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-600 h-full rounded-full transition-all duration-100 ease-out shadow-xs"
                  style={{ width: `${cleaningProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-indigo-700/80 pt-0.5 font-medium">
                <span>① Excel格式解析</span>
                <span>② 顺丰五级地址对齐</span>
                <span>③ 末端网格时效测算</span>
                <span>④ 阻断异常汇聚</span>
              </div>
            </div>
          )}

          {/* 3. 三态健康度分流与点位审核工作台 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            {/* 三态分流药丸与快捷批量操作 */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              {/* 四个健康度状态过滤 Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setHealthStatusFilter('all');
                    setPoiCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    healthStatusFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>全部点位</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/50 text-slate-700">
                    {poiHealthStats.total}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHealthStatusFilter('perfect');
                    setPoiCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    healthStatusFilter === 'perfect'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>免审通过</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                    {poiHealthStats.perfect}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHealthStatusFilter('improved');
                    setPoiCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    healthStatusFilter === 'improved'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>智能优化</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800">
                    {poiHealthStats.improved}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHealthStatusFilter('warning');
                    setPoiCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    healthStatusFilter === 'warning'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>待核异常</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800">
                    {poiHealthStats.warning}
                  </span>
                </button>
              </div>

              {/* 搜索框与全量操作动作 */}
              <div className="flex items-center gap-2 ml-auto">
                <div className="relative w-44 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜网点/姓名/电话/地址/网格..."
                    value={poiSearchTerm}
                    onChange={(e) => {
                      setPoiSearchTerm(e.target.value);
                      setPoiCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  {poiSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setPoiSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAcceptAllSuggestions}
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold transition cursor-pointer flex items-center gap-0.5"
                  title="一键全部采纳顺丰五级标准地址"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>全采纳</span>
                </button>

                <button
                  type="button"
                  onClick={handleRejectAllSuggestions}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition cursor-pointer"
                  title="保留客户原始录入地址"
                >
                  保留原值
                </button>

                <button
                  type="button"
                  onClick={handleDownloadValidatedData}
                  className="px-2 py-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-0.5"
                  title="导出网点治理明细表"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>导出对比表</span>
                </button>
              </div>
            </div>

            {/* 点位列表明细表格 (高性能轻量化渲染，10条/页) */}
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-xs">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center font-mono">#</th>
                    <th className="py-2.5 px-3 w-48">受检网点 / 负责人</th>
                    <th className="py-2.5 px-3 min-w-[280px]">履约地址治理 (原始录入 vs 顺丰五级建议)</th>
                    <th className="py-2.5 px-3 w-36">末端网格 / 置信度</th>
                    <th className="py-2.5 px-3 w-24 text-center">采纳决策</th>
                    <th className="py-2.5 px-3 w-20 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPoiRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-7 h-7 mx-auto text-slate-300 mb-1" />
                        <div>未检索到符合条件的受检网点数据</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          可尝试切换顶部健康度状态过滤或清空搜索关键词
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedPoiRows.map((r, i) => {
                      const globalIdx = (poiCurrentPage - 1) * poiPageSize + i;
                      const hasCleanDiff = r.cleanAddress && r.cleanAddress !== r.rawAddress;
                      const status =
                        r.healthStatus ||
                        (!r.isValid || r.errorReason
                          ? 'warning'
                          : hasCleanDiff
                          ? 'improved'
                          : 'perfect');

                      return (
                        <tr
                          key={globalIdx}
                          className={`hover:bg-slate-50/80 transition ${
                            status === 'warning'
                              ? 'bg-rose-50/30'
                              : status === 'improved'
                              ? 'bg-indigo-50/20'
                              : ''
                          }`}
                        >
                          {/* 序号 */}
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                            {globalIdx + 1}
                          </td>

                          {/* 网点与联系人 */}
                          <td className="py-2.5 px-3 space-y-0.5">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  status === 'perfect'
                                    ? 'bg-emerald-500'
                                    : status === 'improved'
                                    ? 'bg-indigo-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              <span className="truncate max-w-[170px]" title={r.contactCompany}>
                                {r.contactCompany}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                              <span>{r.contactName}</span>
                              <span className="text-slate-300">·</span>
                              <span>{r.contactPhone}</span>
                            </div>
                          </td>

                          {/* 地址对比与微标签 */}
                          <td className="py-2.5 px-3 space-y-1">
                            <div className="space-y-0.5">
                              {/* 原始录入 */}
                              <div className="text-slate-500 text-[10px] flex items-start gap-1">
                                <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-mono shrink-0">
                                  原值
                                </span>
                                <span className="line-clamp-1" title={r.rawAddress || r.address}>
                                  {r.rawAddress || r.address}
                                </span>
                              </div>

                              {/* 顺丰建议五级地址 */}
                              {r.cleanAddress && (
                                <div className="text-slate-900 font-medium text-[11px] flex items-start gap-1">
                                  <span className="px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 font-mono shrink-0 font-bold">
                                    建议
                                  </span>
                                  <span
                                    className={`line-clamp-1 ${
                                      r.isAccepted !== false ? 'text-indigo-950 font-semibold' : 'text-slate-600 line-through opacity-60'
                                    }`}
                                    title={r.cleanAddress}
                                  >
                                    {r.cleanAddress}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 微标签与差异提示 */}
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {r.serviceBadges?.map((b, bIdx) => (
                                <span
                                  key={bIdx}
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                                    b.type === 'success'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : b.type === 'warning'
                                      ? 'bg-rose-100 text-rose-800'
                                      : b.type === 'info'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {b.label}
                                </span>
                              ))}

                              {r.diffNote && (
                                <span className="text-[10px] text-slate-400 italic truncate max-w-[240px]">
                                  {r.diffNote}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 末端网格与置信度 */}
                          <td className="py-2.5 px-3 space-y-0.5">
                            <div className="font-mono font-bold text-slate-800 text-[10px] truncate">
                              {r.gridCode || 'SF-GD-SZ0755-FT09'}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {r.gridName || '顺丰综合网格'}
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <span className="text-slate-400">置信度:</span>
                              <span
                                className={`font-mono font-bold ${
                                  (r.confidence || 98) >= 95
                                    ? 'text-emerald-600'
                                    : (r.confidence || 98) >= 80
                                    ? 'text-indigo-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {r.confidence || 98}%
                              </span>
                            </div>
                          </td>

                          {/* 采纳决策开关 */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleAcceptSuggestion(globalIdx)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                                r.isAccepted !== false
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {r.isAccepted !== false ? '✓ 已采纳' : '保留原值'}
                            </button>
                          </td>

                          {/* 操作 */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditRow(globalIdx)}
                                className="p-1 hover:bg-indigo-50 text-indigo-600 rounded transition cursor-pointer"
                                title="编辑修正网点"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(globalIdx)}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded transition cursor-pointer"
                                title="移除此网点"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* 分页控制栏 (解决卡顿，秒级切换) */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <div>
                共找到 <span className="font-bold text-slate-800">{filteredPoiRows.length}</span> 条点位
                {filteredPoiRows.length !== parsedRows.length && (
                  <span>（从全部 {parsedRows.length} 条中筛选）</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={poiCurrentPage <= 1}
                  onClick={() => setPoiCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-0.5"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>上一页</span>
                </button>

                <span className="font-mono">
                  第 <span className="font-bold text-slate-800">{poiCurrentPage}</span> / {poiTotalPages} 页
                </span>

                <button
                  type="button"
                  disabled={poiCurrentPage >= poiTotalPages}
                  onClick={() => setPoiCurrentPage((p) => Math.min(poiTotalPages, p + 1))}
                  className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-0.5"
                >
                  <span>下一页</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 4. 底部结算与下发执行栏 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 text-xs">下发配置总览:</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {merchants.find((m) => m.id === wizardMerchantId)?.name || '未选商户'}
                </span>
                <span className="text-slate-400">➜</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {tasks.find((t) => t.id === wizardTaskId)?.name || '未选任务'}
                </span>
                <span className="text-slate-400">➜</span>
                <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  渠道: {wizardChannel}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                  合格下发 {parsedRows.filter((r) => r.isValid).length} 点位
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={autoDispatchImmediately}
                  onChange={(e) => setAutoDispatchImmediately(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-800 text-xs">
                  确认无误后立即自动下发至渠道 (自动执行顺丰拆单与小哥派单)
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsNewDispatchOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer font-medium"
              >
                取消
              </button>

              <button
                type="button"
                onClick={() => handleFinishNewDispatch(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-lg transition cursor-pointer font-semibold shadow-2xs"
              >
                保存为待下发批次
              </button>

              <button
                type="button"
                onClick={() => handleFinishNewDispatch(autoDispatchImmediately)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{autoDispatchImmediately ? '确认提交并立即下发' : '确认生成批次'}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 网点行信息编辑修正弹窗 (用于修改后重新下单或上传后修正网点) */}
      <Modal
        isOpen={editingRowIndex !== null}
        onClose={() => setEditingRowIndex(null)}
        title="编辑修正受检网点信息"
      >
        <form onSubmit={handleSaveEditRow} className="space-y-4">
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-800">
            提示：修正网点名称、联系电话及精确到门牌号的履约地址，提交后系统将重新进行合规校验。
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              网点/企业名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editRowCompany}
              onChange={(e) => setEditRowCompany(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="例如：喜茶 (深圳海雅缤纷城店)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                现场联系人 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editRowName}
                onChange={(e) => setEditRowName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="例如：陈店长"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                联系电话 (11位手机号) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editRowPhone}
                onChange={(e) => setEditRowPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                placeholder="例如：13800138000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              详细履约地址 (省市区+道路门牌号) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={editRowAddress}
              onChange={(e) => setEditRowAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="例如：广东省深圳市宝安区宝民一路海雅缤纷城1层L110"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingRowIndex(null)}
              className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              保存并校验通过
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
