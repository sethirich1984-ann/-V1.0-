import React from 'react';
import { CheckCircle2, Clock, CircleDot, XCircle } from 'lucide-react';
import { OrderItem } from '../../types';

interface ExecutionTimelineProps {
  order?: OrderItem;
  timeline?: Array<{
    time: string;
    action: string;
    operator: string;
    note?: string;
  }>;
}

interface StepDef {
  key: string;
  name: string;
  subLabel?: string;
}

const TIMELINE_STEPS: StepDef[] = [
  { key: 'created', name: '已下单', subLabel: '系统录入' },
  { key: 'waiting_assign', name: '待接单', subLabel: '网格排队' },
  { key: 'assigned_assign', name: '已接单', subLabel: '小哥接单' },
  { key: 'processing_start', name: '执行中', subLabel: '现场作业' },
  { key: 'processing_complete', name: '已完成', subLabel: '采集完毕' },
  { key: 'inner_auditing_waiting', name: '待审核', subLabel: '提交内审' },
  { key: 'inner_auditing_pass', name: '内审通过', subLabel: '初审合规' },
  { key: 'outer_auditing_waiting', name: '外审中', subLabel: '客户复核' },
  { key: 'outer_auditing_pass', name: '外审通过', subLabel: '终审合格' },
  { key: 'completed', name: '已完成', subLabel: '归档结单' },
];

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ order, timeline }) => {
  if (order && order.status === 'cancelled') {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-900">
        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <div>
          <div className="font-semibold text-sm">工单已取消 (终止执行)</div>
          <div className="text-xs text-rose-700 mt-0.5 font-mono">
            取消时间：{order.operateTimes.cancelled || order.updatedAt}
          </div>
        </div>
      </div>
    );
  }

  // If order is passed, render standard lifecycle steps
  const stepKeys = TIMELINE_STEPS.map((s) => s.key);
  let currentIndex = 0;
  if (order) {
    currentIndex = stepKeys.indexOf(order.status);
    if (order.status === 'completed') {
      currentIndex = stepKeys.length - 1;
    } else if (currentIndex === -1) {
      currentIndex = 0;
    }
  }

  return (
    <div className="py-2 space-y-4">
      {order && (
        <>
          {/* Horizontal timeline for medium+ screens */}
          <div className="relative hidden lg:flex items-center justify-between">
            {/* Background Connecting Line */}
            <div className="absolute top-4 left-5 right-5 h-0.5 bg-slate-200 -z-0" />
            {/* Active Progress Line */}
            <div
              className="absolute top-4 left-5 h-0.5 bg-indigo-600 -z-0 transition-all duration-500"
              style={{
                width: `${Math.min(100, (currentIndex / (stepKeys.length - 1)) * 100)}%`,
              }}
            />

            {TIMELINE_STEPS.map((step, idx) => {
              const isPast = idx < currentIndex || (order.status === 'completed' && idx <= currentIndex);
              const isCurrent = idx === currentIndex && order.status !== 'completed';
              const isFinalCompleted = order.status === 'completed' && idx === currentIndex;

              const timestamp = order.operateTimes[step.key as keyof typeof order.operateTimes];

              return (
                <div key={step.key} className="flex flex-col items-center text-center relative z-10 w-20">
                  {/* Node Icon */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isPast || isFinalCompleted
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50 shadow-md scale-110'
                        : 'bg-white border-slate-300 text-slate-300'
                    }`}
                  >
                    {isPast || isFinalCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isCurrent ? (
                      <CircleDot className="w-3.5 h-3.5 animate-pulse" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    )}
                  </div>

                  {/* Title */}
                  <div className="mt-2">
                    <div
                      className={`text-[11px] font-semibold whitespace-nowrap ${
                        isCurrent
                          ? 'text-indigo-600 font-bold'
                          : isPast || isFinalCompleted
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.name}
                    </div>
                    {timestamp ? (
                      <div className="text-[9px] text-slate-500 mt-0.5 font-mono leading-tight whitespace-nowrap">
                        {timestamp.split(' ')[1] || timestamp}
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-400 mt-0.5 whitespace-nowrap">{step.subLabel}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Responsive Grid/Vertical timeline for smaller screens */}
          <div className="flex flex-col gap-3 lg:hidden relative pl-6 border-l-2 border-slate-200 ml-3">
            {TIMELINE_STEPS.map((step, idx) => {
              const isPast = idx < currentIndex || (order.status === 'completed' && idx <= currentIndex);
              const isCurrent = idx === currentIndex && order.status !== 'completed';
              const isFinalCompleted = order.status === 'completed' && idx === currentIndex;
              const timestamp = order.operateTimes[step.key as keyof typeof order.operateTimes];

              return (
                <div key={step.key} className="relative flex flex-col">
                  <div
                    className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      isPast || isFinalCompleted
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : isCurrent
                        ? 'bg-white border-indigo-600 text-indigo-600 ring-2 ring-indigo-100'
                        : 'bg-white border-slate-300 text-slate-300'
                    }`}
                  >
                    {isPast || isFinalCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isCurrent ? (
                      <CircleDot className="w-3.5 h-3.5" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        isCurrent ? 'text-indigo-600 font-bold' : isPast || isFinalCompleted ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.name} <span className="text-[10px] text-slate-400 font-normal">({step.subLabel})</span>
                    </span>
                    {timestamp && (
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {timestamp}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* If timeline list provided */}
      {timeline && timeline.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="text-[11px] font-semibold text-slate-600 mb-2">流转历史记录：</div>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg bg-slate-50/50">
            {timeline.map((item, idx) => (
              <div key={idx} className="p-2.5 flex items-start justify-between text-xs gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>{item.action}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({item.operator})</span>
                  </div>
                  {item.note && <div className="text-[11px] text-slate-500">{item.note}</div>}
                </div>
                <div className="text-[11px] font-mono text-slate-400 shrink-0">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
