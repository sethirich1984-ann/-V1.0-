import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  Store,
  Building2,
  Smartphone,
  FileCheck2,
  BarChart3,
  Mail,
  PhoneCall,
  ChevronRight,
  Info,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';

interface ServiceDetail {
  id: string;
  name: string;
  category: '前置校验服务' | '增值服务';
  icon: 'map' | 'store' | 'building' | 'phone' | 'risk' | 'chart';
  summary: string;
  description: string;
  scene: string;
  effect: string;
  pricing: string;
}

const SERVICE_CATALOG: ServiceDetail[] = [
  // 前置校验服务
  {
    id: 'SRV-002',
    name: '地址精确度校验',
    category: '前置校验服务',
    icon: 'map',
    summary: '智能优化地址质量，提升订单有效率',
    description:
      '基于顺丰海量空间地理库与高精度自然语言地址解析模型，自动清洗导入的点位数据，补全缺失的行政区划、路名、门牌号及写字楼楼层信息，智能匹配经纬度并计算顺丰最佳末端接驳网格。',
    scene: '当下单表格包含模糊地址、手工简称或旧门牌号时，在批量下单前推荐使用。',
    effect: '提升末端导航到达准确率达99.2%，减少外勤人员因地址错误导致的改派和沟通耗时，整体订单有效履约率提升30%以上。',
    pricing: '按次计费，0.10元/次（新商户或新任务前50次免费体验）。',
  },
  {
    id: 'SRV-001',
    name: '门店有效性校验',
    category: '前置校验服务',
    icon: 'store',
    summary: '验证门店真实性，减少无效下单',
    description:
      '通过多源商户经营大数据与顺丰小哥常态化揽派真实动态，核验目标门店是否真实存在、是否处于在业状态，自动识别已倒闭、装修歇业、虚构地址或被吊销等异常网点。',
    scene: '零售品牌客户针对第三方代理商门店、加盟巡检、历史网点名录下发抽查任务时使用。',
    effect: '提前剔除闭店、虚假无效网点，防止无效外勤派单跑空，直接节省线下巡检人工差旅与外包执行成本。',
    pricing: '按次计费，0.15元/次（支持体验配额）。',
  },
  {
    id: 'SRV-007',
    name: '企业验证',
    category: '前置校验服务',
    icon: 'building',
    summary: '校验企业是否真实存在',
    description:
      '直连全国企业信用信息公示系统及顺丰企业大数据图谱，核查受检对象的统一社会信用代码、法定代表人、注册资本、经营范围及经营异常名录，确保巡检任务标的合法存续。',
    scene: '金融机构线下尽职调查、企业资质现场合规核验及渠道商准入前置核准时使用。',
    effect: '秒级穿透企业合法身份，杜绝虚构空壳公司或冒名欺诈，严守合规风控红线。',
    pricing: '按次计费，0.20元/次。',
  },

  // 增值服务
  {
    id: 'SRV-005',
    name: '竞品分析',
    category: '增值服务',
    icon: 'phone',
    summary: '精准分析竞品目标客户',
    description:
      '深度分析受检门店周边1-3公里商圈内同行业竞争品牌的网点分布密度、客单价区间、客流热力及用户重合度，通过时空多维透视勾勒区域竞争格局。',
    scene: '餐饮连锁、快消品商超在规划区域市场策略、门店营销促销打法及商品铺市策略时使用。',
    effect: '知己知彼，精准识别竞品优势商圈与薄弱空白区域，辅助商户管理层制定区域进攻与防守决策。',
    pricing: '按商圈计费，300元/商圈/月。',
  },
  {
    id: 'SRV-008',
    name: '企业风险报告',
    category: '增值服务',
    icon: 'risk',
    summary: '企业风险一键查，降低企业风险',
    description:
      '全方位扫描目标企业的涉诉司法案件、被执行人失信信息、行政处罚、经营异常、股权冻结及重大舆情风险，一键输出结构化 PDF / 数据报告。',
    scene: '针对供应链供应商评估、大客户赊销授信风控及特许加盟商资格复核等业务场景。',
    effect: '将线下巡检实地采集数据与线上征信司法大数据深度融合，降低坏账与合作欺诈风险。',
    pricing: '按份计费，80元/份。',
  },
  {
    id: 'SRV-004',
    name: '选址评估',
    category: '增值服务',
    icon: 'chart',
    summary: '专业选址分析，降低开店风险',
    description:
      '依托顺丰包裹寄递大数据、常住人口密度、商圈客流动线、交通通达性及周边消费水平评级，运用前沿空间算法为新店开拓提供全维度商业价值评估模型。',
    scene: '新零售连锁、餐饮咖啡、数码体验店等品牌线下拓店、新设网点选址决策时使用。',
    effect: '量化选址成功概率与客流预估，输出专业选址评估报告，显著降低开店失败率与沉没资本支出。',
    pricing: '按份计费，500元/份专业评估报告。',
  },
];

export const TenantServiceMarket: React.FC = () => {
  const { showToast } = useApp();
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);

  const preValidationServices = SERVICE_CATALOG.filter((s) => s.category === '前置校验服务');
  const valueAddedServices = SERVICE_CATALOG.filter((s) => s.category === '增值服务');

  const renderIcon = (icon: ServiceDetail['icon']) => {
    switch (icon) {
      case 'map':
        return <MapPin className="w-5 h-5 text-indigo-600" />;
      case 'store':
        return <Store className="w-5 h-5 text-indigo-600" />;
      case 'building':
        return <Building2 className="w-5 h-5 text-indigo-600" />;
      case 'phone':
        return <Smartphone className="w-5 h-5 text-purple-600" />;
      case 'risk':
        return <FileCheck2 className="w-5 h-5 text-purple-600" />;
      case 'chart':
        return <BarChart3 className="w-5 h-5 text-purple-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-600" />;
    }
  };

  const handleApplyContact = (name: string) => {
    showToast(
      '意向已登记',
      `您对【${name}】的开通意向已发送至平台运营专员，我们将尽快致电或通过企业微信联系您完成服务授权`,
      'success'
    );
    setSelectedService(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 顶部标题区 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">服务市场</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              说明：服务市场为纯展示页面，介绍平台提供的数据服务，引导租户联系运营开通。
            </p>
          </div>
        </div>
      </div>

      {/* 模块一：前置校验服务 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">前置校验服务</h3>
          <span className="text-xs text-slate-400">在任务批量下单前智能清洗与核验点位质量</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {preValidationServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {renderIcon(service.icon)}
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-semibold border border-indigo-100">
                    前置校验
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mt-3">{service.name}</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{service.summary}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">{service.id}</span>
                <button
                  type="button"
                  onClick={() => setSelectedService(service)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <span>了解详情</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 模块二：增值服务 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
          <h3 className="text-sm font-bold text-slate-900">增值服务</h3>
          <span className="text-xs text-slate-400">在工单采集完成后深度拓展大数据洞察与商业报告</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {valueAddedServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {renderIcon(service.icon)}
                  </div>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[11px] font-semibold border border-purple-100">
                    增值服务
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mt-3">{service.name}</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{service.summary}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">{service.id}</span>
                <button
                  type="button"
                  onClick={() => setSelectedService(service)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 cursor-pointer"
                >
                  <span>了解详情</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部运营联系提示卡片 */}
      <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              💡 如需使用以上服务，请联系您的运营对接人员
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              平台运营团队将根据您的商户任务规模提供专属折扣配额，支持在线接口直接对接及工单流程深度集成。
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-lg border border-amber-200 shadow-2xs font-mono text-slate-700">
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            <span>service@fengji.com</span>
          </div>
          <button
            type="button"
            onClick={() => handleApplyContact('租户服务市场咨询')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            联系运营开通
          </button>
        </div>
      </div>

      {/* 了解详情弹窗 */}
      <Modal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        title={selectedService ? `服务详情 · ${selectedService.name}` : ''}
        maxWidth="max-w-xl"
      >
        {selectedService && (
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
                {renderIcon(selectedService.icon)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{selectedService.name}</h3>
                  <span className="px-2 py-0.2 bg-indigo-50 text-indigo-700 rounded font-semibold text-[10px] border border-indigo-100">
                    {selectedService.category}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">{selectedService.summary}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">【服务介绍】</label>
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                  {selectedService.description}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">【适用场景】</label>
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                  {selectedService.scene}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">【使用效果】</label>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 leading-relaxed flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{selectedService.effect}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">【收费说明】</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                  {selectedService.pricing}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">联系邮箱：service@fengji.com</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyContact(selectedService.name)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition cursor-pointer"
                >
                  申请开通此服务
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
