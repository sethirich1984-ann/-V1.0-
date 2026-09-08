export type UserRole = 'platform_op' | 'tenant_admin' | 'tenant_user';

export type SystemMode = 'open_platform' | 'operator' | 'tenant';

export type OpenPlatformTab =
  | 'merchants'
  | 'projects'
  | 'tasks'
  | 'dispatches'
  | 'orders'
  | 'sync'
  | 'dashboard'
  | 'services';
export type OperatorTab = 'tasks' | 'dispatches' | 'orders' | 'sync' | 'dashboard' | 'services';
export type TenantTab =
  | 'login'
  | 'new_dispatch'
  | 'dispatches'
  | 'order_status'
  | 'order_data'
  | 'services';

export interface Merchant {
  id: string;
  name: string;
  type: '试用版' | '付费版';
  adminName: string;
  adminPhone: string;
  status: '正常' | '冻结';
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  creditCode?: string; // 统一社会信用代码
  authorizedProducts?: string[]; // 授权开通产品: 丰迹、选址参谋、丰策智能体、空间数智
  apiCallsQuota?: number; // API配额
  apiCallsUsed?: number; // 已消耗API次数
  balance?: number; // 账户余额 (元)
}

export interface OpenPlatformApp {
  id: string;
  appName: string;
  appId: string;
  appSecret: string;
  merchantId: string;
  merchantName: string;
  status: '启用' | '停用';
  ipWhitelist: string[];
  permissions: string[];
  webhookUrl?: string;
  webhookSecret?: string;
  subscribedEvents?: string[];
  createdAt: string;
  lastActiveAt: string;
  todayCalls: number;
}

export interface OpenPlatformApiDoc {
  id: string;
  name: string;
  category: '空间核验' | '网格调度' | '增值营销' | '智能决策';
  method: 'POST' | 'GET';
  path: string;
  description: string;
  requestSample: string;
  responseSample: string;
  headers: Record<string, string>;
  params: Array<{ name: string; type: string; required: boolean; description: string; sample: string }>;
  callCount: number;
  successRate: number;
  avgLatency: number;
}

export interface ApiGatewayLog {
  id: string;
  timestamp: string;
  appId: string;
  merchantName: string;
  apiPath: string;
  method: string;
  clientIp: string;
  statusCode: number;
  latencyMs: number;
  requestBody: string;
  responseBody: string;
}

export interface ProjectRevenue {
  id: string;
  productName: '丰迹' | '选址参谋' | '丰策智能体' | '其他' | string;
  merchantId: string;
  merchantName: string;
  projectName: string;
  projectCode: string;
  taskName: string;
  confirmedAmount: number;
  confirmedDate: string;
}

export type TaskType = '巡检' | '推广' | '核验' | string;
export type TaskStatus = '待配置' | '已生效' | '已失效';

export interface ChannelConfig {
  channel: '丰创' | '顺丰同城' | string;
  orderType: string;
  templateFile?: string;
  templateUploaded: boolean;
  lastUpdated?: string;
}

export interface TaskServiceConfig {
  preValidationServices?: string[]; // 支持多选：['地址精确度校验', '门店有效性校验', '营业时间校验', ...]
  valueAddedServices?: string[]; // 支持多选：['短信触达', '优惠券发放', '选址评估', '周边竞品分析', ...]
  serviceQuotas?: Record<string, number>; // 每个服务的免费体验配额映射，例如：{ '地址精确度校验': 50, '短信触达': 50 }
  preValidationService?: string; // 兼容旧字段
  valueAddedService?: string; // 兼容旧字段
  freeTrialCount?: number; // 兼容旧字段
}

export interface TaskItem {
  id: string;
  name: string;
  merchantId: string;
  merchantName: string;
  type: TaskType;
  status: TaskStatus;
  orderCount: number;
  completedCount: number;
  deadline?: string;
  createdAt: string;
  channelConfigs: Record<string, ChannelConfig>;
  serviceConfig: TaskServiceConfig;
  responsiblePerson?: string;
}

export type DispatchStatus =
  | '下发中'
  | '全部成功'
  | '部分成功'
  | '失败'
  // 历史兼容别名
  | '已保存数据'
  | '正在下发中'
  | '已下发'
  | '下发成功'
  | '下发失败'
  | '待下发'
  | '全部失败';

export interface DispatchRecord {
  id: string; // 下单流水号
  batchNo?: string; // 兼容别名
  merchantId: string;
  merchantName: string;
  taskId: string;
  taskName: string;
  channel: '丰创' | '顺丰同城' | string;
  channelCode: string; // 如丰创 orderType
  orderCount: number;
  totalCount?: number; // 兼容别名
  successCount: number;
  failureCount: number;
  failedCount?: number; // 兼容别名
  status: DispatchStatus;
  createdAt: string;
  creator: string;
  createdBy?: string; // 兼容别名
  creatorRole: '运营' | '租户';
}

export type OrderStatusCode =
  | 'created' // 已下单
  | 'waiting_assign' // 待接单
  | 'assigned_assign' // 已接单
  | 'processing_start' // 执行中
  | 'processing_complete' // 已完成 (采集完毕)
  | 'inner_auditing_waiting' // 待审核
  | 'inner_auditing_pass' // 内审通过
  | 'outer_auditing_waiting' // 外审中
  | 'outer_auditing_pass' // 外审通过
  | 'completed' // 已完成 / 已结单
  | 'cancelled'; // 已取消

export interface RouteInfo {
  stationName: string;
  courierName: string;
  courierPhone: string;
}

export interface EvidenceVideo {
  title: string;
  duration: string;
  url: string;
}

export interface EvidenceAnswer {
  label: string;
  value: string;
}

export interface EvidenceData {
  photos: string[];
  videos?: EvidenceVideo[];
  answers?: EvidenceAnswer[];
}

export interface LocationInfo {
  address: string;
  latitude: number;
  longitude: number;
  collectTime: string;
  accuracyDeviationMeters?: number;
}

export interface AuditRejectRecord {
  id: string;
  time: string;
  stage: '内审质检' | '客户外审';
  reason: string;
  auditor: string;
  suggestedAction?: string;
}

export interface BranchDecisionItem {
  id: string;
  question: string;
  selectedOption: string;
  options: string[];
  status: '合格' | '不合格' | '待核验';
  surveyRemark?: string;
  time?: string;
}

export interface SurveyQuestionItem {
  id: string;
  stepName: string;
  question: string;
  selectedOption: string;
  options: string[];
  status: '合格' | '不合格' | '待核验';
  surveyRemark?: string;
}

export interface PhotoEvidenceItem {
  id: string;
  title: string;
  currentCount: number;
  maxCount: number;
  photos: Array<{
    url: string;
    label?: string;
    note?: string;
    status: '合格' | '不合格';
  }>;
  status: '合格' | '不合格' | '待核验';
  auditRemark?: string;
}

export interface VideoEvidenceItem {
  id: string;
  title: string;
  url: string;
  duration: string;
  status: '合格' | '不合格' | '待核验';
  auditRemark?: string;
}

export interface MilestoneStepItem {
  title: string;
  time: string;
  decisionTag?: string;
  state: 'finished' | 'active' | 'pending';
}

export interface RoutingLogItem {
  id: string;
  time: string;
  title: string;
  subTitle?: string;
  statusType: 'success' | 'warning' | 'info' | 'neutral' | 'reject';
  iconType: 'completed' | 'outer_audit' | 'inner_audit' | 'processing' | 'location' | 'created';
}

export interface OrderItem {
  id: string; // 丰迹订单ID
  dispatchId: string; // 所属下单流水号
  channelOrderId?: string; // 渠道系统订单号
  merchantId: string;
  merchantName: string;
  taskId: string;
  taskName: string;
  channel: '丰创' | '顺丰同城' | string;
  status: OrderStatusCode;
  contactName: string;
  contactPhone: string;
  contactCompany: string;
  address: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  operateTimes: {
    created?: string;
    waiting_assign?: string;
    assigned_assign?: string;
    processing_start?: string;
    processing_complete?: string;
    inner_auditing_waiting?: string;
    inner_auditing_pass?: string;
    outer_auditing_waiting?: string;
    outer_auditing_pass?: string;
    completed?: string;
    cancelled?: string;
  };
  routeInfo?: RouteInfo;
  evidenceData?: EvidenceData;
  locationInfo?: LocationInfo;
  // 截图原型增强字段
  poiId?: string;
  taskStartTime?: string;
  taskEndTime?: string;
  slaRequirement?: string;
  orderTypeTag?: string;
  milestones?: MilestoneStepItem[];
  branchDecisions?: BranchDecisionItem[];
  photoGroups?: PhotoEvidenceItem[];
  surveyQuestions?: SurveyQuestionItem[];
  videoGroups?: VideoEvidenceItem[];
  routingLogs?: RoutingLogItem[];
  // 异常监控与质量核验属性
  auditRejectCount?: number; // 审核驳回次数
  auditRejectHistory?: AuditRejectRecord[]; // 审核驳回历史记录
  isTimeoutUnassigned?: boolean; // 是否超时未接单 (超2h未接单)
  unassignedHours?: number; // 待接单等待耗时(小时)
  isExecutionStalled?: boolean; // 是否现场作业滞留 (超24h未完成)
  stalledHours?: number; // 滞留耗时(小时)
  isGpsDeviated?: boolean; // 是否GPS打卡定位偏移
  gpsDeviationMeters?: number; // GPS偏差米数
  anomalySeverity?: 'high' | 'medium' | 'low' | 'none'; // 风险等级
  anomalyTags?: string[]; // 异常原因标签
  lastRemindedAt?: string; // 最近一次催办时间
}

export interface PlatformService {
  id: string;
  name: string; // 服务名称 (最多30字)
  category: '前置校验' | '增值服务';
  type: '前置校验服务' | '增值服务'; // 服务类型: 前置校验服务 / 增值服务
  source: '开放平台' | '自定义接入'; // 服务来源: 开放平台 / 自定义接入
  interfaceType: 'open_platform' | 'custom_api';
  description: string; // 服务说明 (最多200字)
  marketingCopy?: string; // 营销文案: 用于向租户展示的服务介绍文案
  openPlatformServiceKey?: string; // 服务选择 (开放平台列表关联key)
  apiEndpoint?: string; // 接口地址: 当服务来源=自定义接入时填写服务的API接口地址
  status: '启用' | '停用';
  priceDescription?: string;
  freeTrialQuota?: number;
}

export interface SyncLog {
  id: string;
  type: '订单数据' | '订单状态' | '增量同步';
  orderId?: string;
  timestamp: string;
  status: '成功' | '失败';
  payload: string;
  response: string;
  retried?: boolean;
}
