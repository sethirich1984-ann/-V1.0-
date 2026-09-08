import React, { useState, useMemo } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  MapPin,
  CheckCircle2,
  Download,
  Zap,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Building2,
  Calendar,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Play,
  Clock,
  Compass,
  FileCheck2,
  BarChart3,
  Smartphone,
  Phone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OrderItem } from '../../types';
import { Lightbox } from '../common/Lightbox';
import { Modal } from '../common/Modal';

export const TenantOrderData: React.FC = () => {
  const { currentTenant, orders, tasks, selectedOrderId, setSelectedOrderId, showToast } = useApp();

  const [taskFilter, setTaskFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Detail Modal state
  const [activeDetailOrder, setActiveDetailOrder] = useState<OrderItem | null>(null);

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Filter orders for this tenant that have completed evidence collection (采集状态="已采集")
  const tenantCollectedOrders = useMemo(() => {
    if (!currentTenant) return [];
    return orders.filter(
      (o) =>
        o.merchantId === currentTenant.id &&
        !!o.evidenceData &&
        (o.status === 'processing_complete' ||
          o.status === 'inner_auditing_waiting' ||
          o.status === 'inner_auditing_pass' ||
          o.status === 'outer_auditing_waiting' ||
          o.status === 'outer_auditing_pass' ||
          o.status === 'completed')
    );
  }, [orders, currentTenant]);

  // If a selectedOrderId is present from routing, auto-open its detail
  React.useEffect(() => {
    if (selectedOrderId) {
      const match = tenantCollectedOrders.find((o) => o.id === selectedOrderId);
      if (match) {
        setActiveDetailOrder(match);
      }
    }
  }, [selectedOrderId, tenantCollectedOrders]);

  // Filtered orders sorted by evidence upload time or createdAt desc
  const filteredOrders = useMemo(() => {
    return tenantCollectedOrders
      .filter((o) => {
        const matchTask = taskFilter === 'all' || o.taskId === taskFilter;
        const matchSearch =
          o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.contactCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.taskName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchTask && matchSearch;
      })
      .sort((a, b) => {
        const timeA = a.locationInfo?.collectTime || a.operateTimes?.processing_complete || a.createdAt;
        const timeB = b.locationInfo?.collectTime || b.operateTimes?.processing_complete || b.createdAt;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
  }, [tenantCollectedOrders, taskFilter, searchTerm]);

  // Pagination (每页20条)
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  const openLightbox = (images: string[], idx: number) => {
    setLightboxImages(images);
    setLightboxIndex(idx);
    setIsLightboxOpen(true);
  };

  // 点击增值服务"立即使用"按钮 (PRD 3.3.4.2 业务规则)
  const handleApplyAddonService = (serviceName: string) => {
    showToast('服务即将上线，敬请期待', `【${serviceName}】增值服务正在灰度准备中，敬请期待！`, 'info');
  };

  // 获取该订单关联任务的增值推荐服务
  const getTaskAddonServices = (taskName: string, taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const configuredServices = task?.serviceConfig?.valueAddedServices || [];
    if (configuredServices.length > 0) {
      return configuredServices.map((name) => {
        if (name.includes('竞品')) {
          return {
            name,
            icon: 'phone',
            summary: '精准分析竞品目标客户与周边1-3公里竞争格局',
          };
        }
        if (name.includes('风险')) {
          return {
            name,
            icon: 'risk',
            summary: '企业风险一键查，降低企业信用与经营风险',
          };
        }
        return {
          name,
          icon: 'chart',
          summary: '专业选址分析与商圈客流评估，降低开店经营风险',
        };
      });
    }

    // 默认推荐
    return [
      {
        name: '竞品分析',
        icon: 'phone',
        summary: '精准分析竞品目标客户与商圈竞争密度',
      },
      {
        name: '企业风险报告',
        icon: 'risk',
        summary: '企业风险一键查，降低企业坏账与合作风险',
      },
    ];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 顶部标题 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            订单数据
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            查看顺丰末端小哥现场采集的多媒体高清照片、视频凭证、问卷答卷与精准经纬度打卡
          </p>
        </div>
        <div className="text-xs text-slate-500">
          已采集工单：<span className="font-bold text-indigo-600">{tenantCollectedOrders.length}</span> 单
        </div>
      </div>

      {/* 筛选与搜索 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* 搜索 */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索订单ID、联系人、网点单位..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-64 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* 按任务筛选 */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">所属任务:</span>
            <select
              value={taskFilter}
              onChange={(e) => {
                setTaskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">全部任务</option>
              {tasks
                .filter((t) => t.merchantId === currentTenant?.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="text-slate-500">
          共 <span className="font-bold text-slate-900">{filteredOrders.length}</span> 条已采集数据
        </div>
      </div>

      {/* 订单数据列表表格 (PRD 3.3.4.1 规范) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">订单ID</th>
                <th className="py-3 px-4">所属任务</th>
                <th className="py-3 px-4">联系人</th>
                <th className="py-3 px-4 text-center">采集状态</th>
                <th className="py-3 px-4">采集时间 (数据回传时间)</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    当前暂无可查看的已采集订单
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700">
                      <button
                        onClick={() => setActiveDetailOrder(order)}
                        className="hover:underline cursor-pointer"
                      >
                        {order.id}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{order.taskName}</div>
                      <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                        {order.contactCompany}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-medium text-slate-900">{order.contactName}</span>
                      <span className="text-slate-400 font-mono ml-1.5">({order.contactPhone})</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold border border-emerald-200 text-[11px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        已采集
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                      {order.locationInfo?.collectTime || order.operateTimes?.processing_complete || order.createdAt}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveDetailOrder(order)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition cursor-pointer"
                      >
                        查看数据
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页控制器（每页20条） */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div>
              显示第 {(currentPage - 1) * pageSize + 1} 至{' '}
              {Math.min(currentPage * pageSize, filteredOrders.length)} 条，共{' '}
              {filteredOrders.length} 条（每页 20 条）
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-mono font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 订单数据详情 Modal (PRD 3.3.4.2 规范) */}
      <Modal
        isOpen={!!activeDetailOrder}
        onClose={() => {
          setActiveDetailOrder(null);
          setSelectedOrderId(null);
        }}
        title={activeDetailOrder ? `订单数据详情 · ${activeDetailOrder.id}` : ''}
        maxWidth="max-w-4xl"
      >
        {activeDetailOrder && (
          <div className="space-y-6 text-xs max-h-[80vh] overflow-y-auto pr-1">
            {/* 顶栏基本信息 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {activeDetailOrder.id}
                  </span>
                  <span className="px-2 py-0.2 bg-indigo-100 text-indigo-800 rounded font-semibold text-[10px]">
                    {activeDetailOrder.taskName}
                  </span>
                </div>
                <div className="text-slate-600 mt-1 flex items-center gap-3">
                  <span>受检网点：<b className="text-slate-800">{activeDetailOrder.contactCompany}</b></span>
                  <span>现场联系人：{activeDetailOrder.contactName} ({activeDetailOrder.contactPhone})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  采集状态：已采集
                </span>
              </div>
            </div>

            {/* 1. 照片：网格展示，支持放大预览和左右滑动 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  现场照片（网格展示 · 点击可放大全屏预览及左右滑动）
                </h4>
                <span className="text-slate-400 text-[11px]">
                  共 {activeDetailOrder.evidenceData?.photos.length || 0} 张照片
                </span>
              </div>

              {activeDetailOrder.evidenceData?.photos && activeDetailOrder.evidenceData.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activeDetailOrder.evidenceData.photos.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => openLightbox(activeDetailOrder.evidenceData!.photos, i)}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 cursor-pointer shadow-2xs hover:shadow-md transition"
                    >
                      <img
                        src={url}
                        alt={`现场照片 ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 transition flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 px-2.5 py-1 bg-white/90 rounded text-slate-900 font-semibold text-[11px] shadow-xs flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          点击放大
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-slate-900/70 text-white px-2 py-0.5 rounded text-[10px] font-mono">
                        照片 {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-center">
                  暂无照片证据
                </div>
              )}
            </div>

            {/* 2. 视频：列表展示，支持播放 */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-600" />
                现场视频（列表展示 · 支持在线播放）
              </h4>

              {activeDetailOrder.evidenceData?.videos && activeDetailOrder.evidenceData.videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeDetailOrder.evidenceData.videos.map((vid, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-lg bg-indigo-900 text-white flex items-center justify-center shrink-0">
                        <Play className="w-5 h-5 ml-0.5 text-indigo-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">
                          现场360度巡查录像 #{i + 1}.mp4
                        </span>
                        <span className="text-[11px] text-slate-400">顺丰小哥执法记录仪高清原画 · 1080P</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => showToast('播放视频', '正在调取顺丰云存现场视频流播放器...', 'info')}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition cursor-pointer shrink-0"
                      >
                        播放
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400">
                  本任务无需录制视频或无视频回传
                </div>
              )}
            </div>

            {/* 3. 问卷填写内容：按字段展示填写内容 */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                问卷填写内容（按字段结构化展示）
              </h4>

              {activeDetailOrder.evidenceData?.answers && activeDetailOrder.evidenceData.answers.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="py-2.5 px-4 w-1/3">问卷指标 / 调研字段</th>
                        <th className="py-2.5 px-4">顺丰现场采集填报内容</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeDetailOrder.evidenceData.answers.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{item.label}</td>
                          <td className="py-2.5 px-4 text-slate-700">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-900 rounded font-medium">
                              {item.value}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400">
                  暂无结构化问卷数据
                </div>
              )}
            </div>

            {/* 4. 定位信息：展示采集时的地址、经纬度、采集时间 */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                定位信息（采集地址、经纬度及时间戳）
              </h4>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">采集时实际打卡地址</span>
                  <div className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{activeDetailOrder.locationInfo?.address || activeDetailOrder.address}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">采集时间</span>
                  <div className="font-mono text-slate-700 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {activeDetailOrder.locationInfo?.collectTime ||
                        activeDetailOrder.operateTimes?.processing_complete ||
                        activeDetailOrder.createdAt}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">打卡经度 (Longitude)</span>
                  <div className="font-mono font-bold text-indigo-700 mt-0.5">
                    {activeDetailOrder.locationInfo?.longitude || 113.9344}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">打卡纬度 (Latitude)</span>
                  <div className="font-mono font-bold text-indigo-700 mt-0.5">
                    {activeDetailOrder.locationInfo?.latitude || 22.5408}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">空间围栏匹配度</span>
                  <div className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>在网点 50 米目标圈内</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. 推荐服务（增值服务卡片 - PRD 3.3.4.2 规范） */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h4 className="font-bold text-slate-900 text-xs">
                  为您推荐增值服务（根据采集点位特征智能匹配）
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getTaskAddonServices(activeDetailOrder.taskName, activeDetailOrder.taskId).map(
                  (srv, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gradient-to-r from-purple-50/70 to-indigo-50/40 border border-purple-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {srv.icon === 'phone' ? (
                            <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />
                          ) : srv.icon === 'risk' ? (
                            <FileCheck2 className="w-4 h-4 text-purple-600 shrink-0" />
                          ) : (
                            <BarChart3 className="w-4 h-4 text-purple-600 shrink-0" />
                          )}
                          <span className="font-bold text-slate-900 text-xs">{srv.name}</span>
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[10px] font-semibold">
                            增值赋能
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{srv.summary}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyAddonService(srv.name)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition cursor-pointer shrink-0 shadow-2xs text-xs whitespace-nowrap"
                      >
                        立即使用
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* 底部关闭 */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveDetailOrder(null);
                  setSelectedOrderId(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer text-xs"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 图片全屏预览灯箱（左右滑动与缩放） */}
      <Lightbox
        isOpen={isLightboxOpen}
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
};
