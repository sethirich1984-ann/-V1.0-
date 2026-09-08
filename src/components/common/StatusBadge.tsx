import React from 'react';
import { OrderStatusCode, DispatchStatus, TaskStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatusCode | DispatchStatus | TaskStatus | '正常' | '冻结' | '试用版' | '付费版' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  // Order status mappings
  switch (status) {
    case 'created':
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
      label = '已下单';
      break;
    case 'waiting_assign':
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
      label = '待接单';
      break;
    case 'assigned_assign':
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      label = '已接单';
      break;
    case 'processing_start':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      label = '执行中';
      break;
    case 'processing_complete':
      colorClass = 'bg-teal-50 text-teal-700 border-teal-200';
      label = '已采集';
      break;
    case 'inner_auditing_waiting':
      colorClass = 'bg-yellow-50 text-yellow-800 border-yellow-200';
      label = '待审核';
      break;
    case 'inner_auditing_pass':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = '内审通过';
      break;
    case 'outer_auditing_waiting':
      colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
      label = '外审中';
      break;
    case 'outer_auditing_pass':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      label = '外审通过';
      break;
    case 'completed':
      colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      label = '已完成';
      break;
    case 'cancelled':
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      label = '已取消';
      break;
    case '下发失败':
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      label = '下发失败';
      break;

    // Task status mappings (1:待配置 2:已生效 3:已失效)
    case '待配置':
      colorClass = 'bg-amber-50 text-amber-700 border-amber-300';
      break;
    case '已生效':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      break;
    case '已失效':
      colorClass = 'bg-rose-50 text-rose-700 border-rose-300';
      break;
    case '已就绪':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      label = '已生效';
      break;
    case '进行中':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      label = '已生效';
      break;

    // Dispatch status mappings (下发中、全部成功、部分成功、失败)
    case '下发中':
    case '正在下发中':
      colorClass = 'bg-sky-50 text-sky-700 border-sky-300 animate-pulse';
      label = '下发中';
      break;
    case '全部成功':
    case '下发成功':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      label = '全部成功';
      break;
    case '部分成功':
      colorClass = 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
      label = '部分成功';
      break;
    case '失败':
    case '全部失败':
    case '下发失败':
      colorClass = 'bg-rose-50 text-rose-700 border-rose-300 font-medium';
      label = '失败';
      break;
    case '已保存数据':
    case '待下发':
      colorClass = 'bg-slate-100 text-slate-700 border-slate-300';
      label = '已保存数据';
      break;
    case '已下发':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      label = '已下发';
      break;

    // Merchant status
    case '正常':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case '冻结':
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case '付费版':
      colorClass = 'bg-violet-50 text-violet-700 border-violet-200 font-medium';
      break;
    case '试用版':
      colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${colorClass} ${sizeClasses}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
};
