import React, { useState } from 'react';
import {
  Building2,
  Phone,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TenantLogin: React.FC = () => {
  const { merchants, tenantLogin, showToast } = useApp();

  const [phone, setPhone] = useState(merchants[0]?.adminPhone || '13800138000');
  const [code, setCode] = useState('888888');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sentCodeHint, setSentCodeHint] = useState<string>('888888');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendCode = () => {
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      setErrorMessage('请输入正确的11位管理员手机号');
      return;
    }
    const matchedMerchant = merchants.find((m) => m.adminPhone === phone.trim());
    if (matchedMerchant && matchedMerchant.status === '冻结') {
      setErrorMessage('商户已被冻结');
      return;
    }

    setErrorMessage('');
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCodeHint(randomCode);
    setCode(randomCode);
    setIsSendingCode(true);
    setCountdown(60);

    showToast(
      '验证码已发送',
      `模拟短信验证码已发送至 ${phone}：【${randomCode}】（5分钟内有效）`,
      'info'
    );

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsSendingCode(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!code || code.trim().length !== 6) {
      setErrorMessage('请输入6位数字验证码');
      return;
    }
    const res = tenantLogin(phone, code);
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Building2 className="w-6 h-6 text-indigo-300" />
          </div>
          <h2 className="text-lg font-bold">丰迹租户端 · 商户登录</h2>
          <p className="text-xs text-indigo-200 mt-1">
            管理员手机号验证码认证 · 24小时有效Token · 下单与工单数据闭环
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              管理员手机号 <span className="text-rose-500">*</span>
              <span className="text-[11px] text-slate-400 font-normal ml-1.5">(创建商户时设置的管理员手机)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                required
                maxLength={11}
                placeholder="请输入管理员11位手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">
                短信验证码 <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">6位数字 · 有效期5分钟</span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 font-mono tracking-widest text-center font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSendingCode || countdown > 0}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium rounded-lg text-xs transition cursor-pointer whitespace-nowrap"
              >
                {countdown > 0 ? `${countdown}s 后重新获取` : '获取验证码'}
              </button>
            </div>
            {sentCodeHint && (
              <p className="text-[11px] text-indigo-600 mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                当前模拟接收到的验证码为：<span className="font-mono font-bold">{sentCodeHint}</span>（60秒频控）
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <span>立即登录</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 font-medium">快速选择演示商户（包含冻结商户测试）：</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {merchants.map((m) => {
                const isFrozen = m.status === '冻结';
                const isSelected = phone === m.adminPhone;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPhone(m.adminPhone);
                      setCode('888888');
                      setSentCodeHint('888888');
                      setErrorMessage('');
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? isFrozen
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                        : isFrozen
                        ? 'bg-rose-50/50 border-rose-200/60 text-slate-700 hover:bg-rose-50'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <UserCheck className={`w-3.5 h-3.5 ${isFrozen ? 'text-rose-500' : 'text-indigo-600'}`} />
                        <span className="font-semibold text-xs text-slate-800">{m.name}</span>
                        {isFrozen && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-rose-100 text-rose-700 rounded font-semibold border border-rose-200">
                            已冻结
                          </span>
                        )}
                        {!isFrozen && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-emerald-50 text-emerald-700 rounded font-medium border border-emerald-200">
                            {m.type}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        管理员: {m.adminName} · 手机: <span className="font-mono text-slate-600">{m.adminPhone}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-indigo-600 font-medium whitespace-nowrap ml-2">填入</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              * 提示：点击“已冻结”商户并尝试登录，可验证系统对冻结状态账号的拦截及提示「商户已被冻结」。
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
