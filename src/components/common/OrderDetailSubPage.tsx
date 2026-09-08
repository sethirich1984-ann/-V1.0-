import React, { useState } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Check,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Compass,
  FileCheck,
  Image as ImageIcon,
  Video,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Share2,
  Download,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Phone,
  User,
  Radio,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  OrderItem,
  MilestoneStepItem,
  PhotoEvidenceItem,
  BranchDecisionItem,
  SurveyQuestionItem,
  VideoEvidenceItem,
  RoutingLogItem,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { Lightbox } from './Lightbox';
import { Modal } from './Modal';

interface OrderDetailSubPageProps {
  order: OrderItem;
  onBack: () => void;
  userRole?: 'platform_op' | 'tenant_admin';
}

export const OrderDetailSubPage: React.FC<OrderDetailSubPageProps> = ({
  order,
  onBack,
  userRole = 'tenant_admin',
}) => {
  const {
    simulateStepOrder,
    auditPassOrder,
    auditRejectOrder,
    showToast,
    updateOrder,
  } = useApp();

  // Active Tab: 取证项目 | 异常情况 | 订单路由
  const [activeTab, setActiveTab] = useState<'evidence' | 'exceptions' | 'routing'>('evidence');

  // Address Masking state
  const [isAddressVisible, setIsAddressVisible] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Lightbox for Photos
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Audit Modals State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('门牌照片反光未清晰拍摄到室号门牌，要求现场小哥补拍');
  const [suggestedAction, setSuggestedAction] = useState('请于街角立面补拍无反光正脸门牌及门口360度全景视频');

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast('已复制', `${label}已复制到剪贴板`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleAddressVisibility = () => {
    const next = !isAddressVisible;
    setIsAddressVisible(next);
    if (next) {
      showToast('地址已解密', '数据安全审计已记录此敏感信息查看操作', 'info');
    }
  };

  const openPhotoPreview = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  // Mask address helper
  const renderMaskedAddress = (raw: string) => {
    if (isAddressVisible) return raw;
    if (raw.length <= 8) return '********';
    return raw.substring(0, 6) + '********' + (raw.length > 14 ? raw.substring(raw.length - 4) : '');
  };

  // Extract or Fallback Milestones
  const milestones: MilestoneStepItem[] = order.milestones || [
    { title: '任务开始', time: order.operateTimes?.processing_start || order.createdAt, state: 'finished' },
    {
      title: '店铺是在楼内,街边还是商场',
      time: order.operateTimes?.processing_start || '2026-09-07 13:43:57',
      decisionTag: '街边',
      state: 'finished',
    },
    {
      title: '是否能找到目标门店',
      time: order.operateTimes?.processing_complete || '2026-09-07 15:04:24',
      decisionTag: '可以找到',
      state: 'finished',
    },
    {
      title: '是否可以拍摄店内场景',
      time: order.operateTimes?.inner_auditing_waiting || '2026-09-07 15:11:17',
      decisionTag: '可以拍摄店内场景',
      state: 'finished',
    },
    {
      title: '已完成',
      time: order.operateTimes?.completed || '2026-09-08 13:51:30',
      state: order.status === 'completed' ? 'finished' : 'active',
    },
  ];

  // Extract or Fallback Photo Groups
  const photoGroups: PhotoEvidenceItem[] = order.photoGroups || [
    {
      id: 'PG-01',
      title: '【名称】写字楼/园区/小区/村子/商场',
      currentCount: order.evidenceData?.photos?.length || 3,
      maxCount: 3,
      status: '合格',
      auditRemark: '该取证项未配置审核调研问题',
      photos: (order.evidenceData?.photos || [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
      ]).map((url, i) => ({
        url,
        label: `凭证 #${i + 1}`,
        note: i === 0 ? '无名称' : '备注:无备注信息',
        status: '合格',
      })),
    },
    {
      id: 'PG-02',
      title: '拍摄门牌号',
      currentCount: 1,
      maxCount: 1,
      status: '合格',
      auditRemark: '该取证项未配置审核调研问题',
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
          label: '门头门牌',
          note: '无门牌',
          status: '合格',
        },
      ],
    },
  ];

  // Extract or Fallback Branch Decisions
  const branchDecisions: BranchDecisionItem[] = order.branchDecisions || [
    {
      id: 'BD-01',
      question: '店铺是在楼内还是街边还是商场',
      selectedOption: '街边',
      options: ['街边', '楼内(小区、写字楼等)', '商场'],
      status: '合格',
      surveyRemark: '该取证项未配置审核调研问题',
    },
    {
      id: 'BD-02',
      question: '商场内是否能找到目标门店',
      selectedOption: '可以找到',
      options: ['找不到', '可以找到'],
      status: '合格',
      surveyRemark: '该取证项未配置审核调研问题',
    },
    {
      id: 'BD-03',
      question: '是否可以拍摄店内场景',
      selectedOption: '可以拍摄店内场景',
      options: ['可以拍摄店内场景', '不可以拍摄店内场景'],
      status: '合格',
      surveyRemark: '该取证项未配置审核调研问题',
    },
  ];

  // Extract or Fallback Survey Questions
  const surveyQuestions: SurveyQuestionItem[] = order.surveyQuestions || [
    {
      id: 'SQ-01',
      stepName: '门店经营状态',
      question: '1、门店经营状态分类',
      selectedOption: '正常营业-【有】对应独立门头',
      options: [
        '正常营业-【有】对应独立门头',
        '正常营业-【无】对应独立门头',
        '已关闭/歇业',
        '装修',
        '搬迁',
        '其他',
      ],
      status: '合格',
      surveyRemark: '门店招牌完好、正常营业接待',
    },
  ];

  // Extract or Fallback Video Groups
  const videoGroups: VideoEvidenceItem[] = order.videoGroups || [
    {
      id: 'VG-01',
      title: '【内景】【门头】【门口360度】',
      url:
        order.evidenceData?.videos?.[0]?.url ||
        'https://assets.mixkit.co/videos/preview/mixkit-supermarket-shelves-full-of-food-items-41221-large.mp4',
      duration: '00:45',
      status: '合格',
      auditRemark: '现场360度环视完整清晰，无逆光遮挡',
    },
  ];

  // Extract or Fallback Routing Logs
  const routingLogs: RoutingLogItem[] = order.routingLogs || [
    {
      id: 'RL-15',
      time: '09-08 13:51',
      title: '已完成',
      subTitle: '订单已完成',
      statusType: 'success',
      iconType: 'completed',
    },
    {
      id: 'RL-14',
      time: '09-08 13:51',
      title: '外审中',
      subTitle: '订单正常完成审核通过',
      statusType: 'success',
      iconType: 'outer_audit',
    },
    {
      id: 'RL-13',
      time: '09-08 13:32',
      title: '外审中',
      subTitle: '订单正在等待被审核',
      statusType: 'info',
      iconType: 'outer_audit',
    },
    {
      id: 'RL-12',
      time: '09-08 13:32',
      title: '内审中',
      subTitle: '订单正常完成审核通过',
      statusType: 'success',
      iconType: 'inner_audit',
    },
    {
      id: 'RL-11',
      time: '09-08 13:31',
      title: '待审核',
      subTitle: '待审核',
      statusType: 'neutral',
      iconType: 'inner_audit',
    },
    {
      id: 'RL-10',
      time: '09-08 13:31',
      title: '处理中',
      subTitle: '订单执行完成，正常提交成功',
      statusType: 'success',
      iconType: 'processing',
    },
    {
      id: 'RL-09',
      time: '09-07 15:05',
      title: '处理中',
      subTitle: '开始执行订单',
      statusType: 'info',
      iconType: 'processing',
    },
    {
      id: 'RL-08',
      time: '09-07 13:41',
      title: '内审中',
      subTitle: '订单正常完成审核被驳回',
      statusType: 'reject',
      iconType: 'inner_audit',
    },
    {
      id: 'RL-07',
      time: '09-07 13:33',
      title: '待审核',
      subTitle: '待审核',
      statusType: 'neutral',
      iconType: 'inner_audit',
    },
    {
      id: 'RL-06',
      time: '09-07 13:33',
      title: '处理中',
      subTitle: '订单执行完成，正常提交成功',
      statusType: 'success',
      iconType: 'processing',
    },
    {
      id: 'RL-05',
      time: '09-07 13:30',
      title: '进行定位打卡操作',
      subTitle: `地址为【${order.locationInfo?.address || order.address}】`,
      statusType: 'info',
      iconType: 'location',
    },
    {
      id: 'RL-04',
      time: '09-07 12:11',
      title: '处理中',
      subTitle: '开始执行订单',
      statusType: 'info',
      iconType: 'processing',
    },
    {
      id: 'RL-03',
      time: '09-04 16:14',
      title: '已接单',
      subTitle: '订单已接单',
      statusType: 'success',
      iconType: 'processing',
    },
    {
      id: 'RL-02',
      time: '09-04 16:09',
      title: '待接单',
      subTitle: '订单进入任务市场曝光，等待接单',
      statusType: 'neutral',
      iconType: 'created',
    },
    {
      id: 'RL-01',
      time: '09-04 16:09',
      title: '已下单',
      subTitle: '订单下单成功',
      statusType: 'neutral',
      iconType: 'created',
    },
  ];

  // Confirm Reject
  const handleConfirmReject = () => {
    auditRejectOrder(order.id, {
      stage: userRole === 'platform_op' ? '内审质检' : '客户外审',
      reason: rejectReason.trim() || '照片不合规要求重新拍摄',
      suggestedAction: suggestedAction.trim(),
    });
    setIsRejectModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-16">
      {/* 1. 面包屑与顶部操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回列表</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{userRole === 'platform_op' ? '运营中台' : '商户工作台'}</span>
            <span>/</span>
            <span>订单详情</span>
            <span>/</span>
            <span className="font-mono font-bold text-slate-800">{order.id}</span>
          </div>
        </div>

        {/* 右侧两端协同核心操作 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 平台内审操作区 (针对平台运营) */}
          {userRole === 'platform_op' && order.status === 'inner_auditing_waiting' && (
            <>
              <button
                type="button"
                onClick={() => auditPassOrder(order.id, 'inner')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>平台内审通过</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>内审驳回</span>
              </button>
            </>
          )}

          {/* 租户外审验收操作区 (针对租户商户) */}
          {order.status === 'outer_auditing_waiting' && (
            <>
              <button
                type="button"
                onClick={() => auditPassOrder(order.id, 'outer')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>外审验收通过</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>要求补充核验</span>
              </button>
            </>
          )}

          {/* 模拟推进下一阶段 */}
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => simulateStepOrder(order.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="模拟流转到下一个节点"
            >
              <Play className="w-3.5 h-3.5" />
              <span>推进节点</span>
            </button>
          )}

          {/* 导出报告 */}
          <button
            type="button"
            onClick={() => showToast('报告导出成功', '已生成现场取证凭证 PDF 归档文件', 'success')}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>导出凭证</span>
          </button>
        </div>
      </div>

      {/* 2. 订单详情 Header 头部卡片 (1:1 还原截图顶部) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        {/* 标题行：订单详情 + 状态 + 业务类型 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-4 bg-indigo-600 rounded-full inline-block"></span>
              订单详情
            </h2>
            <StatusBadge status={order.status} />
            <span className="px-2 py-0.5 border border-rose-400 text-rose-600 rounded text-[11px] font-medium bg-rose-50/50">
              {order.orderTypeTag || '快速下单'}
            </span>
          </div>

          <div className="text-right text-xs text-slate-400">
            <span>创建时间：<strong className="font-mono text-slate-600">{order.createdAt}</strong></span>
          </div>
        </div>

        {/* 两列元数据对齐网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-xs">
          {/* 左列 */}
          <div className="space-y-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 w-24 shrink-0">订单号：</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                <span>{order.id}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(order.id, '订单号')}
                  className="text-slate-400 hover:text-indigo-600 p-0.5 transition cursor-pointer"
                  title="复制订单号"
                >
                  {copiedField === '订单号' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 w-24 shrink-0">目标门店：</span>
              <span className="font-semibold text-slate-900">{order.contactCompany}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 w-24 shrink-0">任务结束时间：</span>
              <span className="font-mono text-slate-700">{order.taskEndTime || '2026-09-12 23:59:59'}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 w-24 shrink-0">经度：</span>
              <span className="font-mono text-slate-700">
                {order.locationInfo?.longitude?.toFixed(6) || '121.529825'}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 w-24 shrink-0">上门时效要求：</span>
              <span className="text-slate-800 font-medium">{order.slaRequirement || '7个自然日'}</span>
            </div>
          </div>

          {/* 右列 */}
          <div className="space-y-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 w-24 shrink-0">目标地址：</span>
              <div className="flex items-center gap-2 flex-1">
                <span className="font-medium text-slate-800 leading-relaxed">
                  {renderMaskedAddress(order.address)}
                </span>
                <button
                  type="button"
                  onClick={handleToggleAddressVisibility}
                  className="text-slate-400 hover:text-indigo-600 p-0.5 transition cursor-pointer shrink-0"
                  title={isAddressVisible ? '隐藏敏感地址' : '点击解密查看完整地址'}
                >
                  {isAddressVisible ? <EyeOff className="w-3.5 h-3.5 text-indigo-600" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 w-24 shrink-0">任务开始时间：</span>
              <span className="font-mono text-slate-700">{order.taskStartTime || '2026-09-04 15:00:00'}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 w-24 shrink-0">poi-id：</span>
              <span className="font-mono font-semibold text-slate-800">{order.poiId || 'B0MBB9WXO9'}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 w-24 shrink-0">纬度：</span>
              <span className="font-mono text-slate-700">
                {order.locationInfo?.latitude?.toFixed(6) || '31.273175'}
              </span>
            </div>
          </div>
        </div>

        {/* 履约网点与小哥速览 */}
        {order.routeInfo && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>执行网点：<strong className="text-slate-800">{order.routeInfo.stationName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>顺丰现场员：<strong className="text-slate-800">{order.routeInfo.courierName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{order.routeInfo.courierPhone}</span>
              </div>
            </div>

            {order.locationInfo && (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>打卡定位偏差 {order.locationInfo.accuracyDeviationMeters || 4.8} 米 (合规)</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. 三大 Tab 导航栏 (取证项目 / 异常情况 / 订单路由) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex items-center border-b border-slate-200 px-4 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-5 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'evidence'
                ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            取证项目
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exceptions')}
            className={`py-3 px-5 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exceptions'
                ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>异常情况</span>
            {order.auditRejectCount && order.auditRejectCount > 0 ? (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-mono">
                {order.auditRejectCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('routing')}
            className={`py-3 px-5 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'routing'
                ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            订单路由
          </button>
        </div>

        {/* Tab 内容区 */}
        <div className="p-5">
          {/* TAB 1: 取证项目 (1:1 还原截图 1) */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* 任务关键流程 (横向进度节点) */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  任务关键流程
                </h3>

                <div className="pt-2 pb-1 overflow-x-auto">
                  <div className="flex items-start justify-between min-w-[720px] relative px-4">
                    {/* 连接横线 */}
                    <div className="absolute left-6 right-6 top-3 h-0.5 bg-emerald-300 -z-0" />

                    {milestones.map((m, idx) => (
                      <div key={idx} className="flex flex-col items-center relative z-10 text-center w-36">
                        {/* 绿圆点 */}
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs ring-2 ring-emerald-100">
                          ✓
                        </div>

                        {/* 标题 */}
                        <span className="mt-2 text-xs font-semibold text-slate-800 leading-tight">
                          {m.title}
                        </span>

                        {/* 分支决策红字 */}
                        {m.decisionTag && (
                          <span className="text-[11px] font-bold text-rose-600 mt-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {m.decisionTag}
                          </span>
                        )}

                        {/* 时间戳 */}
                        <span className="font-mono text-[10px] text-slate-400 mt-1">
                          {m.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 取证项 1: 拍摄照片 (写字楼/园区/小区/村子/商场) */}
              {photoGroups[0] && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      取证项1: {photoGroups[0].title} ({photoGroups[0].photos.length}/{photoGroups[0].maxCount})
                    </h4>
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-semibold rounded">
                      {photoGroups[0].status}
                    </span>
                  </div>

                  {/* 照片展示网格 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                    {photoGroups[0].photos.map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          openPhotoPreview(
                            photoGroups[0].photos.map((x) => x.url),
                            idx
                          )
                        }
                        className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 cursor-pointer hover:border-indigo-500 transition-all shadow-2xs"
                      >
                        <img
                          src={p.url}
                          alt={p.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        {/* 蓝色角标合格 */}
                        <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow-xs">
                          {p.status}
                        </div>
                        {/* 底部文字 */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-white text-[10px] truncate">
                          {p.note || '无名称'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 审核调研说明 */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-400">审核调研（只读）：</span>
                    <span>{photoGroups[0].auditRemark || '该取证项未配置审核调研问题'}</span>
                  </div>
                </div>
              )}

              {/* 取证项 2: 分支判断 (店铺是在楼内还是街边还是商场) */}
              {branchDecisions[0] && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-600" />
                      分支判断：{branchDecisions[0].question}
                    </h4>
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-semibold rounded">
                      {branchDecisions[0].status}
                    </span>
                  </div>

                  {/* 单选组展示 */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {branchDecisions[0].options.map((opt, idx) => {
                      const isSelected = opt === branchDecisions[0].selectedOption;
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                            isSelected
                              ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* 审核调研说明 */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-400">审核调研（只读）：</span>
                    <span>{branchDecisions[0].surveyRemark || '该取证项未配置审核调研问题'}</span>
                  </div>
                </div>
              )}

              {/* 取证项 3: 拍摄照片 (拍摄门牌号) */}
              {photoGroups[1] && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      取证项1: {photoGroups[1].title} ({photoGroups[1].photos.length}/{photoGroups[1].maxCount})
                    </h4>
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-semibold rounded">
                      {photoGroups[1].status}
                    </span>
                  </div>

                  {/* 照片展示 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                    {photoGroups[1].photos.map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          openPhotoPreview(
                            photoGroups[1].photos.map((x) => x.url),
                            idx
                          )
                        }
                        className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 cursor-pointer hover:border-indigo-500 transition-all shadow-2xs"
                      >
                        <img
                          src={p.url}
                          alt={p.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow-xs">
                          {p.status}
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-white text-[10px] truncate">
                          {p.note || '无门牌'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-400">审核调研（只读）：</span>
                    <span>{photoGroups[1].auditRemark || '该取证项未配置审核调研问题'}</span>
                  </div>
                </div>
              )}

              {/* 取证项 4: 分支判断 (商场内是否能找到目标门店) */}
              {branchDecisions[1] && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-600" />
                      分支判断：{branchDecisions[1].question}
                    </h4>
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-semibold rounded">
                      {branchDecisions[1].status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {branchDecisions[1].options.map((opt, idx) => {
                      const isSelected = opt === branchDecisions[1].selectedOption;
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                            isSelected
                              ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-400">审核调研（只读）：</span>
                    <span>{branchDecisions[1].surveyRemark || '该取证项未配置审核调研问题'}</span>
                  </div>
                </div>
              )}

              {/* 取证项 5: 问卷调查 (步骤名称: 门店经营状态) */}
              {surveyQuestions[0] && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        问卷调查 · 步骤名称: {surveyQuestions[0].stepName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {surveyQuestions[0].question}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-semibold rounded">
                      {surveyQuestions[0].status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {surveyQuestions[0].options.map((opt, idx) => {
                      const isSelected = opt === surveyQuestions[0].selectedOption;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs flex items-center gap-2.5 transition ${
                            isSelected
                              ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-400">核验结论：</span>
                    <span className="text-slate-800 font-medium">{surveyQuestions[0].surveyRemark}</span>
                  </div>
                </div>
              )}

              {/* 取证项 6: 分支判断 (是否可以拍摄店内场景) */}
              {branchDecisions[2] && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-600" />
                      分支判断：{branchDecisions[2].question}
                    </h4>
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-semibold rounded">
                      {branchDecisions[2].status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {branchDecisions[2].options.map((opt, idx) => {
                      const isSelected = opt === branchDecisions[2].selectedOption;
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                            isSelected
                              ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-400">审核调研（只读）：</span>
                    <span>{branchDecisions[2].surveyRemark || '该取证项未配置审核调研问题'}</span>
                  </div>
                </div>
              )}

              {/* 取证项 7: 视频录制 (【内景】【门头】【门口360度】) */}
              {videoGroups[0] && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-indigo-600" />
                      取证项1: {videoGroups[0].title}
                    </h4>
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-semibold rounded">
                      {videoGroups[0].status}
                    </span>
                  </div>

                  <div className="max-w-xl">
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video relative group">
                      <video
                        controls
                        className="w-full h-full object-cover"
                        src={videoGroups[0].url}
                      >
                        您的浏览器不支持视频播放
                      </video>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
                      <span>视频采集时长: <strong className="font-mono text-slate-700">{videoGroups[0].duration}</strong></span>
                      <span>质量标注: {videoGroups[0].auditRemark}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 异常情况 */}
          {activeTab === 'exceptions' && (
            <div className="space-y-4">
              {/* 驳回历史记录 */}
              {order.auditRejectHistory && order.auditRejectHistory.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>质检驳回与复核历史记录 ({order.auditRejectHistory.length} 次驳回)</span>
                  </h4>
                  {order.auditRejectHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold">
                            {item.stage}
                          </span>
                          <span className="font-semibold text-slate-900">质检员：{item.auditor}</span>
                        </div>
                        <span className="font-mono text-slate-400 text-[11px]">{item.time}</span>
                      </div>

                      <div className="text-slate-800 leading-relaxed bg-white p-2.5 rounded-lg border border-rose-100">
                        <strong className="text-rose-700">驳回原因：</strong>
                        {item.reason}
                      </div>

                      {item.suggestedAction && (
                        <div className="text-slate-600 text-[11px] flex items-center gap-1">
                          <span className="text-slate-400">补采建议：</span>
                          <span>{item.suggestedAction}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div className="text-xs font-semibold text-slate-800">未发生质检驳回</div>
                  <p className="text-[11px] text-slate-400">该工单质检审核流程顺利，未触发不合格驳回指令。</p>
                </div>
              )}

              {/* LBS 空间与现场作业诊断 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>现场合规与 LBS 空间诊断</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px] mb-1">GPS 打卡偏差米数</span>
                    <span className="text-base font-bold font-mono text-emerald-600">
                      {order.locationInfo?.accuracyDeviationMeters || 4.8} m
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">（允许范围 ≤ 50m）</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px] mb-1">作业滞留检测</span>
                    <span className="text-base font-bold text-slate-800">正常无滞留</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">接单至完结时效优良</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px] mb-1">风险等级评估</span>
                    <span className="text-base font-bold text-emerald-600">低风险 (合规)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">AI 影像防伪与门牌校验通过</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 订单路由 (1:1 还原截图 2) */}
          {activeTab === 'routing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  全链路履约跟踪轨迹 (精确到节点时分)
                </h3>
                <span className="text-[11px] text-slate-400">共 {routingLogs.length} 条节点流转事件</span>
              </div>

              {/* 竖向时间轴 (1:1 还原图 2 样式) */}
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {routingLogs.map((log) => {
                  const isReject = log.statusType === 'reject';
                  const isCompleted = log.iconType === 'completed';
                  const isLocation = log.iconType === 'location';

                  return (
                    <div key={log.id} className="relative group">
                      {/* 时间轴小节点圆圈 */}
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                          isCompleted
                            ? 'bg-rose-600 text-white ring-4 ring-rose-100 shadow-2xs font-bold'
                            : isReject
                            ? 'bg-rose-500 text-white ring-4 ring-rose-100'
                            : isLocation
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                            : 'bg-white border-2 border-slate-400 text-slate-600'
                        }`}
                      >
                        {isCompleted ? '✓' : isReject ? '!' : isLocation ? '●' : '○'}
                      </div>

                      {/* 节点内容 */}
                      <div className="text-xs">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-slate-500 font-semibold text-[11px] w-24 shrink-0">
                            {log.time}
                          </span>
                          <span
                            className={`font-bold ${
                              isCompleted
                                ? 'text-rose-600 text-sm'
                                : isReject
                                ? 'text-rose-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {log.title}
                          </span>
                        </div>

                        {log.subTitle && (
                          <div
                            className={`mt-1 pl-26 text-[11px] leading-relaxed ${
                              isReject
                                ? 'text-rose-700 font-medium'
                                : 'text-slate-500'
                            }`}
                          >
                            {log.subTitle}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox for Photos */}
      <Lightbox
        isOpen={isLightboxOpen}
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onClose={() => setIsLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={userRole === 'platform_op' ? '平台内审驳回确认' : '客户外审要求补充核验'}
        subtitle={`驳回后工单将退回至【现场作业】节点，顺丰小哥将收到补采通知`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">驳回/要求补采原因 *</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="请输入不合格的具体原因，如：门牌照片反光看不清门牌号..."
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">外勤小哥补采指导建议</label>
            <input
              type="text"
              value={suggestedAction}
              onChange={(e) => setSuggestedAction(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="如：请在自然光线下正对门牌拍摄..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold cursor-pointer shadow-2xs"
            >
              确认下发驳回指令
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
