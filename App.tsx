
import React, { useState, useEffect, useCallback } from 'react';
import { ReportState, CampaignItem, Market } from './types';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  LayoutDashboard,
  Info,
  Clock,
  Calculator as CalcIcon,
  Globe,
  RefreshCw,
  Percent,
  Coins,
  AlertCircle,
  XCircle,
  Zap,
  Tag
} from 'lucide-react';

const STORAGE_KEY = 'quick_report_production_data';
// Fallback keys để cứu dữ liệu từ phiên bản cũ nếu key chính trống
const LEGACY_KEYS = ['quick_report_v4', 'quick_report_v3'];

const EXCHANGE_RATES: Record<Market, number> = {
  'ML': 6200,
  'TH': 800,
  'SG': 15600,
};

const DEFAULT_PRICES: Record<Market, string> = {
  'ML': '179',
  'TH': '1200',
  'SG': '80'
};

const MARKET_LABELS: Record<Market, string> = {
  'ML': 'MALAYSIA (ML)',
  'TH': 'THÁI LAN (TH)',
  'SG': 'SINGAPORE (SG)'
};

const getCurrentHourStr = () => {
  const hour = new Date().getHours();
  return hour < 12 ? '10h' : '15h';
};

const getCurrentDateStr = () => `${new Date().getDate()}/${new Date().getMonth() + 1}`;

const evaluateExpression = (expr: string): number => {
  if (!expr) return 0;
  try {
    const cleanExpr = expr.replace(/\s+/g, '');
    if (!/^[0-9.+\-]+$/.test(cleanExpr)) return 0;
    const tokens = cleanExpr.split(/([+\-])/);
    let total = 0;
    let currentOp = '+';
    for (const token of tokens) {
      if (!token) continue;
      if (token === '+' || token === '-') {
        currentOp = token;
      } else {
        const val = parseFloat(token) || 0;
        if (currentOp === '+') total += val;
        else if (currentOp === '-') total -= val;
      }
    }
    return total;
  } catch { return 0; }
};

const parseMetricValue = (val: string): number => {
  if (!val) return 0;
  const normalized = val.toLowerCase().trim().replace(/,/g, '');
  const numMatch = normalized.match(/[\d.]+/);
  if (!numMatch) return 0;
  let num = parseFloat(numMatch[0]);
  if (normalized.includes('k')) num *= 1000;
  else if (normalized.includes('m')) num *= 1000000;
  return num;
};

const formatToK = (val: string | number): string => {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
  if (isNaN(num)) return val.toString();

  if (num >= 1000 || num === 0) {
    const formatted = Math.round(num / 1000);
    return formatted + 'k';
  }
  return num.toString();
};

const INITIAL_ITEM = (market: Market = 'ML', name: string = ''): CampaignItem => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  market,
  ds: '',
  cpi: '',
  cpiInput: '',
  percentCpi: '',
  orders: '',
  pricePerOrder: DEFAULT_PRICES[market],
  ordersCount: '',
  notes: [''],
  diePage: false,
  rejected: false
});

const App: React.FC = () => {
  // Logic khởi tạo state an toàn hơn
  const [report, setReport] = useState<ReportState>(() => {
    try {
      // 1. Tìm dữ liệu từ Storage
      let saved = localStorage.getItem(STORAGE_KEY);

      // 2. Nếu không có key chính, thử tìm ở các key cũ (Migration)
      if (!saved) {
        for (const key of LEGACY_KEYS) {
          const legacy = localStorage.getItem(key);
          if (legacy) {
            saved = legacy;
            break;
          }
        }
      }

      if (saved) {
        const parsed = JSON.parse(saved);

        // Kiểm tra xem items có phải mảng không, nếu không thì coi như dữ liệu hỏng
        const items = Array.isArray(parsed.items) ? parsed.items : [];
        const productCatalog = Array.isArray(parsed.productCatalog) ? parsed.productCatalog : [];

        // 3. Chuẩn hóa dữ liệu (Hydration)
        // Bước này cực kỳ quan trọng: đảm bảo mọi field đều có giá trị hợp lệ
        // kể cả khi dữ liệu cũ bị thiếu.
        const normalizedItems = items.map((item: any) => {
          // Xác định market trước để lấy default price đúng
          const market: Market = ['ML', 'TH', 'SG'].includes(item.market) ? item.market : 'ML';

          return {
            id: item.id || Math.random().toString(36).substr(2, 9),
            name: item.name || '',
            market: market,
            ds: item.ds !== undefined ? item.ds : '',
            cpi: item.cpi !== undefined ? item.cpi : '',
            cpiInput: item.cpiInput !== undefined ? item.cpiInput : '',
            percentCpi: item.percentCpi !== undefined ? item.percentCpi : '',
            orders: item.orders !== undefined ? item.orders : '',
            // Fix lỗi: Nếu thiếu giá, lấy default của MARKET tương ứng chứ không fix cứng ML
            pricePerOrder: item.pricePerOrder !== undefined ? item.pricePerOrder : DEFAULT_PRICES[market],
            ordersCount: item.ordersCount !== undefined ? item.ordersCount : '',
            notes: Array.isArray(item.notes) ? item.notes : [''],
            diePage: item.diePage || false,
            rejected: item.rejected || false
          };
        });

        // Chỉ return dữ liệu đã parse nếu có ít nhất 1 item hoặc catalog
        // Tránh return object rỗng làm reset app
        return {
          userName: parsed.userName || 'Hoàng Anh Tùng',
          time: getCurrentHourStr(), // Luôn cập nhật giờ mới nhất khi reload
          date: getCurrentDateStr(), // Luôn cập nhật ngày mới nhất khi reload
          items: normalizedItems.length > 0 ? normalizedItems : [{ ...INITIAL_ITEM('ML', 'SSK003 ML') }],
          productCatalog: productCatalog.length > 0 ? productCatalog : ['SSK003 ML', 'PRO001 TH', 'SG_PRODUCT_01']
        };
      }
    } catch (e) {
      console.error("Lỗi khôi phục dữ liệu, sử dụng mặc định:", e);
    }

    // Default state an toàn
    return {
      userName: 'Hoàng Anh Tùng',
      time: getCurrentHourStr(),
      date: getCurrentDateStr(),
      items: [{ ...INITIAL_ITEM('ML', 'SSK003 ML') }],
      productCatalog: ['SSK003 ML', 'PRO001 TH', 'SG_PRODUCT_01']
    };
  });

  const [newProductName, setNewProductName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Auto-save: Lưu mỗi khi report thay đổi
  useEffect(() => {
    const saveToStorage = () => {
      try {
        setIsSaved(false);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
        // Giả lập delay nhỏ để người dùng thấy trạng thái "Đang lưu" nếu cần, 
        // nhưng ở đây ta set true ngay vì localStorage là đồng bộ và rất nhanh.
        // Dùng setTimeout để hiệu ứng blink nhẹ nếu update quá nhanh.
        setTimeout(() => setIsSaved(true), 500);
      } catch (error) {
        console.error("Không thể lưu liêu:", error);
        setIsSaved(false); // Hoặc hiện thông báo lỗi
      }
    };

    saveToStorage();
  }, [report]);

  // Real-time Clock: Cập nhật thời gian mỗi 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const liveTime = getCurrentHourStr();
      const liveDate = getCurrentDateStr();

      setReport(prev => {
        if (prev.time === liveTime && prev.date === liveDate) return prev;
        return { ...prev, time: liveTime, date: liveDate };
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshTime = () => {
    setReport(prev => ({ ...prev, time: getCurrentHourStr(), date: getCurrentDateStr() }));
  };

  const addCampaign = (initialName: string = '') => {
    let market: Market = 'ML';
    const nameUpper = initialName.toUpperCase();
    if (nameUpper.includes('ML')) market = 'ML';
    else if (nameUpper.includes('TH')) market = 'TH';
    else if (nameUpper.includes('SG')) market = 'SG';
    else if (report.items.length > 0) market = report.items[report.items.length - 1].market;

    setReport(prev => ({
      ...prev,
      items: [...prev.items, INITIAL_ITEM(market, initialName)]
    }));
  };

  const addToCatalog = () => {
    if (!newProductName.trim()) return;
    if (report.productCatalog.includes(newProductName.trim())) {
      setNewProductName('');
      return;
    }
    setReport(prev => ({
      ...prev,
      productCatalog: [...prev.productCatalog, newProductName.trim()]
    }));
    setNewProductName('');
  };

  const removeFromCatalog = (name: string) => {
    setReport(prev => ({
      ...prev,
      productCatalog: prev.productCatalog.filter(p => p !== name)
    }));
  };

  const removeCampaign = (id: string) => {
    setReport(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const updateItem = (id: string, updates: Partial<CampaignItem>) => {
    setReport(prev => ({
      ...prev,
      items: prev.items.map(i => {
        if (i.id !== id) return i;
        let updated = { ...i, ...updates };

        if (updates.name !== undefined) {
          const nameUpper = updates.name.toUpperCase();
          let detectedMarket: Market | null = null;
          if (nameUpper.includes('ML')) detectedMarket = 'ML';
          else if (nameUpper.includes('TH')) detectedMarket = 'TH';
          else if (nameUpper.includes('SG')) detectedMarket = 'SG';

          if (detectedMarket && detectedMarket !== i.market) {
            updated.market = detectedMarket;
            updated.pricePerOrder = DEFAULT_PRICES[detectedMarket];
          }
        }

        if (updates.market !== undefined) {
          updated.pricePerOrder = DEFAULT_PRICES[updated.market];
        }

        const rate = EXCHANGE_RATES[updated.market];
        if (updates.pricePerOrder !== undefined || updates.ordersCount !== undefined || updates.market !== undefined || updates.name !== undefined) {
          const price = parseFloat(updated.pricePerOrder) || 0;
          const count = parseFloat(updated.ordersCount) || 0;
          if (price > 0 && count > 0) {
            const totalVnd = Math.round(price * count * rate);
            updated.ds = formatToK(totalVnd);
            if (updates.ordersCount !== undefined) updated.orders = `${count}s`;
          }
        }

        if (updates.cpiInput !== undefined || updates.market !== undefined) {
          const costVnd = evaluateExpression(updated.cpiInput);
          updated.cpi = formatToK(costVnd);
        }

        if (updates.ds !== undefined) updated.ds = formatToK(updates.ds);
        if (updates.cpi !== undefined) updated.cpi = formatToK(updates.cpi);

        const currentDsVal = parseMetricValue(updated.ds);
        const currentCpiVal = parseMetricValue(updated.cpi);
        if (currentDsVal > 0 && currentCpiVal > 0) {
          const pct = Math.round((currentCpiVal / currentDsVal) * 100);
          updated.percentCpi = `${pct}%`;
        } else if (currentDsVal > 0 && !updated.cpi) {
          updated.percentCpi = '';
        }
        return updated;
      })
    }));
  };

  const addNote = (itemId: string) => {
    setReport(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === itemId ? { ...i, notes: [...i.notes, ''] } : i)
    }));
  };

  const updateNote = (itemId: string, noteIndex: number, value: string) => {
    setReport(prev => ({
      ...prev,
      items: prev.items.map(i => {
        if (i.id === itemId) {
          const newNotes = [...i.notes];
          newNotes[noteIndex] = value;
          return { ...i, notes: newNotes };
        }
        return i;
      })
    }));
  };

  const removeNote = (itemId: string, noteIndex: number) => {
    setReport(prev => ({
      ...prev,
      items: prev.items.map(i => {
        if (i.id === itemId) {
          const newNotes = i.notes.filter((_, idx) => idx !== noteIndex);
          return { ...i, notes: newNotes.length === 0 ? [''] : newNotes };
        }
        return i;
      })
    }));
  };

  const generateReportText = useCallback(() => {
    const lines = [];
    lines.push(`BCKQ - ${report.userName}`);
    lines.push(`${report.time} - ${report.date}`);
    report.items.forEach(item => {
      lines.push(`${item.name || 'CHƯA ĐẶT TÊN'}`);
      lines.push(`• DS/CPI/%CPI/SỐ ĐƠN:${item.ds || '0'}/${item.cpi || '0'}/${item.percentCpi || '0%'}/${item.orders || '0s'}`);
      if (item.diePage) lines.push(`  ▫ DIE PAGE`);
      if (item.rejected) lines.push(`  ▫ TỪ CHỐI`);
      item.notes.forEach(note => note.trim() && lines.push(`  ▫ ${note.trim()}`));
    });
    return lines.join('\n');
  }, [report]);

  const copyToClipboard = async () => {
    const text = generateReportText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { alert('Không thể copy.'); }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto selection:bg-blue-500/30">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2 tracking-tight">
            <LayoutDashboard className="w-8 h-8 text-blue-500" />
            REPORT <span className="text-blue-500">PRO</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-tight">Hệ thống báo cáo hiệu suất đa thị trường.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-500 ${isSaved ? 'bg-emerald-500/10 text-emerald-500 opacity-100' : 'opacity-0'
            }`}>
            <Check className="w-3 h-3" />
            Đã lưu dữ liệu
          </div>
          <button
            onClick={copyToClipboard}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${copied ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Đã Copy!' : 'Copy Báo Cáo'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7 space-y-6">
          {/* Thông tin chung */}
          <section className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-sm relative overflow-hidden">
            {/* Live Indicator Overlay */}
            <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500/10 border-b border-l border-blue-500/20 rounded-bl-xl flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Live Time</span>
            </div>

            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Info className="w-4 h-4" /> Thông tin chung
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-1">Người báo cáo</label>
                <input
                  type="text"
                  value={report.userName}
                  onChange={(e) => setReport(prev => ({ ...prev, userName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-slate-400 ml-1 flex justify-between items-center">
                  Giờ báo cáo
                  <button onClick={refreshTime} className="text-blue-500 hover:rotate-180 transition-transform duration-500" title="Cập nhật ngay lập tức">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </label>
                <input
                  type="text"
                  value={report.time}
                  onChange={(e) => setReport(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-1">Ngày tháng</label>
                <input
                  type="text"
                  value={report.date}
                  onChange={(e) => setReport(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </section>

          {/* DANH MỤC SẢN PHẨM NHANH */}
          <section className="bg-blue-600/5 p-6 rounded-3xl border border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 fill-blue-400" /> Danh mục sản phẩm nhanh
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addToCatalog()}
                  placeholder="Thêm sản phẩm mới..."
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 w-40 md:w-56"
                />
                <button
                  onClick={addToCatalog}
                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {report.productCatalog.length === 0 && (
                <div className="text-[10px] text-slate-600 italic">Chưa có sản phẩm nào được lưu.</div>
              )}
              {report.productCatalog.map((name) => (
                <div key={name} className="group relative">
                  <button
                    onClick={() => addCampaign(name)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:border-blue-500 hover:text-white hover:bg-blue-600/10 transition-all active:scale-95"
                  >
                    <Tag className="w-3 h-3 text-blue-500" />
                    {name}
                  </button>
                  <button
                    onClick={() => removeFromCatalog(name)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-2 h-2" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Chi tiết chiến dịch
            </h2>
            <button
              onClick={() => addCampaign()}
              className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" /> Thêm trống
            </button>
          </div>

          <div className="space-y-6 pb-20">
            {report.items.map((item) => (
              <div key={item.id} className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 relative group transition-all hover:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  onClick={() => removeCampaign(item.id)}
                  className="absolute top-6 right-6 p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-12 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
                        Tên chiến dịch
                        <span className="text-[10px] text-blue-500 font-bold lowercase italic opacity-60">Gõ 'ML', 'TH' hoặc 'SG' để đổi thị trường</span>
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        placeholder="VD: SSK003 ML"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg font-bold text-blue-100 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Thị trường hiện tại
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(MARKET_LABELS) as Market[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => updateItem(item.id, { market: m })}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${item.market === m
                              ? 'bg-blue-600 text-white shadow-lg scale-105'
                              : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-600 hover:text-slate-300'
                              }`}
                          >
                            <span className="text-base">{m === 'ML' ? '🇲🇾' : m === 'TH' ? '🇹🇭' : '🇸🇬'}</span>
                            {MARKET_LABELS[m]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Calculator Box */}
                  <div className="md:col-span-12 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                        <CalcIcon className="w-4 h-4 text-blue-500" /> BỘ CÔNG CỤ TÍNH TOÁN ({item.market})
                      </div>
                      <div className="bg-blue-500/10 px-3 py-1 rounded-full text-[10px] text-blue-400 font-bold border border-blue-500/20">
                        1 {item.market} = {EXCHANGE_RATES[item.market]} VND
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <Coins className="w-3 h-3 text-yellow-500" /> Giá 1 đơn (Local)
                        </label>
                        <input
                          type="number"
                          value={item.pricePerOrder}
                          onChange={(e) => updateItem(item.id, { pricePerOrder: e.target.value })}
                          placeholder={item.market === 'SG' ? "Tự điền" : "0"}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <Plus className="w-3 h-3 text-blue-500" /> Số lượng đơn
                        </label>
                        <input
                          type="number"
                          value={item.ordersCount}
                          onChange={(e) => updateItem(item.id, { ordersCount: e.target.value })}
                          placeholder="0"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <Percent className="w-3 h-3 text-emerald-500" /> Chi phí (VNĐ) <span className="text-[9px] lowercase italic font-normal">(cho phép + -)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={item.cpiInput}
                            onChange={(e) => updateItem(item.id, { cpiInput: e.target.value })}
                            placeholder="VD: 439000 + 50000"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-400 pr-20"
                          />
                          {(item.cpiInput.includes('+') || item.cpiInput.includes('-')) && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black bg-slate-800 px-2 py-1 rounded text-slate-400">
                              = {formatToK(evaluateExpression(item.cpiInput))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Display Metrics */}
                  <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/50">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Doanh số (VND)</label>
                      <input
                        type="text"
                        value={item.ds}
                        onChange={(e) => updateItem(item.id, { ds: e.target.value })}
                        placeholder="0k"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-blue-400 font-black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chi phí CPI (VND)</label>
                      <input
                        type="text"
                        value={item.cpi}
                        onChange={(e) => updateItem(item.id, { cpi: e.target.value })}
                        placeholder="0k"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-400 font-black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        % CPI <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1 rounded">AUTO</span>
                      </label>
                      <input
                        type="text"
                        value={item.percentCpi}
                        onChange={(e) => updateItem(item.id, { percentCpi: e.target.value })}
                        placeholder="0%"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500 font-black text-yellow-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số đơn hiển thị</label>
                      <input
                        type="text"
                        value={item.orders}
                        onChange={(e) => updateItem(item.id, { orders: e.target.value })}
                        placeholder="0s"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-12 space-y-3 pt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                      <span>Ghi chú / Trạng thái</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateItem(item.id, { diePage: !item.diePage })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${item.diePage
                            ? 'bg-red-600/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                            : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'
                            }`}
                        >
                          <AlertCircle className="w-3 h-3" /> DIE PAGE
                        </button>
                        <button
                          onClick={() => updateItem(item.id, { rejected: !item.rejected })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${item.rejected
                            ? 'bg-orange-600/20 border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                            : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'
                            }`}
                        >
                          <XCircle className="w-3 h-3" /> TỪ CHỐI
                        </button>
                        <button
                          onClick={() => addNote(item.id)}
                          className="text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors font-bold text-[10px]"
                        >
                          <Plus className="w-3 h-3" /> Thêm dòng ghi chú
                        </button>
                      </div>
                    </label>
                    <div className="grid gap-2">
                      {item.notes.map((note, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={note}
                            onChange={(e) => updateNote(item.id, idx, e.target.value)}
                            placeholder="Link FB hoặc nội dung khác..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                          />
                          <button
                            onClick={() => removeNote(item.id, idx)}
                            className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Side */}
        <div className="xl:col-span-5">
          <div className="sticky top-8 space-y-6">
            <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full min-h-[600px] border-b-[8px] border-b-blue-600/20">
              <div className="bg-slate-900/80 backdrop-blur-md p-6 border-b border-slate-800 flex justify-between items-center">
                <span className="text-sm font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Live Preview
                </span>
                <span className="text-[10px] font-bold text-slate-600 uppercase font-mono">Format Báo Cáo</span>
              </div>

              <div className="flex-1 p-10 bg-[#0c111c] text-blue-50 font-mono whitespace-pre-wrap leading-relaxed select-all overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-slate-800">
                <div className="report-content">
                  <div className="mb-2 font-black text-2xl tracking-tighter">BCKQ - {report.userName}</div>
                  <div className="mb-8 text-slate-500 font-bold">{report.time} - {report.date}</div>

                  {report.items.map((item) => (
                    <div key={item.id} className="mb-6">
                      <div className="font-black text-blue-400 text-lg uppercase mb-1">{item.name || 'TÊN_CAMPAIGN'}</div>
                      <div className="ml-2 py-0.5">
                        <span className="text-blue-600 font-bold">•</span> DS/CPI/%CPI/SỐ ĐƠN:
                        <span className="text-white ml-2">
                          {item.ds || '0'}/{item.cpi || '0'}/{item.percentCpi || '0%'}/{item.orders || '0s'}
                        </span>
                      </div>
                      {item.diePage && <div className="ml-5 text-sm text-red-500 font-black uppercase mt-1.5">▫ DIE PAGE</div>}
                      {item.rejected && <div className="ml-5 text-sm text-orange-500 font-black uppercase mt-1.5">▫ TỪ CHỐI</div>}
                      {item.notes.map((note, nIdx) => note.trim() && (
                        <div key={nIdx} className="ml-5 text-sm text-slate-500 flex gap-2 items-start mt-1.5">
                          <span className="text-slate-700 mt-1">▫</span>
                          <span className="break-all font-medium">{note}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-slate-900/50 border-t border-slate-800 backdrop-blur-sm">
                <button
                  onClick={copyToClipboard}
                  className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl active:scale-95 ${copied ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                >
                  {copied ? <Check className="w-7 h-7" /> : <Copy className="w-7 h-7" />}
                  {copied ? 'ĐÃ COPY BÁO CÁO!' : 'COPY BÁO CÁO NGAY'}
                </button>
              </div>
            </div>

            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
              <div className="flex gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl h-fit">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide">Lưu trữ dữ liệu an toàn</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hệ thống đã được nâng cấp để <span className="text-white font-bold">tự động điền</span> các trường bị thiếu khi tải lại trang, đảm bảo bạn không bao giờ phải nhập lại từ đầu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
