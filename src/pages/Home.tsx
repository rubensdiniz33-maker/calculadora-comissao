import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Design Philosophy: Professional Sales Dashboard
 * - Blue (#0033FF) and white palette with Sora typography
 * - Clean, data-focused interface for commission calculations
 * - Responsive grid layout with prominent result display
 * - Real-time calculation feedback with visual progress indicators
 */

interface Input {
  tcv: number;
  cash: number;
  calls: number;
  sales: number;
  refs: number;
  fixed: number;
}

interface Metas {
  rev: number;
  super: number;
  ultra: number;
  conv: number;
  ticket: number;
}

interface CalcResult {
  revBase: number;
  revApplied: number;
  revDesc: string;
  revMeta: number;
  revSuper: number;
  revUltra: number;
  mult: number;
  level: 'meta' | 'super' | 'ultra';
  cashC: number;
  cashDesc: string;
  cashPct: number;
  convC: number;
  convDesc: string;
  convRate: number;
  refC: number;
  refDesc: string;
  tickC: number;
  tickDesc: string;
  ticketVal: number;
  others: number;
  total: number;
  maxBase: number;
  metaTotal: number;
  superTotal: number;
  ultraTotal: number;
}

const fmt = (n: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

const formatNumberInput = (value: string) => {
  return value.replace(/\D/g, '');
};

const displayFormattedNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

const calcComm = (inp: Input, m: Metas): CalcResult => {
  const revPct = m.rev > 0 ? (inp.tcv / m.rev) * 100 : 0;

  let revBase = 0,
    revDesc = '';
  if (revPct >= 100) {
    revBase = 3500;
    revDesc = `${revPct.toFixed(2)}% da meta — 100% atingido`;
  } else if (revPct >= 86) {
    revBase = 2800;
    revDesc = `${revPct.toFixed(2)}% — faixa 86–99%`;
  } else if (revPct >= 71) {
    revBase = 2500;
    revDesc = `${revPct.toFixed(2)}% — faixa 71–85%`;
  } else {
    revBase = 0;
    revDesc = `${revPct.toFixed(2)}% da meta — abaixo de 71%`;
  }

  let mult = 1.0,
    level: 'meta' | 'super' | 'ultra' = 'meta';
  if (inp.tcv >= m.ultra && revBase === 3500) {
    mult = 1.3;
    level = 'ultra';
  } else if (inp.tcv >= m.super && revBase === 3500) {
    mult = 1.2;
    level = 'super';
  }

  const revApplied = revBase * mult;

  const revMeta = revBase;
  const revSuper = revBase === 3500 ? 3500 * 1.2 : revBase;
  const revUltra = revBase === 3500 ? 3500 * 1.3 : revBase;

  const cashPct = m.rev > 0 ? (inp.cash / m.rev) * 100 : 0;
  let cashC = 0,
    cashDesc = '';
  if (cashPct >= 81) {
    cashC = 800;
    cashDesc = `${cashPct.toFixed(2)}% — acima de 81%`;
  } else if (cashPct >= 75) {
    cashC = 350;
    cashDesc = `${cashPct.toFixed(2)}% — faixa 75–80%`;
  } else if (cashPct >= 66) {
    cashC = 200;
    cashDesc = `${cashPct.toFixed(2)}% — faixa 66–75%`;
  } else {
    cashC = 0;
    cashDesc = `${cashPct.toFixed(2)}% — abaixo de 66%`;
  }

  const convRate = inp.calls > 0 ? (inp.sales / inp.calls) * 100 : 0;
  const convC = m.conv > 0 && convRate >= m.conv ? 500 : 0;
  const convDesc = `${convRate.toFixed(2)}% de conversão (meta: ${m.conv}%)`;

  let refC = 0,
    refDesc = '';
  if (inp.refs >= 41) {
    refC = 400;
    refDesc = `${inp.refs} indicações — acima de 41`;
  } else if (inp.refs >= 21) {
    refC = 200;
    refDesc = `${inp.refs} indicações — faixa 21–40`;
  } else {
    refC = 0;
    refDesc = `${inp.refs} indicações — abaixo de 21`;
  }

  const ticketVal = inp.sales > 0 ? inp.tcv / inp.sales : 0;
  const tickC = m.ticket > 0 && ticketVal >= m.ticket ? 300 : 0;
  const tickDesc = `${fmt(ticketVal)} (meta: ${fmt(m.ticket)})`;

  const others = cashC + convC + refC + tickC;
  const total = revApplied + others;

  const maxBase = 3500 * 1.3 + 800 + 500 + 400 + 300;

  return {
    revBase,
    revApplied,
    revDesc,
    revMeta,
    revSuper,
    revUltra,
    mult,
    level,
    cashC,
    cashDesc,
    cashPct,
    convC,
    convDesc,
    convRate,
    refC,
    refDesc,
    tickC,
    tickDesc,
    ticketVal,
    others,
    total,
    maxBase,
    metaTotal: revMeta + others,
    superTotal: revSuper + others,
    ultraTotal: revUltra + others,
  };
};

const BreakdownItem = ({
  name,
  val,
  max,
  desc,
}: {
  name: string;
  val: number;
  max: number;
  desc: string;
}) => {
  const p = Math.min(100, max > 0 ? (val / max) * 100 : 0);
  const pipCls = val === 0 ? '' : val >= max ? 'max' : 'on';
  const valCls = val === 0 ? 'z' : val >= max ? 'm' : '';
  const barCls = val >= max ? 'm' : '';

  return (
    <div className="bk-item">
      <div className="bk-r1">
        <div className="bk-name">
          <div className={`bk-pip ${pipCls}`}></div>
          {name}
        </div>
        <div className="bk-amts">
          <span className={`bk-val ${valCls}`}>{fmt(val)}</span>
          <span className="bk-max">/ {fmt(max)}</span>
        </div>
      </div>
      <div className="bk-desc">{desc}</div>
      <div className="bk-track">
        <div className={`bk-bar ${barCls}`} style={{ width: `${p}%` }}></div>
      </div>
    </div>
  );
};

export default function Home() {
  const [inp, setInp] = useState<Input>({
    tcv: 0,
    cash: 0,
    calls: 0,
    sales: 0,
    refs: 0,
    fixed: 0,
  });

  const [inputValues, setInputValues] = useState<Record<string, string>>({
    tcv: '',
    cash: '',
    calls: '',
    sales: '',
    refs: '',
    fixed: '',
  });

  const [metaValues, setMetaValues] = useState<Record<string, string>>({
    rev: '',
    super: '',
    ultra: '',
    conv: '',
    ticket: '',
  });

  const [metas, setMetas] = useState<Metas>({
    rev: 0,
    super: 0,
    ultra: 0,
    conv: 0,
    ticket: 0,
  });

  const [result, setResult] = useState<CalcResult>(
    calcComm(
      { tcv: 0, cash: 0, calls: 0, sales: 0, refs: 0, fixed: 0 },
      { rev: 0, super: 0, ultra: 0, conv: 0, ticket: 0 }
    )
  );



  useEffect(() => {
    setResult(calcComm(inp, metas));
  }, [inp, metas]);

  const handleInputChange = (field: keyof Input, valueStr: string) => {
    const cleanValue = formatNumberInput(valueStr);
    setInputValues(prev => ({ ...prev, [field]: cleanValue }));
    const numValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    const newInp = { ...inp, [field]: numValue };
    setInp(newInp);
  };

  const handleMetaChange = (field: keyof Metas, valueStr: string) => {
    const cleanValue = formatNumberInput(valueStr);
    setMetaValues(prev => ({ ...prev, [field]: cleanValue }));
    const numValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    const newMetas = { ...metas, [field]: numValue };
    setMetas(newMetas);
  };

  if (!result) return <div>Carregando...</div>;

  const pct = Math.min(100, Math.round((result.total / result.maxBase) * 100));

  const tips: string[] = [];
  if (metas.rev > 0) {
    if (result.revBase === 0) {
      const target = metas.rev * 0.71;
      tips.push(
        `Receita em ${(inp.tcv / metas.rev) * 100}% — precisa de ${fmt(target)} para desbloquear R$ 2.500,00`
      );
    } else if ((inp.tcv / metas.rev) * 100 < 86) {
      const target = metas.rev * 0.86;
      tips.push(
        `Chegue a 86% da meta (${fmt(target)}) para subir para R$ 2.800,00`
      );
    } else if (inp.tcv < metas.rev) {
      tips.push(`Faltam ${fmt(metas.rev - inp.tcv)} para 100% da meta e R$ 3.500,00`);
    } else if (result.level === 'meta' && metas.super > 0) {
      tips.push(
        `Meta atingida! Faltam ${fmt(metas.super - inp.tcv)} em TCV para a Super Meta (×1.2 → R$ 4.200,00)`
      );
    } else if (result.level === 'super' && metas.ultra > 0) {
      tips.push(
        `Super Meta! Faltam ${fmt(metas.ultra - inp.tcv)} em TCV para a Ultra Meta (×1.3 → R$ 4.550,00)`
      );
    }
  }

  if (result.cashC === 0 && metas.rev > 0) {
    const target = metas.rev * 0.66;
    tips.push(
      `Caixa em ${result.cashPct.toFixed(2)}% — precisa de 66% (${fmt(target)}) para ganhar R$ 200,00`
    );
  } else if (result.cashC < 800) {
    tips.push(
      `Caixa em ${result.cashPct.toFixed(2)}% — chegue a 81% para R$ 800,00`
    );
  }
  if (result.convC === 0 && metas.conv > 0) {
    tips.push(
      `Conversão atual: ${result.convRate.toFixed(2)}% — meta é ${metas.conv}% para R$ 500,00`
    );
  }
  if (result.refC === 0) {
    tips.push(`Colete 21+ indicações — você tem ${inp.refs} até agora`);
  }
  if (result.tickC === 0 && metas.ticket > 0) {
    tips.push(
      `Ticket médio: ${fmt(result.ticketVal)} — meta é ${fmt(metas.ticket)} para R$ 300,00`
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          height: '60px',
          padding: '0 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-.02em',
              textTransform: 'uppercase',
            }}
          >
            4JURIS
          </div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: 'var(--brand)',
              letterSpacing: '.15em',
            }}
          >
            COMISSÃO
          </div>
        </div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '.08em',
            color: 'var(--text3)',
            background: 'var(--surf2)',
            border: '1px solid var(--border)',
            padding: '5px 12px',
            borderRadius: '99px',
          }}
        >
          v1.0
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(150deg, var(--brand) 0%, #0020b8 100%)',
          padding: '56px 36px 48px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '.16em',
            color: 'rgba(255,255,255,.7)',
            border: '1px solid rgba(255,255,255,.22)',
            padding: '5px 16px',
            borderRadius: '99px',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          CALCULADORA INTELIGENTE
        </div>
        <h1
          style={{
            fontSize: 'clamp(26px, 5vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-.04em',
            color: '#fff',
            marginBottom: '12px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Sua Projeção de Ganhos
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,.68)',
            maxWidth: '440px',
            margin: '0 auto 36px',
            lineHeight: 1.7,
            position: 'relative',
            zIndex: 1,
          }}
        >
          Insira seus dados de vendas e veja exatamente quanto você vai ganhar
          com base nas metas e bônus.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,.13)',
              border: '1px solid rgba(255,255,255,.22)',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              minWidth: '120px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,.55)',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                marginBottom: '3px',
              }}
            >
              Meta
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>
              {fmt(result.metaTotal || 0)}
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,.13)',
              border: '1px solid rgba(255,255,255,.22)',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              minWidth: '120px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,.55)',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                marginBottom: '3px',
              }}
            >
              Super
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>
              {fmt(result.superTotal || 0)}
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,.13)',
              border: '1px solid rgba(255,255,255,.22)',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              minWidth: '120px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,.55)',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                marginBottom: '3px',
              }}
            >
              Ultra
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>
              {fmt(result.ultraTotal || 0)}
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 22px 80px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '310px 1fr',
            gap: '18px',
            alignItems: 'start',
          }}
        >
          {/* Left: Inputs */}
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 1px 4px rgba(0,30,180,.05)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '.12em',
                color: 'var(--brand)',
                textTransform: 'uppercase',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '2px',
                  background: 'var(--brand)',
                  borderRadius: '1px',
                }}
              />
              DADOS DE VENDAS
            </div>

            {/* TCV */}
            <div style={{ marginBottom: '13px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  marginBottom: '5px',
                }}
              >
                TCV (Total Contract Value)
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--brand)',
                    pointerEvents: 'none',
                  }}
                >
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValues.tcv}
                  onChange={(e) => handleInputChange('tcv', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surf2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 12px 12px 44px',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                  placeholder="100.000"
                />
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text3)',
                  marginTop: '4px',
                  lineHeight: 1.5,
                }}
              >
                Valor total de contratos
              </div>
            </div>

            {/* Cash */}
            <div style={{ marginBottom: '13px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  marginBottom: '5px',
                }}
              >
                Caixa Gerado
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--brand)',
                    pointerEvents: 'none',
                  }}
                >
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValues.cash}
                  onChange={(e) => handleInputChange('cash', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surf2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 12px 12px 44px',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                  placeholder="50.000"
                />
              </div>
            </div>

            {/* Calls */}
            <div style={{ marginBottom: '13px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  marginBottom: '5px',
                }}
              >
                Calls Realizadas
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValues.calls}
                  onChange={(e) => handleInputChange('calls', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surf2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 12px',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                  placeholder="50"
                />
              </div>
            </div>

            {/* Sales */}
            <div style={{ marginBottom: '13px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  marginBottom: '5px',
                }}
              >
                Vendas Fechadas
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValues.sales}
                  onChange={(e) => handleInputChange('sales', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surf2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 12px',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                  placeholder="15"
                />
              </div>
            </div>

            {/* Refs */}
            <div style={{ marginBottom: '13px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  marginBottom: '5px',
                }}
              >
                Indicações
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValues.refs}
                  onChange={(e) => handleInputChange('refs', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surf2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 12px',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Fixed */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  marginBottom: '5px',
                }}
              >
                Salário Fixo
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--brand)',
                    pointerEvents: 'none',
                  }}
                >
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValues.fixed}
                  onChange={(e) => handleInputChange('fixed', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surf2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 12px 12px 44px',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                  placeholder="3.000"
                />
              </div>
            </div>

            {/* Divider */}
            <hr
              style={{
                border: 'none',
                borderTop: '1px solid var(--border)',
                margin: '14px 0',
              }}
            />

            {/* Metas */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '.12em',
                color: 'var(--brand)',
                textTransform: 'uppercase',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '2px',
                  background: 'var(--brand)',
                  borderRadius: '1px',
                }}
              />
              METAS
            </div>

            {/* Meta Rev */}
            <div style={{ marginBottom: '13px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  marginBottom: '5px',
                }}
              >
                Meta de Receita
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--brand)',
                    pointerEvents: 'none',
                  }}
                >
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={metaValues.rev}
                  onChange={(e) => handleMetaChange('rev', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surf2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 12px 12px 44px',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                  placeholder="100.000"
                />
              </div>
            </div>

            {/* Meta Super */}
            <div style={{ marginBottom: '13px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  marginBottom: '5px',
                }}
              >
                Super Meta
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--brand)',
                    pointerEvents: 'none',
                  }}
                >
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={metaValues.super}
                  onChange={(e) => handleMetaChange('super', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surf2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 12px 12px 44px',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                  placeholder="120.000"
                />
              </div>
            </div>

            {/* Meta Ultra */}
            <div style={{ marginBottom: '13px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  marginBottom: '5px',
                }}
              >
                Ultra Meta
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--brand)',
                    pointerEvents: 'none',
                  }}
                >
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={metaValues.ultra}
                  onChange={(e) => handleMetaChange('ultra', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surf2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 12px 12px 44px',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                  placeholder="150.000"
                />
              </div>
            </div>

            {/* Meta Conv */}
            <div style={{ marginBottom: '13px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  marginBottom: '5px',
                }}
              >
                Meta Conversão (%)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={metaValues.conv}
                  onChange={(e) => handleMetaChange('conv', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surf2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 12px',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                  placeholder="15"
                />
              </div>
            </div>

            {/* Meta Ticket */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  marginBottom: '5px',
                }}
              >
                Meta Ticket Médio
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--brand)',
                    pointerEvents: 'none',
                  }}
                >
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={metaValues.ticket}
                  onChange={(e) => handleMetaChange('ticket', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surf2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 12px 12px 44px',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                  placeholder="5.000"
                />
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {/* Total Card */}
            <div
              style={{
                background: 'var(--brand)',
                borderRadius: '16px',
                padding: '22px',
                marginBottom: '14px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,51,255,.28)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-80px',
                  right: '-80px',
                  width: '230px',
                  height: '230px',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  background:
                    'radial-gradient(circle, rgba(255,255,255,.12) 0%, transparent 65%)',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '.14em',
                      color: 'rgba(255,255,255,.6)',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                    }}
                  >
                    Comissão em Tempo Real
                  </div>
                <div
                  style={{
                    fontSize: 'clamp(30px,5vw,46px)',
                    fontWeight: 800,
                    letterSpacing: '-.035em',
                    color: '#fff',
                    lineHeight: 1,
                  }}
                >
                  {fmt(result.total)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '.14em',
                    color: 'rgba(255,255,255,.6)',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Sua Projeção de Ganhos
                </div>
                  <div
                    style={{
                      fontSize: 'clamp(18px,3vw,26px)',
                      fontWeight: 800,
                      letterSpacing: '-.025em',
                      color: '#fff',
                    }}
                  >
                    {fmt(result.total + inp.fixed)}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,.5)',
                      marginTop: '3px',
                    }}
                  >
                    fixo {fmt(inp.fixed)} + variável
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,.6)',
                  marginBottom: '6px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <span>{pct}% do potencial máximo</span>
                <span>{fmt(result.maxBase)}</span>
              </div>
              <div
                style={{
                  background: 'rgba(0,0,0,.22)',
                  borderRadius: '99px',
                  height: '5px',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: '99px',
                    background: 'rgba(255,255,255,.9)',
                    transition: 'width .4s cubic-bezier(.4,0,.2,1)',
                    width: `${pct}%`,
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  marginTop: '14px',
                  borderTop: '1px solid rgba(255,255,255,.15)',
                  paddingTop: '12px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '.1em',
                      color: 'rgba(255,255,255,.5)',
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                    }}
                  >
                    Fixo
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,.95)',
                    }}
                  >
                    {fmt(inp.fixed)}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    borderLeft: '1px solid rgba(255,255,255,.15)',
                    paddingLeft: '12px',
                    marginLeft: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '.1em',
                      color: 'rgba(255,255,255,.5)',
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                    }}
                  >
                    Faltam
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,.95)',
                    }}
                  >
                    {fmt(Math.max(0, result.maxBase - result.total))}
                  </div>
                </div>
              </div>
            </div>

            {/* Level Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              {/* Meta */}
              <div
                style={{
                  background:
                    result.revBase > 0 ? 'var(--brand-pale)' : 'var(--white)',
                  border:
                    result.revBase > 0
                      ? '2px solid var(--brand)'
                      : '2px solid var(--border)',
                  borderRadius: '13px',
                  padding: '13px 14px',
                  transition: 'all .2s',
                }}
              >
                <div style={{ fontSize: '15px', marginBottom: '4px' }}>🎯</div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    color: 'var(--text2)',
                    textTransform: 'uppercase',
                  }}
                >
                  Meta
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: 'var(--brand)',
                    marginTop: '4px',
                    letterSpacing: '-.02em',
                  }}
                >
                  {fmt(result.metaTotal)}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text3)',
                    marginTop: '2px',
                  }}
                >
                  total {fmt(result.metaTotal + inp.fixed)}
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    color: 'var(--text3)',
                    marginTop: '6px',
                    background: 'var(--surf2)',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}
                >
                  TCV ≥ {fmt(metas.rev)}
                </div>
              </div>

              {/* Super */}
              <div
                style={{
                  background:
                    result.level === 'super' || result.level === 'ultra'
                      ? 'var(--amber-bg)'
                      : 'var(--white)',
                  border:
                    result.level === 'super' || result.level === 'ultra'
                      ? '2px solid var(--amber)'
                      : '2px solid var(--border)',
                  borderRadius: '13px',
                  padding: '13px 14px',
                  transition: 'all .2s',
                }}
              >
                <div style={{ fontSize: '15px', marginBottom: '4px' }}>⭐</div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    color: 'var(--text2)',
                    textTransform: 'uppercase',
                  }}
                >
                  Super
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color:
                      result.level === 'super' || result.level === 'ultra'
                        ? 'var(--amber)'
                        : 'var(--brand)',
                    marginTop: '4px',
                    letterSpacing: '-.02em',
                  }}
                >
                  {fmt(result.superTotal)}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text3)',
                    marginTop: '2px',
                  }}
                >
                  total {fmt(result.superTotal + inp.fixed)}
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    color: 'var(--text3)',
                    marginTop: '6px',
                    background: 'var(--surf2)',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}
                >
                  TCV ≥ {fmt(metas.super)}
                </div>
              </div>

              {/* Ultra */}
              <div
                style={{
                  background:
                    result.level === 'ultra'
                      ? 'var(--green-bg)'
                      : 'var(--white)',
                  border:
                    result.level === 'ultra'
                      ? '2px solid var(--green)'
                      : '2px solid var(--border)',
                  borderRadius: '13px',
                  padding: '13px 14px',
                  transition: 'all .2s',
                }}
              >
                <div style={{ fontSize: '15px', marginBottom: '4px' }}>🚀</div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    color: 'var(--text2)',
                    textTransform: 'uppercase',
                  }}
                >
                  Ultra
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color:
                      result.level === 'ultra' ? 'var(--green)' : 'var(--brand)',
                    marginTop: '4px',
                    letterSpacing: '-.02em',
                  }}
                >
                  {fmt(result.ultraTotal)}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text3)',
                    marginTop: '2px',
                  }}
                >
                  total {fmt(result.ultraTotal + inp.fixed)}
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    color: 'var(--text3)',
                    marginTop: '6px',
                    background: 'var(--surf2)',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}
                >
                  TCV ≥ {fmt(metas.ultra)}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <BreakdownItem
                name="Meta de receita"
                val={result.revApplied}
                max={3500 * result.mult}
                desc={result.revDesc + (result.mult > 1.0 ? ` × ${result.mult}` : '')}
              />
              <BreakdownItem
                name="Caixa gerado"
                val={result.cashC}
                max={800}
                desc={result.cashDesc}
              />
              <BreakdownItem
                name="Taxa de conversão"
                val={result.convC}
                max={500}
                desc={result.convDesc}
              />
              <BreakdownItem
                name="Coleta de indicações"
                val={result.refC}
                max={400}
                desc={result.refDesc}
              />
              <BreakdownItem
                name="Ticket médio"
                val={result.tickC}
                max={300}
                desc={result.tickDesc}
              />
            </div>

            {/* Steps / Tips */}
            <div
              style={{
                background: 'var(--brand-pale)',
                border: '1px solid var(--brand-light)',
                borderRadius: '12px',
                padding: '14px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  color: 'var(--text3)',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                Próximos Passos
              </div>
              {result.level === 'ultra' && result.others === 800 + 500 + 400 + 300 ? (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--green)',
                    fontWeight: 700,
                  }}
                >
                  ✦ Ultra Meta com tudo no máximo — remuneração total garantida!
                </div>
              ) : tips.length > 0 ? (
                tips.map((tip, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '11px',
                      color: 'var(--text2)',
                      marginBottom: i < tips.length - 1 ? '6px' : 0,
                      paddingLeft: '14px',
                      position: 'relative',
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        color: 'var(--brand-muted)',
                      }}
                    >
                      →
                    </span>
                    {tip}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text2)',
                    paddingLeft: '14px',
                    position: 'relative',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      color: 'var(--brand-muted)',
                    }}
                  >
                    →
                  </span>
                  Preencha as metas e dados para ver sua projeção.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --brand: #0033FF;
          --brand-hover: #0029cc;
          --brand-pale: #f0f4ff;
          --brand-light: #e4ebff;
          --brand-mid: #b3c2f5;
          --brand-muted: #6678cc;
          --bg: #f5f7fe;
          --white: #ffffff;
          --surf2: #f0f3fc;
          --border: #dde4f8;
          --border-hi: #b3c0ee;
          --text: #0a1040;
          --text2: #364080;
          --text3: #6878a8;
          --green: #15803d;
          --green-bg: #f0fdf4;
          --green-border: #86efac;
          --amber: #b45309;
          --amber-bg: #fffbeb;
          --amber-border: #fcd34d;
          --purple: #7c3aed;
          --purple-bg: #f5f3ff;
          --purple-border: #c4b5fd;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'Sora', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
        }

        input:focus {
          border-color: var(--brand) !important;
          box-shadow: 0 0 0 3px rgba(0, 51, 255, 0.1) !important;
          background: var(--white) !important;
        }

        .bk-item {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
        }

        .bk-r1 {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .bk-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bk-pip {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--border-hi);
        }

        .bk-pip.on {
          background: var(--brand);
        }

        .bk-pip.max {
          background: var(--green);
        }

        .bk-amts {
          font-size: 12px;
          font-weight: 600;
        }

        .bk-val {
          color: var(--brand);
        }

        .bk-val.m {
          color: var(--green);
        }

        .bk-val.z {
          color: var(--text3);
        }

        .bk-max {
          color: var(--text3);
          margin-left: 4px;
        }

        .bk-desc {
          font-size: 11px;
          color: var(--text3);
          margin-bottom: 8px;
        }

        .bk-track {
          height: 4px;
          background: var(--surf2);
          border-radius: 99px;
          overflow: hidden;
        }

        .bk-bar {
          height: 100%;
          background: var(--brand);
          border-radius: 99px;
          transition: width 0.3s ease;
        }

        .bk-bar.m {
          background: var(--green);
        }

        @media (max-width: 800px) {
          div[style*="grid-template-columns: 310px 1fr"] {
            grid-template-columns: 1fr !important;
          }
          header {
            padding: 0 18px !important;
          }
          section[style*="background: linear-gradient"] {
            padding: 44px 18px 36px !important;
          }
          main {
            padding: 24px 14px 60px !important;
          }
        }

        @media (max-width: 580px) {
          div[style*="grid-template-columns: repeat(3,1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
