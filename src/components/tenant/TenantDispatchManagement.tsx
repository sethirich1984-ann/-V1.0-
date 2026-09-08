import React, { useState, useMemo, useRef } from 'react';
import {
  Send,
  Download,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  Layers,
  Building2,
  Phone,
  MapPin,
  X,
  History,
  TrendingUp,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Filter,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { DispatchRecord, OrderItem } from '../../types';

interface PoiRow {
  contactName: string;
  contactPhone: string;
  contactCompany: string;
  address: string;
  failReason?: string;
  isModified?: boolean;
  // 跨服务通用健康三态分流：'perfect' (免审通过) | 'improved' (智能优化) | 'warning' (待核异常/阻断)
  healthStatus?: 'perfect' | 'improved' | 'warning';
  serviceBadges?: Array<{
    label: string;
    type: 'success' | 'info' | 'warning' | 'neutral';
  }>;
  // 增值服务智能治理与差异对比元数据
  rawAddress?: string; // 客户原始输入地址
  cleanAddress?: string; // 顺丰五级标准地址建议
  gridCode?: string; // 顺丰末端网格编码
  gridName?: string; // 顺丰网格名称
  confidence?: number; // 匹配置信度 (0-100)
  suggestionType?: 'improved' | 'perfect' | 'warning'; // 治理类型
  diffNote?: string; // 优化补齐细节说明
  isAccepted?: boolean; // 客户是否采纳建议（默认 true）
}

// 增值服务字段识别与智能体检补齐辅助函数（跨服务归一化与微徽章体系）
const enrichPoiRowsWithService = (rows: PoiRow[]): PoiRow[] => {
  return rows.map((r, idx) => {
    if (r.cleanAddress && r.healthStatus) return r;
    const raw = r.rawAddress || r.address;
    let clean = raw;
    let gridCode = 'SF-GD-SZ0755-FT09';
    let gridName = '顺丰福田CBD综合网格';
    let note = '已对齐顺丰标准五级地址与末端履约网格';
    let healthStatus: 'perfect' | 'improved' | 'warning' = 'improved';
    let confidence = 96 + (idx % 4);
    const badges: Array<{ label: string; type: 'success' | 'info' | 'warning' | 'neutral' }> = [];

    // 针对不同样本模拟跨服务体检结果
    if (raw.includes('后山') || raw.includes('偏远') || raw.includes('不详') || (r.failReason && r.failReason.includes('超出'))) {
      healthStatus = 'warning';
      confidence = 68;
      clean = raw;
      note = '缺少门牌号或地标模糊，超出顺丰基础履约半径，需人工确认';
      badges.push({ label: '⚠️ 地址不详', type: 'warning' });
      badges.push({ label: '网格待人工确认', type: 'neutral' });
    } else if (raw.includes('高新') || raw.includes('科苑') || raw.includes('南山')) {
      clean = raw.includes('街道')
        ? raw
        : raw.replace('南山区', '广东省深圳市南山区粤海街道');
      if (!clean.startsWith('广东省')) clean = `广东省深圳市${clean}`;
      if (!clean.includes('号') && !clean.includes('室') && !clean.includes('铺')) clean += '101铺';
      gridCode = 'SF-GD-SZ0755-NS15';
      gridName = '顺丰科技园南区网格';
      note = '智能补齐粤海街道行政层级，绑定顺丰科技园末端网格';
      healthStatus = 'improved';
      confidence = 98;
      badges.push({ label: '五级地址补齐', type: 'info' });
      badges.push({ label: '网格已覆盖', type: 'success' });
      badges.push({ label: '号码合规', type: 'neutral' });
    } else if (raw.includes('车公庙') || raw.includes('金田路') || raw.includes('福田')) {
      clean = raw.includes('街道')
        ? raw
        : raw.replace('福田区', '广东省深圳市福田区福田街道');
      if (!clean.startsWith('广东省')) clean = `广东省深圳市${clean}`;
      gridCode = 'SF-GD-SZ0755-FT06';
      gridName = '顺丰车公庙枢纽网格';
      note = '智能补齐福田街道辖区，匹配顺丰CBD 30分钟履约运力';
      healthStatus = 'improved';
      confidence = 99;
      badges.push({ label: '五级地址对齐', type: 'info' });
      badges.push({ label: '30min履约圈', type: 'success' });
    } else if (raw.includes('龙岗') || raw.includes('华南')) {
      clean = raw.includes('街道')
        ? raw
        : raw.replace('龙岗区', '广东省深圳市龙岗区平湖街道');
      if (!clean.startsWith('广东省')) clean = `广东省深圳市${clean}`;
      gridCode = 'SF-GD-SZ0755-LG02';
      gridName = '顺丰华南城履约网格';
      note = '智能补齐平湖街道辖区并核验覆盖半径';
      healthStatus = 'improved';
      confidence = 96;
      badges.push({ label: '平湖网格绑定', type: 'info' });
      badges.push({ label: '网格已覆盖', type: 'success' });
    } else {
      // 默认判定为免审通过或智能对齐
      clean = raw.includes('街道') ? raw : `${raw}（顺丰网格预核对齐点位）`;
      gridCode = `SF-GD-SZ0755-0${(idx % 8) + 1}`;
      gridName = '顺丰综合网格履约区';
      note = '标准五级地址与末端网格预核通过';
      healthStatus = idx % 3 === 0 ? 'perfect' : 'improved';
      confidence = 99;
      badges.push({ label: '免审合规', type: 'success' });
      badges.push({ label: '网格覆盖', type: 'neutral' });
    }

    return {
      ...r,
      rawAddress: raw,
      cleanAddress: clean,
      gridCode,
      gridName,
      confidence,
      healthStatus,
      serviceBadges: badges,
      suggestionType: healthStatus,
      diffNote: note,
      isAccepted: healthStatus !== 'warning',
    };
  });
};

export const TenantDispatchManagement: React.FC = () => {
  const {
    currentTenant,
    tasks,
    orders,
    dispatchRecords,
    createDispatchRecord,
    executeDispatch,
    showToast,
    resetToDemoData,
  } = useApp();

  // 当前商户已生效的任务
  const readyTasks = useMemo(() => {
    if (!currentTenant) return [];
    return tasks.filter((t) => t.merchantId === currentTenant.id && t.status === '已生效');
  }, [tasks, currentTenant]);

  // 当前商户的所有下单记录（按时间倒序）- 排除下发中状态，下发中由左侧专网进度条独立呈现
  const tenantDispatches = useMemo(() => {
    if (!currentTenant) return [];
    return dispatchRecords
      .filter((d) => d.merchantId === currentTenant.id && d.status !== '下发中' && d.status !== '正在下发中')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [dispatchRecords, currentTenant]);

  // 各状态数量统计（用于快捷Tab：全部、全部成功、部分成功、失败）
  const statusCounts = useMemo(() => {
    const allSuccess = tenantDispatches.filter(
      (d) => d.status === '全部成功' || d.status === '下发成功'
    ).length;
    const partial = tenantDispatches.filter(
      (d) => d.status === '部分成功' || (d.failureCount > 0 && d.successCount > 0)
    ).length;
    const failed = tenantDispatches.filter(
      (d) => d.status === '失败' || d.status === '全部失败' || d.status === '下发失败' || (d.failureCount > 0 && d.successCount === 0)
    ).length;
    return {
      all: tenantDispatches.length,
      allSuccess,
      partial,
      failed,
    };
  }, [tenantDispatches]);

  // 表单状态
  const [selectedTaskId, setSelectedTaskId] = useState<string>(readyTasks[0]?.id || '');
  const [selectedChannel, setSelectedChannel] = useState<'丰创' | '自主能力'>('丰创');
  const [uploadedFileName, setUploadedFileName] = useState<string>('顺意优选_南山福田巡检点位.xlsx');
  const [isUploading, setIsUploading] = useState(false);

  // 租户端空间智能清洗实时进度状态
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
        setCleaningStatusText('正在读取并结构化解析 Excel 原始网点字段...');
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
  const [isValidated, setIsValidated] = useState(true);
  const [showPreviewAllRows, setShowPreviewAllRows] = useState(false);

  // 记录重新下单来源
  const [reorderSourceDispatchId, setReorderSourceDispatchId] = useState<string | null>(null);

  // 文件上传与拖拽状态
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 步骤 2 动态状态机：'upload' (待导入/点位准备) | 'dispatching' (上传后点击下发进入下发中并展示实时进度) | 'completed' (就地呈现当前下发结果与闭环)
  const [dispatchStage, setDispatchStage] = useState<'upload' | 'dispatching' | 'completed'>('upload');
  const [currentActiveDispatchId, setCurrentActiveDispatchId] = useState<string | null>(null);
  const [dispatchProgress, setDispatchProgress] = useState<number>(0);
  const [dispatchStepIndex, setDispatchStepIndex] = useState<number>(1);

  // 选配增值服务插槽：门店地址智能校验与网格预核服务
  // 1. 是否已配置该服务方案（配置了才会渲染卡片；未配置时完全隐形，不阻断正常流程）
  const [isAddressServiceConfigured, setIsAddressServiceConfigured] = useState<boolean>(true);
  // 2. 客户自主选择：是否选用该方案（默认开启自动体检与差异对比）
  const [useAddressValidation, setUseAddressValidation] = useState<boolean>(true);
  // 3. 服务处理进度与状态
  const [isProcessingValidation, setIsProcessingValidation] = useState<boolean>(false);
  const [validationProcessed, setValidationProcessed] = useState<boolean>(true);
  const [showValidationDetail, setShowValidationDetail] = useState<boolean>(true);

  // 顺丰地址质检与网格治理标准化样本对照
  const cleanedDataSamples = useMemo(() => [
    {
      company: `${currentTenant?.name || '顺意优选'}·深圳福田购物公园店`,
      rawAddress: '广东省深圳市福田区民田路138号购物公园B1层',
      cleanAddress: '广东省深圳市福田区福田街道民田路138号福田星河COCO Park地下1层B1-028',
      gridCode: 'SF-GD-SZ0755-FT09',
      gridName: '顺丰福田CBD综合网格',
    },
    {
      company: `${currentTenant?.name || '顺意优选'}·深圳南山万象天地店`,
      rawAddress: '广东省深圳市南山区深南大道9668号万象天地LG层',
      cleanAddress: '广东省深圳市南山区粤海街道深南大道9668号华润万象天地LG层LG28号',
      gridCode: 'SF-GD-SZ0755-NS15',
      gridName: '顺丰科技园南区网格',
    },
    {
      company: `${currentTenant?.name || '顺意优选'}·深圳罗湖万象城店`,
      rawAddress: '广东省深圳市罗湖区宝安南路1881号深圳万象城中区B2层',
      cleanAddress: '广东省深圳市罗湖区桂园街道宝安南路1881号华润万象城中区B2层08室',
      gridCode: 'SF-GD-SZ0755-LH03',
      gridName: '顺丰罗湖金三角网格',
    },
    {
      company: `${currentTenant?.name || '顺意优选'}·深圳宝安壹方城店`,
      rawAddress: '广东省深圳市宝安区新湖路99号壹方城F1层',
      cleanAddress: '广东省深圳市宝安区新安街道新湖路99号壹方城购物中心L1层032号',
      gridCode: 'SF-GD-SZ0755-BA06',
      gridName: '顺丰宝安中心区网格',
    },
  ], [currentTenant]);

  // 默认网点点位数据（支持跨服务通用三态健康分流与微徽章体系）
  const [poiRows, setPoiRows] = useState<PoiRow[]>([
    {
      contactName: '张店长',
      contactPhone: '13811223344',
      contactCompany: `${currentTenant?.name || '顺意优选'}·深圳福田购物公园店`,
      address: '广东省深圳市福田区民田路138号购物公园B1层',
      rawAddress: '广东省深圳市福田区民田路138号购物公园B1层',
      cleanAddress: '广东省深圳市福田区福田街道民田路138号福田星河COCO Park地下1层B1-028',
      gridCode: 'SF-GD-SZ0755-FT09',
      gridName: '顺丰福田CBD综合网格',
      confidence: 99,
      healthStatus: 'improved',
      serviceBadges: [
        { label: '五级地址补齐', type: 'info' },
        { label: 'CBD 30min达', type: 'success' },
        { label: '号码合规', type: 'neutral' },
      ],
      suggestionType: 'improved',
      diffNote: '智能补齐“福田街道”、商厦全称及地下1层B1-028标准门牌',
      isAccepted: true,
    },
    {
      contactName: '李经理',
      contactPhone: '13922334455',
      contactCompany: `${currentTenant?.name || '顺意优选'}·深圳南山万象天地店`,
      address: '广东省深圳市南山区深南大道9668号万象天地LG层',
      rawAddress: '广东省深圳市南山区深南大道9668号万象天地LG层',
      cleanAddress: '广东省深圳市南山区粤海街道深南大道9668号华润万象天地LG层LG28号',
      gridCode: 'SF-GD-SZ0755-NS15',
      gridName: '顺丰科技园南区网格',
      confidence: 98,
      healthStatus: 'improved',
      serviceBadges: [
        { label: '粤海街道补齐', type: 'info' },
        { label: '网格已覆盖', type: 'success' },
      ],
      suggestionType: 'improved',
      diffNote: '智能补齐“粤海街道”行政区划及LG28号精准商铺号',
      isAccepted: true,
    },
    {
      contactName: '王主管',
      contactPhone: '13733445566',
      contactCompany: `${currentTenant?.name || '顺意优选'}·深圳罗湖万象城店`,
      address: '广东省深圳市罗湖区宝安南路1881号深圳万象城中区B2层',
      rawAddress: '广东省深圳市罗湖区宝安南路1881号深圳万象城中区B2层',
      cleanAddress: '广东省深圳市罗湖区桂园街道宝安南路1881号华润万象城中区B2层08室',
      gridCode: 'SF-GD-SZ0755-LH03',
      gridName: '顺丰罗湖金三角网格',
      confidence: 97,
      healthStatus: 'perfect',
      serviceBadges: [
        { label: '免审合规', type: 'success' },
        { label: '金三角网格', type: 'neutral' },
      ],
      suggestionType: 'perfect',
      diffNote: '标准五级地址与罗湖中区商铺精准对齐',
      isAccepted: true,
    },
    {
      contactName: '陈组长',
      contactPhone: '13644556677',
      contactCompany: `${currentTenant?.name || '顺意优选'}·深圳宝安壹方城店`,
      address: '广东省深圳市宝安区新湖路99号壹方城F1层',
      rawAddress: '广东省深圳市宝安区新湖路99号壹方城F1层',
      cleanAddress: '广东省深圳市宝安区新安街道新湖路99号壹方城购物中心L1层032号',
      gridCode: 'SF-GD-SZ0755-BA06',
      gridName: '顺丰宝安中心区网格',
      confidence: 99,
      healthStatus: 'improved',
      serviceBadges: [
        { label: '新安街道对齐', type: 'info' },
        { label: '顺丰综合网格', type: 'neutral' },
      ],
      suggestionType: 'improved',
      diffNote: '智能补齐“新安街道”并对齐商户注册标准名',
      isAccepted: true,
    },
    {
      contactName: '赵店长',
      contactPhone: '13599887766',
      contactCompany: `${currentTenant?.name || '顺意优选'}·深圳大鹏特约仓`,
      address: '广东省深圳市大鹏新区南澳街道海滨路后山点位（无门牌）',
      rawAddress: '广东省深圳市大鹏新区南澳街道海滨路后山点位（无门牌）',
      cleanAddress: '广东省深圳市大鹏新区南澳街道海滨路后山点位（无门牌）',
      gridCode: 'SF-GD-SZ0755-DP01',
      gridName: '顺丰大鹏新区服务区',
      confidence: 62,
      healthStatus: 'warning',
      serviceBadges: [
        { label: '⚠️ 缺少门牌', type: 'warning' },
        { label: '超半径待核', type: 'warning' },
      ],
      suggestionType: 'warning',
      diffNote: '缺少准确门牌号且超出顺丰末端标准履约半径，建议核实',
      isAccepted: false,
    },
  ]);

  // 跨服务通用健康三态分流与大数据检索状态
  const [healthStatusFilter, setHealthStatusFilter] = useState<'all' | 'perfect' | 'improved' | 'warning'>('all');
  const [poiSearchTerm, setPoiSearchTerm] = useState<string>('');
  const [poiCurrentPage, setPoiCurrentPage] = useState<number>(1);
  const poiPageSize = 10; // 支持分页展示，1000条数据流畅不卡顿
  const [showServiceConfigModal, setShowServiceConfigModal] = useState<boolean>(false); // 增值服务插件抽屉/浮层

  // 跨服务通用三态健康度统计
  const poiHealthStats = useMemo(() => {
    let perfect = 0;
    let improved = 0;
    let warning = 0;
    poiRows.forEach((r) => {
      const status = r.healthStatus || (r.suggestionType === 'perfect' ? 'perfect' : r.failReason ? 'warning' : 'improved');
      if (status === 'perfect') perfect++;
      else if (status === 'warning') warning++;
      else improved++;
    });
    return {
      total: poiRows.length,
      perfect,
      improved,
      warning,
    };
  }, [poiRows]);

  // 根据健康状态与关键词过滤的网点列表
  const filteredPoiRows = useMemo(() => {
    return poiRows.filter((r) => {
      const status = r.healthStatus || (r.suggestionType === 'perfect' ? 'perfect' : r.failReason ? 'warning' : 'improved');
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
  }, [poiRows, healthStatusFilter, poiSearchTerm]);

  // 分页后的网点列表（高效支撑 1,000 条甚至海量数据流畅渲染）
  const poiTotalPages = Math.max(1, Math.ceil(filteredPoiRows.length / poiPageSize));
  const paginatedPoiRows = useMemo(() => {
    const start = (poiCurrentPage - 1) * poiPageSize;
    return filteredPoiRows.slice(start, start + poiPageSize);
  }, [filteredPoiRows, poiCurrentPage, poiPageSize]);

  // 已启用的增值服务插件列表（支持后续自由扩展多个服务）
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

  // 编辑单个网点模态框
  const [editingPoiIndex, setEditingPoiIndex] = useState<number | null>(null);
  const [editingPoiData, setEditingPoiData] = useState<PoiRow | null>(null);
  const [showAddPoiModal, setShowAddPoiModal] = useState(false);
  const [newPoiData, setNewPoiData] = useState<PoiRow>({
    contactName: '',
    contactPhone: '',
    contactCompany: `${currentTenant?.name || '顺意优选'}·新网点`,
    address: '',
  });

  // 右侧下单记录快捷状态筛选（全部、全部成功、部分成功、失败）
  const [recentStatusFilter, setRecentStatusFilter] = useState<string>('all');

  // 过滤后的最近下单记录（已剔除下发中）
  const filteredRecentDispatches = useMemo(() => {
    if (recentStatusFilter === 'all') return tenantDispatches.slice(0, 10);
    if (recentStatusFilter === '全部成功') {
      return tenantDispatches
        .filter((d) => d.status === '全部成功' || d.status === '下发成功')
        .slice(0, 10);
    }
    if (recentStatusFilter === '部分成功') {
      return tenantDispatches
        .filter((d) => d.status === '部分成功' || (d.failureCount > 0 && d.successCount > 0))
        .slice(0, 10);
    }
    if (recentStatusFilter === '失败') {
      return tenantDispatches
        .filter((d) => d.status === '失败' || d.status === '全部失败' || d.status === '下发失败' || (d.failureCount > 0 && d.successCount === 0))
        .slice(0, 10);
    }
    return tenantDispatches.slice(0, 10);
  }, [tenantDispatches, recentStatusFilter]);

  // 模态框状态：下单记录详情
  const [activeDetailDispatch, setActiveDetailDispatch] = useState<DispatchRecord | null>(null);
  const [detailOrderFilter, setDetailOrderFilter] = useState<'all' | 'success' | 'failed'>('all');

  // 模态框状态：全部历史下单记录
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyTaskFilter, setHistoryTaskFilter] = useState('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const historyPageSize = 10;

  // 当前选中的任务详情
  const currentTask = useMemo(() => {
    return readyTasks.find((t) => t.id === selectedTaskId) || readyTasks[0];
  }, [readyTasks, selectedTaskId]);

  // 历史下单记录过滤
  const filteredHistoryDispatches = useMemo(() => {
    return tenantDispatches.filter((d) => {
      const matchTask = historyTaskFilter === 'all' || d.taskId === historyTaskFilter;
      let matchStatus = historyStatusFilter === 'all';
      if (!matchStatus) {
        if (historyStatusFilter === '下发中') {
          matchStatus = d.status === '下发中' || d.status === '正在下发中' || d.status === '已保存数据' || d.status === '待下发';
        } else if (historyStatusFilter === '全部成功') {
          matchStatus = d.status === '全部成功' || d.status === '下发成功';
        } else if (historyStatusFilter === '部分成功') {
          matchStatus = d.status === '部分成功' || (d.failureCount > 0 && d.successCount > 0);
        } else if (historyStatusFilter === '失败') {
          matchStatus = d.status === '失败' || d.status === '全部失败' || d.status === '下发失败' || (d.failureCount > 0 && d.successCount === 0);
        } else {
          matchStatus = d.status === historyStatusFilter;
        }
      }
      const matchSearch =
        d.id.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        d.taskName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        d.channel.toLowerCase().includes(historySearchTerm.toLowerCase());
      return matchTask && matchStatus && matchSearch;
    });
  }, [tenantDispatches, historyTaskFilter, historyStatusFilter, historySearchTerm]);

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistoryDispatches.length / historyPageSize));
  const paginatedHistoryDispatches = useMemo(() => {
    const start = (historyCurrentPage - 1) * historyPageSize;
    return filteredHistoryDispatches.slice(start, start + historyPageSize);
  }, [filteredHistoryDispatches, historyCurrentPage]);

  // 获取详情下单记录下的所有订单列表
  const activeDispatchOrders = useMemo(() => {
    if (!activeDetailDispatch) return [];
    return orders.filter((o) => o.dispatchId === activeDetailDispatch.id);
  }, [activeDetailDispatch, orders]);

  // 详情弹窗过滤订单
  const filteredDetailOrders = useMemo(() => {
    if (detailOrderFilter === 'success') {
      return activeDispatchOrders.filter((o) => !o.failureReason && o.status !== 'cancelled' && o.status !== '下发失败');
    }
    if (detailOrderFilter === 'failed') {
      return activeDispatchOrders.filter((o) => o.failureReason || o.status === 'cancelled' || o.status === '下发失败');
    }
    return activeDispatchOrders;
  }, [activeDispatchOrders, detailOrderFilter]);

  // 模拟下载模板
  const handleDownloadTemplate = () => {
    showToast(
      '模板下载成功',
      `已下载【${currentTask?.name || '顺丰外勤任务'}】网点导入标准模板 (.xlsx)`,
      'success'
    );
  };

  // 获取当前正在下发或刚下发完成的批次对象
  const currentActiveDispatch = useMemo(() => {
    if (!currentActiveDispatchId) return null;
    return dispatchRecords.find((d) => d.id === currentActiveDispatchId) || null;
  }, [dispatchRecords, currentActiveDispatchId]);

  // 当前批次的失败订单列表（用于部分成功时直观指出异常点位与拦截原因）
  const currentBatchFailedOrders = useMemo(() => {
    if (!currentActiveDispatchId) return [];
    const list = orders.filter(
      (o) =>
        o.dispatchId === currentActiveDispatchId &&
        (o.failureReason || o.status === 'cancelled' || o.status === '下发失败')
    );
    if (list.length > 0) return list;
    if (
      currentActiveDispatch &&
      (currentActiveDispatch.failureCount > 0 ||
        currentActiveDispatch.status === '部分成功' ||
        currentActiveDispatch.status === '失败')
    ) {
      return [
        {
          id: `FAIL-${currentActiveDispatch.id.slice(-4)}-01`,
          dispatchId: currentActiveDispatch.id,
          merchantId: currentTenant?.id || 'M-1001',
          merchantName: currentTenant?.name || '顺意优选',
          taskId: currentActiveDispatch.taskId,
          taskName: currentActiveDispatch.taskName,
          channel: currentActiveDispatch.channel,
          contactName: '张敏捷',
          contactPhone: '13811220000',
          contactCompany: `${currentTenant?.name || '顺意优选'}·深圳大鹏特约店`,
          address: '广东省深圳市大鹏新区南澳街道海滨路99号后山点位',
          failureReason: 'POI地址超出顺丰网格末端服务半径（>35km），无法调派小哥上门',
          status: 'cancelled',
          createdAt: currentActiveDispatch.createdAt,
          updatedAt: currentActiveDispatch.createdAt,
        },
      ];
    }
    return [];
  }, [orders, currentActiveDispatchId, currentActiveDispatch, currentTenant]);

  // 重置回准备上传阶段（再来一单/继续导入新批次）
  const handleResetForNewDispatch = () => {
    setDispatchStage('upload');
    setCurrentActiveDispatchId(null);
    setDispatchProgress(0);
    setDispatchStepIndex(1);
    setReorderSourceDispatchId(null);
  };

  // 核心：点击【立即下发】后启动顺丰通道推单下发（驱动 4 步专网里程碑与实时百分比进度）
  const handleStartAutoDispatch = (rowsToDispatch: PoiRow[], fileName: string) => {
    if (!currentTenant) {
      showToast('请先登录', '请先登录商户管理员账号', 'error');
      return;
    }
    const task = readyTasks.find((t) => t.id === selectedTaskId) || readyTasks[0];
    if (!task) {
      showToast('请选择任务', '请先在步骤 1 中选择生效的业务任务', 'error');
      return;
    }
    if (rowsToDispatch.length === 0) {
      showToast('网点不能为空', '请先导入或添加受检网点后再下发', 'error');
      return;
    }

    setUploadedFileName(fileName);
    setPoiRows(rowsToDispatch);
    setIsValidated(true);

    // 1. 创建下单记录，状态初始为【下发中】（若采纳智能建议则使用标准五级地址，否则保留原值）
    const newDispatchId = createDispatchRecord({
      merchantId: currentTenant.id,
      taskId: task.id,
      channel: selectedChannel,
      items: rowsToDispatch.map((r) => {
        const finalAddress =
          useAddressValidation && r.isAccepted !== false && r.cleanAddress
            ? r.cleanAddress
            : (r.rawAddress || r.address);
        return {
          contactName: r.contactName,
          contactPhone: r.contactPhone,
          contactCompany: r.contactCompany,
          address: finalAddress,
        };
      }),
      immediateDispatch: false,
      creatorRole: '租户',
      creatorName: `${currentTenant.adminName}（管理员）`,
    });

    // 2. 步骤 2 立即就地切入“实时下发中”模式
    setCurrentActiveDispatchId(newDispatchId);
    setDispatchStage('dispatching');
    setDispatchProgress(15);
    setDispatchStepIndex(1);

    // 3. 4 步顺丰专网通道推单里程碑模拟推进
    // 步骤 1：数据格式合规校验
    setTimeout(() => {
      setDispatchProgress(42);
      setDispatchStepIndex(2); // 步骤 2：顺丰网格覆盖预核
    }, 550);

    setTimeout(() => {
      setDispatchProgress(75);
      setDispatchStepIndex(3); // 步骤 3：丰创通道推单派发
      // 触发通道实际推单执行与网格运力匹配
      executeDispatch(newDispatchId);
    }, 1250);

    setTimeout(() => {
      setDispatchProgress(95);
      setDispatchStepIndex(4); // 步骤 4：生成工单进入履约
    }, 1850);

    setTimeout(() => {
      setDispatchProgress(100);
      setTimeout(() => {
        setDispatchStage('completed');
        showToast('下发完成', `批次【${newDispatchId}】已下发完成，就地展示本次下发结果`, 'success');
      }, 450);
    }, 2450);
  };

  // Excel 文件解析成功统一处理方法：启动空间智能清洗动画并展示实时进度
  const handleFileUploadSuccess = (uploadedPois: PoiRow[], fileName: string) => {
    setIsUploading(false);
    setUploadedFileName(fileName);
    runCleaningAnimation(uploadedPois.length, () => {
      const enriched = enrichPoiRowsWithService(uploadedPois);
      setPoiRows(enriched);
      setIsValidated(true);
      setReorderSourceDispatchId(null);
      setShowPreviewAllRows(true);
      if (useAddressValidation) {
        setValidationProcessed(true);
        setShowValidationDetail(true);
        showToast(
          '清洗完成 · 智能体检就绪',
          `已自动完成【${fileName}】共 ${uploadedPois.length} 处网点的五级标准化与网格对齐，请在分流视图中核对`,
          'success'
        );
      } else {
        showToast(
          '网点数据解析成功',
          `已成功读取【${fileName}】共 ${uploadedPois.length} 处受检网点，请核对后点击【立即下发】启动顺丰通道推单`,
          'success'
        );
      }
    });
  };

  // 模拟生成 1,000 条企业级大数据批次样本（用于演示跨服务三态分流与千级数据高效过滤）
  const handleGenerate1000Pois = () => {
    setIsUploading(true);
    setTimeout(() => {
      const generated: PoiRow[] = [];
      const areas = [
        { district: '南山区', street: '粤海街道', grid: 'SF-GD-SZ0755-NS15', name: '科技园南区网格' },
        { district: '福田区', street: '福田街道', grid: 'SF-GD-SZ0755-FT09', name: '福田CBD综合网格' },
        { district: '罗湖区', street: '桂园街道', grid: 'SF-GD-SZ0755-LH03', name: '罗湖金三角网格' },
        { district: '宝安区', street: '新安街道', grid: 'SF-GD-SZ0755-BA06', name: '宝安中心区网格' },
        { district: '龙岗区', street: '平湖街道', grid: 'SF-GD-SZ0755-LG02', name: '华南城履约网格' },
        { district: '龙华区', street: '民治街道', grid: 'SF-GD-SZ0755-LH08', name: '深圳北站商务网格' },
      ];

      for (let i = 1; i <= 1000; i++) {
        const a = areas[i % areas.length];
        const isWarning = i % 125 === 0; // 约 8 条阻断异常（占比 0.8%）
        const isImproved = !isWarning && i % 8 !== 0; // 约 870 条智能优化（占比 87%）
        const isPerfect = !isWarning && !isImproved; // 约 122 条免审完美（占比 12.2%）

        if (isWarning) {
          generated.push({
            contactName: `店长_${i}`,
            contactPhone: '13800000000',
            contactCompany: `${currentTenant?.name || '顺意优选'}·深圳偏远测试点${i}`,
            address: `广东省深圳市大鹏新区南澳街道未命名海滨路后山${i}号（无门牌）`,
            rawAddress: `广东省深圳市大鹏新区南澳街道未命名海滨路后山${i}号（无门牌）`,
            cleanAddress: `广东省深圳市大鹏新区南澳街道未命名海滨路后山${i}号（无门牌）`,
            gridCode: 'SF-GD-SZ0755-DP09',
            gridName: '顺丰大鹏待核验服务区',
            confidence: 65,
            healthStatus: 'warning',
            serviceBadges: [
              { label: '⚠️ 门牌不详', type: 'warning' },
              { label: '超半径待核', type: 'warning' },
            ],
            suggestionType: 'warning',
            diffNote: '缺少准确门牌号且超出顺丰末端标准网格履约半径，建议重点核对',
            isAccepted: false,
          });
        } else if (isImproved) {
          generated.push({
            contactName: `主管_${i}`,
            contactPhone: `138${String(10000000 + i).slice(0, 8)}`,
            contactCompany: `${currentTenant?.name || '顺意优选'}·深圳${a.district}特约店${i}`,
            address: `深圳市${a.district}兴盛路${i}号`,
            rawAddress: `深圳市${a.district}兴盛路${i}号`,
            cleanAddress: `广东省深圳市${a.district}${a.street}兴盛路${i}号临街101铺`,
            gridCode: a.grid,
            gridName: a.name,
            confidence: 97 + (i % 3),
            healthStatus: 'improved',
            serviceBadges: [
              { label: `${a.street}补齐`, type: 'info' },
              { label: '网格已覆盖', type: 'success' },
              { label: '号码合规', type: 'neutral' },
            ],
            suggestionType: 'improved',
            diffNote: `智能补齐“广东省深圳市${a.district}${a.street}”行政层级并校准临街商铺号`,
            isAccepted: true,
          });
        } else {
          generated.push({
            contactName: `经理_${i}`,
            contactPhone: `139${String(20000000 + i).slice(0, 8)}`,
            contactCompany: `${currentTenant?.name || '顺意优选'}·深圳${a.district}旗舰店${i}`,
            address: `广东省深圳市${a.district}${a.street}创新大道${i}号A座102室`,
            rawAddress: `广东省深圳市${a.district}${a.street}创新大道${i}号A座102室`,
            cleanAddress: `广东省深圳市${a.district}${a.street}创新大道${i}号A座102室`,
            gridCode: a.grid,
            gridName: a.name,
            confidence: 100,
            healthStatus: 'perfect',
            serviceBadges: [
              { label: '免审合规', type: 'success' },
              { label: '30min极速网格', type: 'success' },
            ],
            suggestionType: 'perfect',
            diffNote: '标准五级地址与末端网格完全吻合，可免审直接下发',
            isAccepted: true,
          });
        }
      }

      setUploadedFileName('顺意全国月度巡检网点清单_1000店.xlsx');
      setIsUploading(false);

      runCleaningAnimation(1000, () => {
        setPoiRows(generated);
        setIsValidated(true);
        setReorderSourceDispatchId(null);
        setShowPreviewAllRows(true);
        setValidationProcessed(true);
        setPoiCurrentPage(1);
        setHealthStatusFilter('all');

        showToast(
          '清洗完成 · 已载入 1,000 条海量网点',
          '顺丰空间智能引擎已完成清洗：870条已智能优化、122条免审通过、8条阻断异常。支持分流聚焦审核！',
          'success'
        );
      });
    }, 100);
  };

  // 模拟上传或点击选择示例 Excel：解析完成后填入工作台，需点击“立即下发”启动推单
  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const newFileName = `顺意门店巡检数据_${new Date().toISOString().slice(5, 10).replace('-', '')}_${Math.floor(100 + Math.random() * 900)}.xlsx`;
      const uploadedPois: PoiRow[] = [
        {
          contactName: '林店长',
          contactPhone: '13566778899',
          contactCompany: `${currentTenant?.name || '顺意优选'}·深圳南山高新科技园店`,
          address: '广东省深圳市南山区高新南九道科技生态园10栋B座1层',
        },
        {
          contactName: '周副理',
          contactPhone: '13988990011',
          contactCompany: `${currentTenant?.name || '顺意优选'}·深圳福田车公庙店`,
          address: '广东省深圳市福田区深南大道6011号NEO大厦B座首层',
        },
        {
          contactName: '何主管',
          contactPhone: '13799001122',
          contactCompany: `${currentTenant?.name || '顺意优选'}·深圳龙岗万达广场店`,
          address: '广东省深圳市龙岗区华南二道龙岗万达广场1层1002号',
        },
      ];
      handleFileUploadSuccess(uploadedPois, newFileName);
    }, 400);
  };

  // 真实本地文件选择事件
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploading(true);
    setTimeout(() => {
      const fileName = file.name;
      const uploadedPois: PoiRow[] = [
        {
          contactName: '陈店长',
          contactPhone: '13612345678',
          contactCompany: `${currentTenant?.name || '顺意优选'}·${file.name.replace(/\.[^/.]+$/, '').slice(0, 10)}点位1`,
          address: '广东省深圳市南山区科苑南路3099号中国储能大厦首层',
        },
        {
          contactName: '李主管',
          contactPhone: '13898765432',
          contactCompany: `${currentTenant?.name || '顺意优选'}·${file.name.replace(/\.[^/.]+$/, '').slice(0, 10)}点位2`,
          address: '广东省深圳市福田区金田路4018号安联大厦1层',
        },
        {
          contactName: '赵店长',
          contactPhone: '13911223344',
          contactCompany: `${currentTenant?.name || '顺意优选'}·${file.name.replace(/\.[^/.]+$/, '').slice(0, 10)}点位3`,
          address: '广东省深圳市罗湖区深南东路5001号华润大厦B1层',
        },
      ];
      handleFileUploadSuccess(uploadedPois, fileName);
    }, 450);
  };

  // 拖拽上传事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setIsUploading(true);
      setTimeout(() => {
        const fileName = file.name;
        const uploadedPois: PoiRow[] = [
          {
            contactName: '陈店长',
            contactPhone: '13612345678',
            contactCompany: `${currentTenant?.name || '顺意优选'}·${file.name.replace(/\.[^/.]+$/, '').slice(0, 10)}点位1`,
            address: '广东省深圳市南山区科苑南路3099号中国储能大厦首层',
          },
          {
            contactName: '李主管',
            contactPhone: '13898765432',
            contactCompany: `${currentTenant?.name || '顺意优选'}·${file.name.replace(/\.[^/.]+$/, '').slice(0, 10)}点位2`,
            address: '广东省深圳市福田区金田路4018号安联大厦1层',
          },
        ];
        handleFileUploadSuccess(uploadedPois, fileName);
      }, 450);
    }
  };

  // 下载失败订单明细 (CSV 包含 UTF-8 BOM，Excel 打开无乱码)
  const handleDownloadFailedOrders = (dispatch: DispatchRecord) => {
    const failedOrders = orders.filter(
      (o) => o.dispatchId === dispatch.id && (o.failureReason || o.status === 'cancelled' || o.status === '下发失败' || dispatch.status === '全部失败')
    );

    const itemsToExport = failedOrders.length > 0 ? failedOrders : [
      {
        id: `FAIL-${dispatch.id.slice(-4)}-01`,
        contactCompany: `${currentTenant?.name || '顺意优选'}·深圳大鹏特约店`,
        contactName: '张敏捷',
        contactPhone: '13811220000',
        address: '广东省深圳市大鹏新区南澳街道海滨路99号后山点位',
        failureReason: 'POI地址超出顺丰网格末端服务半径（>35km），无法调派小哥上门',
      },
    ];

    const headers = ['订单流水号', '受检网点名称', '现场联系人', '联系电话', '履约地址', '下发失败原因', '修改指引建议'];
    const rows = itemsToExport.map((o: any, idx: number) => [
      o.id || `FAIL-ORD-${idx + 1}`,
      `"${(o.contactCompany || '').replace(/"/g, '""')}"`,
      `"${(o.contactName || '').replace(/"/g, '""')}"`,
      `"${o.contactPhone || ''}"`,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      `"${(o.failureReason || '渠道网格服务校验未通过：联系人电话格式异常或POI地址超出服务半径').replace(/"/g, '""')}"`,
      `"请核对并修正联系人电话为11位有效手机号，或确保受检地址具体到楼栋门牌号后重新下单"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `下单失败订单明细_${dispatch.id}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      '失败订单明细已下载',
      `已成功导出【${dispatch.id}】共 ${itemsToExport.length} 笔失败订单明细表，包含失败原因与修改建议`,
      'success'
    );
  };

  // 导出该下单记录的全部订单清单
  const handleDownloadAllOrders = (dispatch: DispatchRecord) => {
    const dispatchOrders = orders.filter((o) => o.dispatchId === dispatch.id);
    const headers = ['订单流水号', '渠道订单号', '受检网点', '现场联系人', '联系电话', '履约地址', '订单状态', '失败原因'];
    const rows = dispatchOrders.map((o) => [
      o.id,
      o.channelOrderId || '暂无',
      `"${(o.contactCompany || '').replace(/"/g, '""')}"`,
      `"${(o.contactName || '').replace(/"/g, '""')}"`,
      `"${o.contactPhone || ''}"`,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      o.status,
      `"${(o.failureReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `下单记录订单清单_${dispatch.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('订单明细已导出', `已成功导出【${dispatch.id}】共 ${dispatchOrders.length} 笔订单清单`, 'success');
  };

  // 打开下单记录明细详情弹窗
  const handleViewDetail = (dispatch: DispatchRecord) => {
    setActiveDetailDispatch(dispatch);
  };

  // 修改后重新下单：提取失败订单带入左侧工作台
  const handleModifyAndReorder = (dispatch: DispatchRecord) => {
    const failedOrders = orders.filter(
      (o) => o.dispatchId === dispatch.id && (o.failureReason || o.status === 'cancelled' || o.status === '下发失败' || dispatch.status === '全部失败')
    );

    const failedPois: PoiRow[] =
      failedOrders.length > 0
        ? failedOrders.map((o) => ({
            contactName: o.contactName,
            contactPhone: o.contactPhone,
            contactCompany: o.contactCompany,
            address: o.address,
            failReason: o.failureReason || 'POI地址超出顺丰网格末端服务半径（>35km）',
          }))
        : [
            {
              contactName: '张敏捷',
              contactPhone: '13811220000',
              contactCompany: `${currentTenant?.name || '顺意优选'}·大鹏南澳海滨特约店`,
              address: '广东省深圳市大鹏新区南澳街道海滨路99号后山偏远点位',
              failReason: 'POI地址超出顺丰当前片区服务半径（>35km），小哥无法在规定时效内履约',
            },
          ];

    setPoiRows(failedPois);
    setSelectedTaskId(dispatch.taskId);
    setSelectedChannel(dispatch.channel as any);
    setUploadedFileName(`重新下单_失败修正_${dispatch.id}.xlsx`);
    setReorderSourceDispatchId(dispatch.id);
    setDispatchStage('upload');
    setIsValidated(true);
    setShowPreviewAllRows(true);

    // 默认激活第一条失败订单的编辑弹窗，方便立即修正
    if (failedPois.length > 0) {
      setEditingPoiIndex(0);
      setEditingPoiData({ ...failedPois[0] });
    }

    // 关闭明细弹窗与历史弹窗并滚动至工作台顶部
    setActiveDetailDispatch(null);
    setShowHistoryModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    showToast(
      '已载入失败订单数据',
      `已将下单记录【${dispatch.id}】的 ${failedPois.length} 笔失败订单载入工作台并打开修正窗口，修改保存后即可重新下发`,
      'info'
    );
  };

  // 取消重新下单，恢复默认模板点位
  const handleResetWorkbench = () => {
    setReorderSourceDispatchId(null);
    setDispatchStage('upload');
    setUploadedFileName('顺意优选_南山福田巡检点位.xlsx');
    setPoiRows([
      {
        contactName: '张店长',
        contactPhone: '13811223344',
        contactCompany: `${currentTenant?.name || '顺意优选'}·深圳福田购物公园店`,
        address: '广东省深圳市福田区民田路138号购物公园B1层',
      },
      {
        contactName: '李经理',
        contactPhone: '13922334455',
        contactCompany: `${currentTenant?.name || '顺意优选'}·深圳南山万象天地店`,
        address: '广东省深圳市南山区深南大道9668号万象天地LG层',
      },
      {
        contactName: '王主管',
        contactPhone: '13733445566',
        contactCompany: `${currentTenant?.name || '顺意优选'}·深圳罗湖万象城店`,
        address: '广东省深圳市罗湖区宝安南路1881号深圳万象城中区B2层',
      },
    ]);
    showToast('已恢复默认点位', '已退出失败订单重新下单模式', 'info');
  };

  // 快速一键修正该异常点位（将偏远模糊地址替换为网格内合规地址，并修正联系人电话）
  const handleAutoFixPoi = (index: number) => {
    const updated = [...poiRows];
    const target = updated[index];
    updated[index] = {
      ...target,
      contactPhone: target.contactPhone.length === 11 ? target.contactPhone : '13823456789',
      address: target.address.includes('偏远') || target.address.includes('后山') || target.address.includes('离岛')
        ? '广东省深圳市南山区深南大道9668号华润万象天地B1层顺意精选店'
        : `${target.address}（已补充准确门牌号与顺丰网格末端覆盖）`,
      failReason: undefined,
      isModified: true,
    };
    setPoiRows(updated);
    showToast('已一键修正网点', `【${target.contactCompany}】已更新为顺丰网格覆盖内合规地址，可直接重新下发`, 'success');
  };

  // 执行门店地址智能校验与网格预核服务（手动触发重新预核）
  const handleRunAddressValidation = () => {
    setIsProcessingValidation(true);
    setTimeout(() => {
      setIsProcessingValidation(false);
      setValidationProcessed(true);
      setShowValidationDetail(true);
      showToast(
        '地址校验与网格预核完成',
        `共检测 ${poiRows.length} 处门店：已全部对齐顺丰标准五级地址与末端网格，可在此核对差异并自主选择采纳`,
        'success'
      );
    }, 600);
  };

  // 单条切换采纳建议状态（采纳优化建议 vs 保留原始数据）
  const handleToggleAcceptSuggestion = (index: number) => {
    const updated = [...poiRows];
    const nextAccepted = updated[index].isAccepted === false ? true : false;
    updated[index] = {
      ...updated[index],
      isAccepted: nextAccepted,
    };
    setPoiRows(updated);
    showToast(
      nextAccepted ? '已采纳优化建议' : '已保留原始地址',
      `【${updated[index].contactCompany}】将${nextAccepted ? '使用顺丰标准五级地址推单' : '保留您上传的原始数据推单'}`,
      'info'
    );
  };

  // 全部采纳优化建议
  const handleAcceptAllSuggestions = () => {
    const updated = poiRows.map((r) => ({ ...r, isAccepted: true }));
    setPoiRows(updated);
    showToast('已全部采纳优化建议', '所有网点均将使用顺丰标准五级地址与末端网格编码推单，提升下发通过率', 'success');
  };

  // 全部保留原始输入数据
  const handleRejectAllSuggestions = () => {
    const updated = poiRows.map((r) => ({ ...r, isAccepted: false }));
    setPoiRows(updated);
    showToast('已全部保留原始数据', '所有网点均恢复使用您原始录入的地址信息推单，顺丰服务方案仅作为校验参考', 'info');
  };

  // 下载服务处理过的高精度标准数据 (.csv)
  const handleDownloadValidatedData = () => {
    const headers = [
      '序号',
      '受检门店/客户公司',
      '现场联系人',
      '联系电话',
      '客户原始输入地址',
      '顺丰治理后标准五级地址',
      '顺丰网格编码',
      '所属网格服务区',
      '地址准确度评分',
      '采纳状态',
      '最终推单采用地址',
      '优化细节说明',
    ];

    const rows = poiRows.map((row, idx) => {
      const isAccepted = row.isAccepted !== false;
      const clean = row.cleanAddress || row.address;
      const raw = row.rawAddress || row.address;
      const finalAddr = useAddressValidation && isAccepted ? clean : raw;
      return [
        idx + 1,
        `"${row.contactCompany.replace(/"/g, '""')}"`,
        `"${row.contactName.replace(/"/g, '""')}"`,
        `"${row.contactPhone}"`,
        `"${raw.replace(/"/g, '""')}"`,
        `"${clean.replace(/"/g, '""')}"`,
        `"${row.gridCode || 'SF-GD-SZ0755-FT09'}"`,
        `"${row.gridName || '顺丰福田CBD综合网格'}"`,
        `"${row.confidence || 98}%"`,
        `"${isAccepted ? '已采纳优化建议' : '保留原始数据'}"`,
        `"${finalAddr.replace(/"/g, '""')}"`,
        `"${(row.diffNote || '已补齐标准行政层级与网格编码').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${currentTenant?.name || '顺意优选'}_门店地址体检对比明细_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('已导出对比明细表', '已导出包含原始输入、五级建议与采纳标记的完整数据表 (.csv)', 'success');
  };

  // 将服务清洗后的数据同步应用至步骤 2 待下发列表
  const handleApplyValidatedData = () => {
    handleAcceptAllSuggestions();
  };

  // 打开编辑点位弹窗
  const handleOpenEditPoi = (index: number) => {
    setEditingPoiIndex(index);
    setEditingPoiData({ ...poiRows[index] });
  };

  // 保存点位编辑
  const handleSavePoi = () => {
    if (editingPoiIndex === null || !editingPoiData) return;
    if (!editingPoiData.contactName || !editingPoiData.contactPhone || !editingPoiData.address) {
      showToast('必填项不能为空', '请填写联系人、手机号与详细履约地址', 'error');
      return;
    }
    const updated = [...poiRows];
    updated[editingPoiIndex] = {
      ...editingPoiData,
      isModified: true,
    };
    setPoiRows(updated);
    setEditingPoiIndex(null);
    setEditingPoiData(null);
    showToast('网点信息已更新', '点位已修正，提交时将重新校验并下发', 'success');
  };

  // 删除单条点位
  const handleDeletePoi = (index: number) => {
    const updated = poiRows.filter((_, idx) => idx !== index);
    setPoiRows(updated);
    showToast('已删除网点', '该网点已从本次待下单列表中移除', 'info');
  };

  // 保存新增网点
  const handleSaveAddPoi = () => {
    if (!newPoiData.contactName || !newPoiData.contactPhone || !newPoiData.address) {
      showToast('必填项不能为空', '请填写联系人、手机号与详细履约地址', 'error');
      return;
    }
    setPoiRows([...poiRows, { ...newPoiData, isModified: true }]);
    setShowAddPoiModal(false);
    setNewPoiData({
      contactName: '',
      contactPhone: '',
      contactCompany: `${currentTenant?.name || '顺意优选'}·新网点`,
      address: '',
    });
    showToast('网点添加成功', '新增网点已成功加入待下单列表', 'success');
  };

  // 提交下单（立即下发或待下发）
  const handleSubmitDispatch = (immediate: boolean) => {
    if (!currentTenant) {
      showToast('请先登录', '请先登录商户管理员账号再进行下单操作', 'error');
      return;
    }
    if (!currentTask) {
      showToast('无可用任务', '请先联系运营开通并生效外勤任务', 'error');
      return;
    }
    if (poiRows.length === 0) {
      showToast('网点不能为空', '请上传包含有效受检网点的数据文件或手动添加点位', 'error');
      return;
    }

    // 如果是立即下发，直接交由步骤 2 内部的自动实时下发引擎处理（展示进度条并在完成后呈现当前结果）
    if (immediate) {
      handleStartAutoDispatch(poiRows, uploadedFileName);
      return;
    }

    // 否则存为待下发
    const orderCount = poiRows.length;
    const newDispatchId = createDispatchRecord({
      merchantId: currentTenant.id,
      taskId: currentTask.id,
      channel: selectedChannel,
      items: poiRows.map((r) => {
        const finalAddress =
          useAddressValidation && r.isAccepted !== false && r.cleanAddress
            ? r.cleanAddress
            : (r.rawAddress || r.address);
        return {
          contactName: r.contactName,
          contactPhone: r.contactPhone,
          contactCompany: r.contactCompany,
          address: finalAddress,
        };
      }),
      immediateDispatch: false,
      creatorRole: '租户',
      creatorName: `${currentTenant.adminName}（管理员）`,
    });

    if (reorderSourceDispatchId) {
      setReorderSourceDispatchId(null);
    }

    showToast(
      '已保存为待下发',
      `下单流水号【${newDispatchId}】已存入待下发队列，可在右侧下单记录列表中随时点击“立即下发”`,
      'info'
    );
  };

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto">
      {/* 顶部标题栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Send className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">下单管理</h2>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-[11px] font-semibold">
                下发中 {statusCounts.dispatching}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[11px] font-semibold">
                全部成功 {statusCounts.allSuccess}
              </span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[11px] font-semibold">
                部分成功 {statusCounts.partial}
              </span>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[11px] font-semibold">
                失败 {statusCounts.failed}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            批量导入受检网点快速下发外勤订单；右侧下单记录实时显性化展示下发状态，支持下载失败明细与修改后重新下单
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetToDemoData}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
            title="一键恢复并刷新全量演示数据集（覆盖下发中、全部成功、部分成功、失败）"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            重置演示数据
          </button>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <History className="w-4 h-4 text-indigo-600" />
            查看全部下单记录 ({tenantDispatches.length})
          </button>
        </div>
      </div>

      {/* 重新下单活跃模式提示条 */}
      {reorderSourceDispatchId && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <RefreshCw className="w-5 h-5 text-amber-700 animate-spin" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-950 text-sm">
                    正在处理失败订单修正与重新下单
                  </span>
                  <span className="font-mono text-xs text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                    来源批次：{reorderSourceDispatchId}
                  </span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  已为您将该下单记录中的失败订单载入下方点位列表。请在表格中点击【修改】校对并修正联系电话或详细地址，保存后点击底部【确认修正并立即重新下发】即可重新下发。
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetWorkbench}
              className="px-3.5 py-2 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition shadow-2xs"
            >
              放弃重下并恢复默认
            </button>
          </div>
        </div>
      )}

      {/* 核心双栏架构（左侧主工作台 + 右侧下单记录动态） */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= 左侧：新建批量下单工作台 (主操作区 7-8 列) ================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* 步骤 1：选择生效业务任务 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-slate-900 text-sm">选择所属业务任务</h3>
              </div>
              <span className="text-xs text-slate-400">仅展示运营为您配置并已生效的外勤任务</span>
            </div>

            {readyTasks.length === 0 ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>暂无已生效任务。请联系平台运营为您创建并激活外勤巡检任务后再下单。</span>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {readyTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (任务ID: {t.id} · 模式: {t.type})
                    </option>
                  ))}
                </select>

                {currentTask && (
                  <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-950">{currentTask.name}</span>
                        <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          正常履约中
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        责任运营人：{currentTask.responsiblePerson || '平台专属服务经理'} · 截止日期：
                        {currentTask.deadline || '长期有效'}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-indigo-700 font-medium">
                      已累计履约订单：<span className="font-bold font-mono">{currentTask.orderCount}</span> 单
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 步骤 2：导入受检网点点位数据 与 自动下发实时工作台 */}
          {dispatchStage === 'dispatching' ? (
            /* 阶段 2：上传完成后自动极速下发中 · 实时进度监控 */
            <div className="bg-white rounded-xl border-2 border-indigo-300 p-6 shadow-md space-y-5">
              {/* 顶栏 */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">顺丰外勤任务通道推单下发中...</h3>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      已启动顺丰专网通道推单，4 步里程碑实时处理推进中
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    批次流水号：{currentActiveDispatchId}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">
                    共 {poiRows.length} 个网点
                  </span>
                </div>
              </div>

              {/* 核心进度条与动效 */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 border border-indigo-100 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-950 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                    {dispatchStepIndex === 1 && '第 1/4 步：正在校验 Excel 门店数据完整性与必填字段...'}
                    {dispatchStepIndex === 2 && '第 2/4 步：正在调用顺丰标准五级地址库与末端网格覆盖引擎...'}
                    {dispatchStepIndex === 3 && '第 3/4 步：正在向顺丰丰创通道推单并匹配片区小哥履约运力...'}
                    {dispatchStepIndex >= 4 && '第 4/4 步：通道推单成功，正在生成外勤工单流水号与实时排班...'}
                  </span>
                  <span className="font-mono text-indigo-700 text-base font-extrabold">{dispatchProgress}%</span>
                </div>

                {/* 动态进度槽 */}
                <div className="w-full h-3 bg-white/90 rounded-full overflow-hidden p-0.5 border border-indigo-200 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-700 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${dispatchProgress}%` }}
                  />
                </div>

                {/* 4 步里程碑进度 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                    dispatchStepIndex >= 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium text-[11px] truncate">1. 数据格式合规校验</span>
                  </div>
                  <div className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                    dispatchStepIndex >= 2 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : dispatchStepIndex === 1 ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-semibold' : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {dispatchStepIndex >= 2 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />}
                    <span className="font-medium text-[11px] truncate">2. 顺丰网格覆盖预核</span>
                  </div>
                  <div className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                    dispatchStepIndex >= 3 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : dispatchStepIndex === 2 ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-semibold' : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {dispatchStepIndex >= 3 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />}
                    <span className="font-medium text-[11px] truncate">3. 丰创通道推单派发</span>
                  </div>
                  <div className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                    dispatchStepIndex >= 4 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {dispatchStepIndex >= 4 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <span className="font-medium text-[11px] truncate">4. 生成工单进入履约</span>
                  </div>
                </div>
              </div>

              {/* 正在下发网点清单微型卡 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-slate-600 font-semibold">
                  <span>正在推单网点清单 ({poiRows.length})</span>
                  <span className="text-[11px] text-indigo-600 font-normal">通道接口推单中</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
                  {poiRows.map((r, i) => (
                    <div key={i} className="p-2.5 px-3.5 flex items-center justify-between hover:bg-slate-50/50">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800">{r.contactCompany}</div>
                        <div className="text-slate-500 text-[11px] truncate max-w-md">{r.address}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-slate-600">{r.contactPhone}</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          推单中
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>系统正在实时向顺丰丰创通道推单并核验网格运力，完成后将在此处直接呈现下发结果，请稍候...</span>
              </div>
            </div>
          ) : dispatchStage === 'completed' ? (
            /* 阶段 3：就地呈现当前批次下发结果与闭环 */
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              {/* 顶栏 */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    ✓
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">当前批次下发结果</h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                    批次流水号：{currentActiveDispatch?.id || currentActiveDispatchId}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">{currentActiveDispatch?.createdAt || '刚刚'}</span>
                </div>
              </div>

              {/* 结果主展区：全部成功 vs 部分成功 */}
              {currentActiveDispatch?.status === '全部成功' || (currentActiveDispatch?.failureCount === 0) ? (
                <div className="bg-emerald-50/80 border-2 border-emerald-200 rounded-xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-emerald-950 text-base">
                          本次批量下单全部下发成功！
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded">
                          全部成功
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        共 <b>{currentActiveDispatch?.orderCount || poiRows.length}</b> 个受检网点已全部通过顺丰地址网格对齐，并推单至顺丰丰创通道生成外勤任务工单，片区顺丰小哥正在接单履约中。
                      </p>
                    </div>
                  </div>

                  {/* 结果网点快捷表格 */}
                  <div className="bg-white rounded-lg border border-emerald-200 overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-emerald-100/50 text-emerald-900 font-semibold border-b border-emerald-200">
                        <tr>
                          <th className="py-2 px-3">序号</th>
                          <th className="py-2 px-3">受检网点 / 客户公司</th>
                          <th className="py-2 px-3">顺丰服务网格 / 营业部</th>
                          <th className="py-2 px-3">现场联系人</th>
                          <th className="py-2 px-3 text-right">履约状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {poiRows.map((r, i) => (
                          <tr key={i} className="hover:bg-emerald-50/30">
                            <td className="py-2 px-3 font-mono text-slate-500">{i + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-800">{r.contactCompany}</td>
                            <td className="py-2 px-3 text-slate-600">
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700">
                                顺丰速运-深圳科技园营业部
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{r.contactName} ({r.contactPhone})</td>
                            <td className="py-2 px-3 text-right">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[11px]">
                                已派发履约
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 操作按钮组 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-emerald-800 font-medium">
                      右侧“最近下单记录”已同步沉淀本批次明细，随时支持追踪查验
                    </div>
                    <div className="flex items-center gap-2">
                      {currentActiveDispatch && (
                        <button
                          type="button"
                          onClick={() => handleViewDetail(currentActiveDispatch)}
                          className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          查看本次订单明细
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleResetForNewDispatch}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        继续导入新批次 / 再下一单
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* 部分成功 / 失败 */
                <div className="bg-amber-50/80 border-2 border-amber-300 rounded-xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-amber-950 text-base">
                          本次下发完成：部分成功
                        </h4>
                        <span className="px-2 py-0.5 bg-amber-600 text-white text-[11px] font-bold rounded">
                          成功 {currentActiveDispatch?.successCount || 2} 单 / 异常 {currentActiveDispatch?.failureCount || 1} 单
                        </span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        其中合规点位已成功推单进入履约；但检测到 <b>{currentActiveDispatch?.failureCount || currentBatchFailedOrders.length || 1}</b> 笔点位因地址超出顺丰网格末端服务半径或联系人电话格式异常被拦截。您可直接在此下载失败明细或一键进入修改并重新下单。
                      </p>
                    </div>
                  </div>

                  {/* 直观指出异常拦截点位与具体拦截原因 */}
                  {currentBatchFailedOrders.length > 0 && (
                    <div className="bg-white rounded-lg border border-amber-200 overflow-hidden text-xs">
                      <div className="bg-amber-100/60 px-3.5 py-2 border-b border-amber-200 flex items-center justify-between text-amber-900 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                          异常拦截网点与原因清单 ({currentBatchFailedOrders.length} 笔)
                        </span>
                        <span className="text-[11px] text-amber-700 font-normal">
                          支持下载明细或直接点击【修改后重新下单】就地修正
                        </span>
                      </div>
                      <div className="divide-y divide-amber-100 max-h-48 overflow-y-auto">
                        {currentBatchFailedOrders.map((fo: any, idx: number) => (
                          <div key={idx} className="p-2.5 px-3.5 hover:bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{fo.contactCompany}</span>
                                <span className="text-slate-500 font-mono text-[11px]">
                                  {fo.contactName} ({fo.contactPhone})
                                </span>
                              </div>
                              <div className="text-slate-500 text-[11px] truncate max-w-md">{fo.address}</div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-medium text-[11px] border border-rose-200">
                                拦截原因: {fo.failureReason || 'POI地址超出顺丰网格末端服务半径（>35km）'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 闭环核心按钮组 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200">
                    <div className="flex items-center gap-2">
                      {currentActiveDispatch && (
                        <button
                          type="button"
                          onClick={() => handleDownloadFailedOrders(currentActiveDispatch)}
                          className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-950 border-2 border-amber-300 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <Download className="w-4 h-4 text-amber-700" />
                          📥 下载失败订单明细 (.csv)
                        </button>
                      )}

                      {currentActiveDispatch && (
                        <button
                          type="button"
                          onClick={() => handleModifyAndReorder(currentActiveDispatch)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Edit2 className="w-4 h-4" />
                          ✏️ 修改后重新下单
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {currentActiveDispatch && (
                        <button
                          type="button"
                          onClick={() => handleViewDetail(currentActiveDispatch)}
                          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg text-xs transition cursor-pointer"
                        >
                          查看明细
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleResetForNewDispatch}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        导入新批次
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 阶段 1：待上传 / 点位数据准备阶段 */
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {reorderSourceDispatchId ? '修改异常订单并重新下单' : '导入受检网点点位数据'}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {!reorderSourceDispatchId && (
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载专用 Excel 模板
                    </button>
                  )}

                  {isAddressServiceConfigured ? (
                    <label className="flex items-center gap-2 cursor-pointer bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-900 transition shadow-2xs select-none">
                      <input
                        type="checkbox"
                        checked={useAddressValidation}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseAddressValidation(checked);
                          if (checked) {
                            setValidationProcessed(true);
                            showToast('已开启智能体检方案', '已启用顺丰五级地址与网格预核引擎，在下方点位清单就地呈现差异对比与采纳确认', 'success');
                          } else {
                            showToast('已关闭智能体检方案', '将按您导入的原始地址进行推单下发', 'info');
                          }
                        }}
                        className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>顺丰地址智能体检与网格预核 (推荐)</span>
                    </label>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddressServiceConfigured(true);
                        setUseAddressValidation(true);
                        setValidationProcessed(true);
                        showToast('已开通推荐服务方案', '已启用“门店地址智能校验与网格预核”', 'success');
                      }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      + 开启顺丰地址预核服务方案
                    </button>
                  )}
                </div>
              </div>

              {/* 隐藏原生文件上传 Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {/* 场景 A：处于【修改后重新下单】模式 */}
              {reorderSourceDispatchId ? (
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900">
                    <div className="flex items-start sm:items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                      <div>
                        <span className="font-bold">重新下单模式：</span>
                        <span>
                          正在针对原下单记录【{reorderSourceDispatchId}】被拦截的{' '}
                          <b className="font-mono">{poiRows.length}</b> 笔点位进行修正。
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetWorkbench}
                      className="text-slate-500 hover:text-slate-800 underline text-xs shrink-0 cursor-pointer self-end sm:self-auto"
                    >
                      退出重新下单
                    </button>
                  </div>

                  {/* 待修正的失败网点卡片 */}
                  <div className="border border-amber-200 rounded-xl overflow-hidden text-xs bg-amber-50/20 divide-y divide-amber-100">
                    {poiRows.map((row, idx) => (
                      <div key={idx} className="p-3.5 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-800 text-sm">{row.contactCompany}</span>
                            {row.isModified ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                已修正待重新下发
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-medium text-[10px]">
                                待修正
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!row.isModified && (
                              <button
                                type="button"
                                onClick={() => handleAutoFixPoi(idx)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1 transition shadow-2xs"
                                title="一键将偏远或格式错误点位修正为顺丰网格覆盖地址与合规电话"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ⚡ 一键修正为网格合规地址
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditPoi(idx)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                              手动编辑
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 bg-white p-3 rounded-lg border border-amber-100">
                          <div>
                            <span className="text-slate-400">现场联系人：</span>
                            <span className="font-medium text-slate-800">{row.contactName} ({row.contactPhone})</span>
                          </div>
                          <div>
                            <span className="text-slate-400">履约地址：</span>
                            <span className="font-medium text-slate-800">{row.address}</span>
                          </div>
                        </div>

                        {row.failReason && !row.isModified && (
                          <div className="text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>拦截原因：{row.failReason}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 重新下单确认按钮 */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleResetWorkbench}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartAutoDispatch(poiRows, uploadedFileName)}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      确认修正并立即重新下发
                    </button>
                  </div>
                </div>
              ) : (uploadedFileName && poiRows.length > 0) || isCleaning ? (
                /* 场景 B：统一整合的工作台（跨服务通用三态健康度分流、海量数据分页与行内微标签架构） */
                <div className="space-y-3.5">
                  {/* 租户端空间智能清洗实时进度卡片 (当 isCleaning 为 true 时呈现) */}
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
                        <span>① 表头结构解析</span>
                        <span>② 顺丰五级地址对齐</span>
                        <span>③ 末端履约网格时效测算</span>
                        <span>④ 号码与异常阻断归因</span>
                      </div>
                    </div>
                  )}

                  {/* 文件信息与顶部操作工具栏 */}
                  <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                        XLS
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {uploadedFileName}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                            已解析 {poiRows.length} 个点位
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowServiceConfigModal(true)}
                            className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded font-semibold text-[10px] flex items-center gap-1 transition cursor-pointer"
                            title="查看与管理已启用的增值校验服务插件"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
                            已联检服务 ({Object.values(activeServices).filter(Boolean).length} 项)
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          跨服务通用健康体系已生效：支持百千级海量点位按“免审通过、智能优化、待核异常”极速分流审核
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium rounded-lg text-xs transition cursor-pointer"
                      >
                        重新上传
                      </button>
                      {poiRows.length < 100 && (
                        <button
                          type="button"
                          onClick={handleGenerate1000Pois}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="一键载入 1,000 条点位数据，体验万级/千级大数据分流与毫秒级翻页"
                        >
                          <Zap className="w-3.5 h-3.5 text-indigo-600" />
                          载入1000条大数据
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleAcceptAllSuggestions}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        全部采纳优化
                      </button>
                      <button
                        type="button"
                        onClick={handleRejectAllSuggestions}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        保留原数据
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadValidatedData}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
                        title="导出治理前后对比明细表 (.csv)"
                      >
                        <Download className="w-3.5 h-3.5" />
                        导出对比表
                      </button>
                    </div>
                  </div>

                  {/* 核心：通用三态健康度分流看板与搜索栏 */}
                  <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* 三态切换 Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setHealthStatusFilter('all');
                          setPoiCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          healthStatusFilter === 'all'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span>全部点位</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          healthStatusFilter === 'all' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {poiHealthStats.total}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setHealthStatusFilter('perfect');
                          setPoiCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          healthStatusFilter === 'perfect'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>免审通过</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          healthStatusFilter === 'perfect' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {poiHealthStats.perfect}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setHealthStatusFilter('improved');
                          setPoiCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          healthStatusFilter === 'improved'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-indigo-800 hover:bg-indigo-50 border border-indigo-200'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>智能优化</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          healthStatusFilter === 'improved' ? 'bg-indigo-700 text-indigo-100' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {poiHealthStats.improved}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setHealthStatusFilter('warning');
                          setPoiCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          healthStatusFilter === 'warning'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>待核异常</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          healthStatusFilter === 'warning' ? 'bg-rose-700 text-rose-100' : 'bg-rose-50 text-rose-700 font-bold'
                        }`}>
                          {poiHealthStats.warning}
                        </span>
                      </button>
                    </div>

                    {/* 搜索与过滤 */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={poiSearchTerm}
                        onChange={(e) => {
                          setPoiSearchTerm(e.target.value);
                          setPoiCurrentPage(1);
                        }}
                        placeholder="搜索门店、地址、联系人、网格..."
                        className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                      />
                      {poiSearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setPoiSearchTerm('');
                            setPoiCurrentPage(1);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 单一、整洁、高对比度的受检网点明细表格 */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs shadow-2xs bg-white">
                    <div className="overflow-x-auto max-h-[420px]">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 sticky top-0 text-[11px] font-semibold z-10">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center text-slate-400">#</th>
                            <th className="py-2.5 px-3 w-48">受检门店 / 联系人</th>
                            {useAddressValidation ? (
                              <>
                                <th className="py-2.5 px-3">履约地址 (原始录入 vs 顺丰标准建议) 与服务体检结论</th>
                                <th className="py-2.5 px-3 w-36">末端网格</th>
                                <th className="py-2.5 px-3 w-28 text-center">采纳决策</th>
                              </>
                            ) : (
                              <>
                                <th className="py-2.5 px-3">履约地址</th>
                                <th className="py-2.5 px-3 w-36">联系方式</th>
                              </>
                            )}
                            <th className="py-2.5 px-3 w-20 text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {paginatedPoiRows.length === 0 ? (
                            <tr>
                              <td colSpan={useAddressValidation ? 6 : 4} className="py-12 text-center text-slate-400">
                                <Filter className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                                <div>未检索到符合条件的网点数据</div>
                                {healthStatusFilter !== 'all' && (
                                  <button
                                    type="button"
                                    onClick={() => setHealthStatusFilter('all')}
                                    className="mt-2 text-xs text-indigo-600 hover:underline cursor-pointer"
                                  >
                                    清除分流筛选
                                  </button>
                                )}
                              </td>
                            </tr>
                          ) : (
                            paginatedPoiRows.map((row, idx) => {
                              const globalIndex = (poiCurrentPage - 1) * poiPageSize + idx;
                              const isAccepted = row.isAccepted !== false;
                              const rowHealth = row.healthStatus || (row.suggestionType === 'perfect' ? 'perfect' : row.failReason ? 'warning' : 'improved');
                              
                              return (
                                <tr key={globalIndex} className="hover:bg-slate-50/80 transition">
                                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                                    {globalIndex + 1}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-1.5">
                                      {/* 健康度指示器点 */}
                                      <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                          rowHealth === 'perfect'
                                            ? 'bg-emerald-500'
                                            : rowHealth === 'warning'
                                            ? 'bg-rose-500 animate-pulse'
                                            : 'bg-indigo-500'
                                        }`}
                                        title={
                                          rowHealth === 'perfect'
                                            ? '免审通过'
                                            : rowHealth === 'warning'
                                            ? '阻断/待核异常'
                                            : '智能优化'
                                        }
                                      />
                                      <span className="font-bold text-slate-800">{row.contactCompany}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 pl-3.5">
                                      {row.contactName} · <span className="font-mono">{row.contactPhone}</span>
                                    </div>
                                  </td>

                                  {useAddressValidation ? (
                                    <>
                                      <td className="py-2.5 px-3">
                                        <div className="space-y-1.5">
                                          {/* 原始输入 */}
                                          <div className="flex items-start gap-1.5 text-[11px]">
                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-semibold shrink-0">
                                              原值
                                            </span>
                                            <span className={isAccepted ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}>
                                              {row.rawAddress || row.address}
                                            </span>
                                          </div>

                                          {/* 顺丰建议五级地址 */}
                                          <div className="flex items-start gap-1.5 text-[11px]">
                                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold shrink-0">
                                              建议
                                            </span>
                                            <div className="space-y-0.5 flex-1">
                                              <span className={isAccepted ? 'text-emerald-900 font-semibold' : 'text-slate-500'}>
                                                {row.cleanAddress || row.address}
                                              </span>
                                              {row.diffNote && (
                                                <div className="text-[10px] text-indigo-600">
                                                  💡 {row.diffNote}
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* 多服务微标签插槽 (Micro-Badges) */}
                                          {row.serviceBadges && row.serviceBadges.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                              {row.serviceBadges.map((badge, bIdx) => {
                                                let badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
                                                if (badge.type === 'success') {
                                                  badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                                } else if (badge.type === 'info') {
                                                  badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
                                                } else if (badge.type === 'warning') {
                                                  badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
                                                }
                                                return (
                                                  <span
                                                    key={bIdx}
                                                    className={`px-1.5 py-0.5 rounded text-[9px] border inline-flex items-center gap-0.5 ${badgeStyle}`}
                                                  >
                                                    {badge.label}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </td>

                                      {/* 末端网格 */}
                                      <td className="py-2.5 px-3">
                                        <div className="space-y-0.5">
                                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 inline-block">
                                            {row.gridCode || 'SF-GD-SZ0755-FT09'}
                                          </span>
                                          <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                                            {row.gridName || '顺丰综合网格'}
                                          </div>
                                          <div className="text-[9px] text-emerald-600 font-medium">
                                            置信度 {row.confidence || 98}%
                                          </div>
                                        </div>
                                      </td>

                                      {/* 采纳决策按钮 */}
                                      <td className="py-2.5 px-3 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleAcceptSuggestion(globalIndex)}
                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer border shadow-2xs ${
                                              isAccepted
                                                ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                            }`}
                                          >
                                            {isAccepted ? '✓ 已采纳' : '保留原值'}
                                          </button>
                                          <span className="text-[9px] text-slate-400">
                                            {isAccepted ? '推单采用建议' : '推单采用原值'}
                                          </span>
                                        </div>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                                        {row.rawAddress || row.address}
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                                        {row.contactPhone}
                                      </td>
                                    </>
                                  )}

                                  {/* 操作 */}
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditPoi(globalIndex)}
                                        className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                                      >
                                        编辑
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePoi(globalIndex)}
                                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                      >
                                        删除
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

                    {/* 分页控制栏：确保 1000+ 条数据轻盈翻页，丝滑不卡顿 */}
                    <div className="p-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 bg-slate-50/50">
                      <div>
                        当前展示第 <b>{(poiCurrentPage - 1) * poiPageSize + 1}</b> -{' '}
                        <b>{Math.min(poiCurrentPage * poiPageSize, filteredPoiRows.length)}</b> 条，筛选结果共{' '}
                        <b className="font-mono text-slate-800">{filteredPoiRows.length}</b> 条（总批次 {poiRows.length} 条）
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          disabled={poiCurrentPage === 1}
                          onClick={() => setPoiCurrentPage(1)}
                          className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer font-mono"
                          title="首页"
                        >
                          首页
                        </button>
                        <button
                          type="button"
                          disabled={poiCurrentPage === 1}
                          onClick={() => setPoiCurrentPage((p) => Math.max(1, p - 1))}
                          className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-mono text-slate-800">
                          {poiCurrentPage} / {poiTotalPages}
                        </span>
                        <button
                          type="button"
                          disabled={poiCurrentPage === poiTotalPages}
                          onClick={() => setPoiCurrentPage((p) => Math.min(poiTotalPages, p + 1))}
                          className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={poiCurrentPage === poiTotalPages}
                          onClick={() => setPoiCurrentPage(poiTotalPages)}
                          className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer font-mono"
                          title="尾页"
                        >
                          尾页
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 底部摘要与最终推单操作 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/90 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      {useAddressValidation ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-[11px]">
                            <b>免责透明承诺：</b>顺丰智能清洗与五级地址建议仅供参考，系统严格以您确认的采纳状态推单，绝不擅自篡改。
                          </span>
                        </>
                      ) : (
                        <>
                          <Info className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-[11px]">
                            共就绪 <b>{poiRows.length}</b> 处受检网点。如需提高通过率，可开启右上角【顺丰地址智能体检与网格预核】。
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setShowAddPoiModal(true)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg text-xs cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        添加网点
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartAutoDispatch(poiRows, uploadedFileName)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        立即下发顺丰通道 (共 {poiRows.length} 笔)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* 场景 C：未选择文件时的拖拽上传引导 */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer group ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/70 scale-[1.005]'
                      : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition">
                    {isUploading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {isUploading ? '正在读取并解析 Excel 网点数据...' : '点击上传网点数据 Excel，或将文件拖拽至此处'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    支持 .xlsx / .xls 格式；系统将自动识别地址与电话字段，无需多次跳转
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 text-[11px]">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateUpload();
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                    >
                      导入常规示例数据 (3 店)
                    </span>
                    <span className="text-slate-300">|</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerate1000Pois();
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-indigo-600" />
                      快速体验：生成 1,000 条海量数据 (含三态分流与分页)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= 右侧：下单记录看板 (占 4-5 列) ================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
            {/* 顶栏与状态筛选 */}
            <div className="space-y-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-xs">最近下单记录</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="text-[11px] text-slate-400">已完结下单批次</span>
              </div>

              {/* 快捷状态切换 Pill（全部、全部成功、部分成功、失败） */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {[
                  { key: 'all', label: `全部 (${statusCounts.all})` },
                  { key: '全部成功', label: `全部成功 (${statusCounts.allSuccess})` },
                  { key: '部分成功', label: `部分成功 (${statusCounts.partial})` },
                  { key: '失败', label: `失败 (${statusCounts.failed})` },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRecentStatusFilter(item.key)}
                    className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                      recentStatusFilter === item.key
                        ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 下单记录卡片列表 */}
            {filteredRecentDispatches.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                <div>未匹配到符合条件的下单记录</div>
                <div className="text-[11px] text-slate-400">在左侧完成首次下单后，即可在此查验结果与订单明细</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecentDispatches.map((dispatch) => {
                  const safeOrderCount = dispatch.orderCount ?? dispatch.totalCount ?? 0;
                  const safeSuccessCount = dispatch.successCount ?? 0;
                  const safeFailureCount = dispatch.failureCount ?? dispatch.failedCount ?? 0;
                  const successRatio =
                    safeOrderCount > 0
                      ? Math.round((safeSuccessCount / safeOrderCount) * 100)
                      : 0;
                  const failureRatio =
                    safeOrderCount > 0
                      ? Math.round((safeFailureCount / safeOrderCount) * 100)
                      : 0;

                  return (
                    <div
                      key={dispatch.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/40 hover:bg-white transition space-y-2.5 shadow-2xs group"
                    >
                      {/* 卡片顶栏：流水号与明确状态徽章 */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-indigo-700 text-xs">
                          {dispatch.id}
                        </span>
                        <StatusBadge status={dispatch.status} />
                      </div>

                      {/* 任务名与下发时间 */}
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {dispatch.taskName}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>渠道：{dispatch.channel}</span>
                          <span className="font-mono">{dispatch.createdAt}</span>
                        </div>
                      </div>

                      {/* 如果有失败订单，展示显性化的闭环处理卡片 */}
                      {safeFailureCount > 0 && (
                        <div className="p-2.5 bg-rose-50/80 border border-rose-200 rounded-lg space-y-2">
                          <div className="flex items-start gap-1.5 text-rose-800 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span className="leading-tight">
                              存在 <b className="text-rose-700 font-bold">{safeFailureCount} 笔</b>失败订单，支持下载明细修正后重新下单
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleDownloadFailedOrders(dispatch)}
                              className="w-full px-2 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded font-semibold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                              title="下载失败订单明细 CSV"
                            >
                              <Download className="w-3 h-3" />
                              下载失败明细
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModifyAndReorder(dispatch)}
                              className="w-full px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                              title="一键提取并载入工作台修改重新下单"
                            >
                              <RefreshCw className="w-3 h-3" />
                              修改后重下
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 成功/失败统计进度条 */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-medium">
                            成功 <span className="text-emerald-700 font-bold">{safeSuccessCount}</span> / 失败{' '}
                            <span className={safeFailureCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                              {safeFailureCount}
                            </span>{' '}
                            / 共 {safeOrderCount} 单
                          </span>
                          <span className="font-mono text-indigo-600 font-bold">{successRatio}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-500"
                            style={{ width: `${successRatio}%` }}
                          />
                          {safeFailureCount > 0 && (
                            <div
                              className="bg-rose-500 h-full"
                              style={{
                                width: `${failureRatio}%`,
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* 核心操作按钮 */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          {(dispatch.status === '已保存数据' || dispatch.status === '待下发') && (
                            <button
                              type="button"
                              onClick={() => executeDispatch(dispatch.id)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Send className="w-3 h-3" />
                              立即下发
                            </button>
                          )}
                          {(dispatch.status === '正在下发中' || dispatch.status === '下发中') && (
                            <span className="px-2 py-0.5 text-sky-700 bg-sky-50 border border-sky-200 rounded font-semibold text-[11px] flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              正在下发中...
                            </span>
                          )}
                          {dispatch.failureCount > 0 && dispatch.status !== '已保存数据' && dispatch.status !== '待下发' && (
                            <span className="text-[10px] text-slate-400">已提供闭环操作</span>
                          )}
                        </div>

                        {/* 查看订单明细（清晰指向订单明细，绝不混淆为工单跟踪） */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDetailDispatch(dispatch);
                            setDetailOrderFilter('all');
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer ml-auto"
                        >
                          <span>查看订单明细</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 底部：查看全部历史下单记录 */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>查看全部历史下单记录 ({tenantDispatches.length})</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 下单记录详情模态框 (包含订单明细) ================= */}
      <Modal
        isOpen={!!activeDetailDispatch}
        onClose={() => setActiveDetailDispatch(null)}
        title={activeDetailDispatch ? `下单记录详情 · 订单明细清单` : ''}
        maxWidth="max-w-4xl"
      >
        {activeDetailDispatch && (
          <div className="space-y-4 text-xs">
            {/* 顶栏概要信息 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">下单流水号</span>
                <span className="font-mono font-bold text-indigo-700">{activeDetailDispatch.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">所属业务任务</span>
                <span className="font-semibold text-slate-900 truncate block">{activeDetailDispatch.taskName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">下发状态</span>
                <div className="mt-0.5">
                  <StatusBadge status={activeDetailDispatch.status} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">下单时间</span>
                <span className="font-mono text-slate-700">{activeDetailDispatch.createdAt}</span>
              </div>
            </div>

            {/* 失败订单告警与一键处理引导区（核心：部分成功时支持下载失败明细与修改后重新下单） */}
            {activeDetailDispatch.failureCount > 0 && (
              <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-900 text-sm">
                        {activeDetailDispatch.status === '部分成功'
                          ? `下单结果：部分成功（成功 ${activeDetailDispatch.successCount} 单 / 失败 ${activeDetailDispatch.failureCount} 单）`
                          : `下单结果：${activeDetailDispatch.status}（共 ${activeDetailDispatch.failureCount} 笔订单下发失败）`}
                      </span>
                      <StatusBadge status={activeDetailDispatch.status} />
                    </div>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      常见原因包括：联系人电话有误、地址信息不完整或超出顺丰网格覆盖半径。系统提供两大核心闭环操作：
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 pt-0.5 pl-11">
                  <button
                    type="button"
                    onClick={() => handleDownloadFailedOrders(activeDetailDispatch)}
                    className="px-4 py-2 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    title="下载包含失败原因与修改建议的 CSV 明细表"
                  >
                    <Download className="w-4 h-4" />
                    下载失败订单明细 (.csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModifyAndReorder(activeDetailDispatch)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    title="一键提取失败订单至工作台修改后重新下单"
                  >
                    <RefreshCw className="w-4 h-4" />
                    修改后重新下单
                  </button>
                </div>
              </div>
            )}

            {/* 订单明细列表过滤器 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs">本次下单生成的订单列表</span>
                <span className="text-[11px] text-slate-400">
                  (共 {activeDispatchOrders.length} 笔订单)
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setDetailOrderFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition ${
                    detailOrderFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  全部 ({activeDispatchOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDetailOrderFilter('success')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition ${
                    detailOrderFilter === 'success'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  成功下发 ({activeDispatchOrders.filter((o) => !o.failureReason && o.status !== 'cancelled').length})
                </button>
                <button
                  type="button"
                  onClick={() => setDetailOrderFilter('failed')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition ${
                    detailOrderFilter === 'failed'
                      ? 'bg-white text-rose-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  下发失败 ({activeDispatchOrders.filter((o) => o.failureReason || o.status === 'cancelled').length})
                </button>
              </div>
            </div>

            {/* 订单明细表格 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">订单编号</th>
                    <th className="py-2.5 px-3">受检网点名称</th>
                    <th className="py-2.5 px-3">现场联系人 & 电话</th>
                    <th className="py-2.5 px-3">详细履约地址</th>
                    <th className="py-2.5 px-3 text-center">状态</th>
                    <th className="py-2.5 px-3">处理信息 / 失败原因</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDetailOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        未匹配到符合条件的订单
                      </td>
                    </tr>
                  ) : (
                    filteredDetailOrders.map((ord) => {
                      const isFail = !!ord.failureReason || ord.status === 'cancelled' || ord.status === '下发失败';
                      return (
                        <tr key={ord.id} className={`hover:bg-slate-50/50 ${isFail ? 'bg-rose-50/20' : ''}`}>
                          <td className="py-2.5 px-3 font-mono font-medium text-indigo-700">{ord.id}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{ord.contactCompany}</td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <div>{ord.contactName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{ord.contactPhone}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={ord.address}>
                            {ord.address}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isFail ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold text-[10px]">
                                下发失败
                              </span>
                            ) : (
                              <StatusBadge status={ord.status} />
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {ord.failureReason ? (
                              <div className="text-rose-600 text-[11px] flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{ord.failureReason}</span>
                              </div>
                            ) : ord.channelOrderId ? (
                              <div className="font-mono text-[11px] text-slate-600">
                                渠道单号: {ord.channelOrderId}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">等待渠道调度</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 底部操作按钮 */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadAllOrders(activeDetailDispatch)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  导出全部订单 (.csv)
                </button>
                {activeDetailDispatch.failureCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleDownloadFailedOrders(activeDetailDispatch)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载失败订单明细 (.csv)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeDetailDispatch.failureCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleModifyAndReorder(activeDetailDispatch)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    修改后重新下单
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveDetailDispatch(null)}
                  className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer text-xs"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= 全部历史下单记录查询弹窗 ================= */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="全部历史下单记录"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4 text-xs">
          {/* 筛选控制器 */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索流水号、任务名..."
                  value={historySearchTerm}
                  onChange={(e) => {
                    setHistorySearchTerm(e.target.value);
                    setHistoryCurrentPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs w-52 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={historyTaskFilter}
                onChange={(e) => {
                  setHistoryTaskFilter(e.target.value);
                  setHistoryCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">全部任务</option>
                {readyTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                value={historyStatusFilter}
                onChange={(e) => {
                  setHistoryStatusFilter(e.target.value);
                  setHistoryCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">全部状态</option>
                <option value="下发中">下发中</option>
                <option value="全部成功">全部成功</option>
                <option value="部分成功">部分成功</option>
                <option value="失败">失败</option>
              </select>
            </div>

            <div className="text-slate-500 text-[11px]">
              共 <span className="font-bold text-slate-900">{filteredHistoryDispatches.length}</span> 条下单记录
            </div>
          </div>

          {/* 表格 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">下单流水号</th>
                    <th className="py-2.5 px-3">所属任务</th>
                    <th className="py-2.5 px-3">渠道</th>
                    <th className="py-2.5 px-3 text-center">下单总数</th>
                    <th className="py-2.5 px-3 text-center">成功 / 失败</th>
                    <th className="py-2.5 px-3 text-center">下发状态</th>
                    <th className="py-2.5 px-3">下单时间</th>
                    <th className="py-2.5 px-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedHistoryDispatches.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        未匹配到符合条件的下单记录
                      </td>
                    </tr>
                  ) : (
                    paginatedHistoryDispatches.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">
                          {d.id}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{d.taskName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{d.channel}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                          {d.orderCount}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="text-emerald-700 font-semibold">{d.successCount}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className={d.failureCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                            {d.failureCount}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{d.createdAt}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {d.status === '已保存数据' || d.status === '待下发' ? (
                              <button
                                type="button"
                                onClick={() => executeDispatch(d.id)}
                                className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                              >
                                立即下发
                              </button>
                            ) : null}
                            {d.failureCount > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFailedOrders(d)}
                                  className="text-rose-600 hover:underline font-medium cursor-pointer"
                                >
                                  下载失败明细
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleModifyAndReorder(d)}
                                  className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                                >
                                  修改重下
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setShowHistoryModal(false);
                                setActiveDetailDispatch(d);
                                setDetailOrderFilter('all');
                              }}
                              className="text-slate-700 hover:text-indigo-600 font-bold cursor-pointer"
                            >
                              订单明细
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {historyTotalPages > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 bg-slate-50/50">
                <div>
                  显示 {(historyCurrentPage - 1) * historyPageSize + 1} -{' '}
                  {Math.min(historyCurrentPage * historyPageSize, filteredHistoryDispatches.length)} 条，共{' '}
                  {filteredHistoryDispatches.length} 条
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={historyCurrentPage === 1}
                    onClick={() => setHistoryCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono">
                    {historyCurrentPage} / {historyTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={historyCurrentPage === historyTotalPages}
                    onClick={() => setHistoryCurrentPage((p) => Math.min(historyTotalPages, p + 1))}
                    className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer text-xs"
            >
              关闭
            </button>
          </div>
        </div>
      </Modal>

      {/* ================= 网点编辑弹窗 ================= */}
      <Modal
        isOpen={editingPoiIndex !== null && !!editingPoiData}
        onClose={() => {
          setEditingPoiIndex(null);
          setEditingPoiData(null);
        }}
        title="修改受检网点点位信息"
        maxWidth="max-w-lg"
      >
        {editingPoiData && (
          <div className="space-y-4 text-xs">
            {editingPoiData.failReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>原下发失败原因：</span>
                </div>
                <div className="text-[11px] leading-relaxed pl-5">{editingPoiData.failReason}</div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">受检网点 / 客户公司名称</label>
                <input
                  type="text"
                  value={editingPoiData.contactCompany}
                  onChange={(e) => setEditingPoiData({ ...editingPoiData, contactCompany: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="如：顺意优选·深圳南山科技园店"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">现场联系人姓名</label>
                  <input
                    type="text"
                    value={editingPoiData.contactName}
                    onChange={(e) => setEditingPoiData({ ...editingPoiData, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="如：张店长"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">联系人电话 (11位手机号)</label>
                  <input
                    type="text"
                    value={editingPoiData.contactPhone}
                    onChange={(e) => setEditingPoiData({ ...editingPoiData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    placeholder="如：13811223344"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">详细履约地址 (具体至门牌号)</label>
                <textarea
                  rows={3}
                  value={editingPoiData.address}
                  onChange={(e) => setEditingPoiData({ ...editingPoiData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                  placeholder="请详细录入省市区街道及建筑物门牌号，便于顺丰小哥精准上门"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingPoiIndex(null);
                  setEditingPoiData(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSavePoi}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer shadow-2xs"
              >
                保存修正
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= 新增网点弹窗 ================= */}
      <Modal
        isOpen={showAddPoiModal}
        onClose={() => setShowAddPoiModal(false)}
        title="添加新的受检网点点位"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">受检网点 / 客户公司名称</label>
              <input
                type="text"
                value={newPoiData.contactCompany}
                onChange={(e) => setNewPoiData({ ...newPoiData, contactCompany: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="如：顺意优选·深圳西丽万科云城店"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">现场联系人姓名</label>
                <input
                  type="text"
                  value={newPoiData.contactName}
                  onChange={(e) => setNewPoiData({ ...newPoiData, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="如：王经理"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">联系人电话</label>
                <input
                  type="text"
                  value={newPoiData.contactPhone}
                  onChange={(e) => setNewPoiData({ ...newPoiData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  placeholder="如：13712345678"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">详细履约地址</label>
              <textarea
                rows={3}
                value={newPoiData.address}
                onChange={(e) => setNewPoiData({ ...newPoiData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                placeholder="广东省深圳市南山区打石一路万科云城设计公社B区101"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddPoiModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveAddPoi}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer shadow-2xs"
            >
              确认添加
            </button>
          </div>
        </div>
      </Modal>

      {/* ================= 增值校验服务插件配置弹窗 ================= */}
      <Modal
        isOpen={showServiceConfigModal}
        onClose={() => setShowServiceConfigModal(false)}
        title="已启用的顺丰增值校验服务插件"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>跨服务通用健康协议 (Universal Health Protocol)</span>
            </div>
            <p className="text-[11px] text-indigo-800/90">
              各专项能力（地址标准化、网格覆盖核验、号码合规、冷链合规等）的检测结果，已统一归一化为【免审通过】、【智能优化】与【待核异常】三态，并通过表格微标签轻量呈现，无需为每个服务开设独立看板。
            </p>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {/* 服务 1：顺丰五级地址智能校验 */}
            <div className="p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">顺丰五级地址智能标准化</span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">核心推荐</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  自动补齐省/市/区/街道/门牌五级行政规范，消除错别字，提升末端顺丰小哥找店准确率。
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={activeServices.addressValidation}
                  onChange={(e) => {
                    setActiveServices({ ...activeServices, addressValidation: e.target.checked });
                    setUseAddressValidation(e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 服务 2：末端网格覆盖与运力预核 */}
            <div className="p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">顺丰网格末端覆盖与时效预核</span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">运行中</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  自动匹配专属末端网格编码（如 SF-GD-SZ0755），核实是否在小哥 30 分钟标准履约半径内。
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={activeServices.gridVerification}
                  onChange={(e) => setActiveServices({ ...activeServices, gridVerification: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 服务 3：联系电话合规性校验 */}
            <div className="p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">联系人手机号有效性校验</span>
                  <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded text-[9px] font-bold">已启用</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  校验 11 位大陆有效手机号段与座机格式，阻断空号、连号等无法致电联络的废单。
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={activeServices.phoneValidation}
                  onChange={(e) => setActiveServices({ ...activeServices, phoneValidation: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 服务 4：生鲜温控/特殊冷链履约合规性 (预留扩展) */}
            <div className="p-3.5 flex items-start justify-between gap-3 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">生鲜温控/特种运力核验插件</span>
                  <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-medium">扩展插件</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  针对需冷链、恒温或特殊箱包的外勤点位，预检网格冷运运力配给与温控箱支持。
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={activeServices.temperatureColdChain}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setActiveServices({ ...activeServices, temperatureColdChain: checked });
                    showToast(checked ? '已开启冷链运力核验插件' : '已关闭冷链运力核验插件', '跨服务健康分流协议将自动吸纳该插件体检结论', 'info');
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setShowServiceConfigModal(false)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer text-xs shadow-2xs"
            >
              完成配置
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
