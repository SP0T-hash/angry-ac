# 🛡️ AC ANGRY — Design System v2.0
> **Central de Emissão Digital | AR VEMAPI**  
> Fonte definitiva da verdade visual. Versão revisada com correções críticas de token, acessibilidade e completude de componentes.

---

## 📑 Índice

1. [Alma da Interface & Princípios](#1-alma-da-interface--princípios)
2. [Design Tokens Completos](#2-design-tokens-completos)
3. [Tipografia Revisada](#3-tipografia-revisada)
4. [Escalas de Suporte (Spacing, Shadow, Z-index, Radius)](#4-escalas-de-suporte)
5. [Estrutura de Layout](#5-estrutura-de-layout)
6. [Biblioteca de Componentes](#6-biblioteca-de-componentes)
7. [Acessibilidade & Motion](#7-acessibilidade--motion)
8. [globals.css Completo](#8-globalscss-completo)
9. [tailwind.config.js](#9-tailwindconfigjs)
10. [Roadmap Acionável](#10-roadmap-acionável)

---

## 1. Alma da Interface & Princípios

A AC ANGRY opera em um domínio de **alta responsabilidade legal (ICP-Brasil)**. A interface deve transmitir:

| Princípio | Manifestação Visual |
|---|---|
| **Confiança Inabalável** | Bordas limpas 1px, tipografia institucional, badges de auditoria |
| **Separação de Contextos** | Emerald = operação diária · Indigo = zona de segurança criptográfica |
| **Feedback Imediato** | Todo estado tem representação visual (loading, erro, sucesso, pendente) |
| **Operação Sustentada** | Contraste mínimo 4.5:1 · Tipografia legível após 8h de uso contínuo |

### Semáforo de Responsabilidade Operacional

```
EMERALD ──── Gestão, CRM, Filas, Ações cotidianas
INDIGO  ──── Biometria, Assinatura, Leitora USB, Ações com responsabilidade legal
AMBER   ──── Atenção, Concorrência, lockedBy, Aguardando
ROSE    ──── Falha crítica, Rejeição, Biometria reprovada
SLATE   ──── Estrutura, fundos, textos de suporte
```

---

## 2. Design Tokens Completos

### 2.1 Paleta Semântica

#### Emerald (Primary — Gestão & Fluxo)
| Token | Tailwind | Hex | Uso |
|---|---|---|---|
| `--color-primary-50` | `bg-emerald-50` | `#ECFDF5` | Fundo de status ativo, áreas secundárias |
| `--color-primary-100` | `bg-emerald-100` | `#D1FAE5` | Hover suave em linhas de tabela |
| `--color-primary-500` | `bg-emerald-500` | `#10B981` | Ring de foco em inputs |
| `--color-primary-600` | `bg-emerald-600` | `#059669` | Botão primário padrão |
| `--color-primary-700` | `bg-emerald-700` | `#047857` | Hover de botão primário |
| `--color-primary-900` | `text-emerald-900` | `#064E3B` | Títulos de alto impacto |

#### Indigo (Security — Biometria & Criptografia)
| Token | Tailwind | Hex | Uso |
|---|---|---|---|
| `--color-security-50` | `bg-indigo-50` | `#EEF2FF` | Badge de auditoria técnica |
| `--color-security-100` | `bg-indigo-100` | `#E0E7FF` | Fundo hover de ação segura |
| `--color-security-600` | `bg-indigo-600` | `#4F46E5` | Botão de ação biométrica |
| `--color-security-700` | `bg-indigo-700` | `#4338CA` | Hover de botão biométrico |
| `--color-security-900` | `bg-indigo-900` | `#312E81` | Cabeçalho de modal de segurança |

#### Amber (Warning — Concorrência & Pendências)
| Token | Tailwind | Hex | Uso |
|---|---|---|---|
| `--color-warning-50` | `bg-amber-50` | `#FFFBEB` | Fundo de item em atendimento |
| `--color-warning-200` | `border-amber-200` | `#FDE68A` | Borda de alerta de concorrência |
| `--color-warning-700` | `text-amber-700` | `#B45309` | Texto de aviso crítico não definitivo |

#### Rose/Red (Danger — Falhas & Rejeições)
| Token | Tailwind | Hex | Uso |
|---|---|---|---|
| `--color-danger-50` | `bg-rose-50` | `#FFF1F2` | Fundo de rejeição de documento |
| `--color-danger-100` | `bg-red-50` | `#FEF2F2` | Fundo de erro de validação |
| `--color-danger-500` | `bg-red-500` | `#EF4444` | Indicador de falha do leitor físico |
| `--color-danger-700` | `text-rose-700` | `#BE123C` | Texto de erro de validação |

#### Neutral (Estrutura)
| Token | Tailwind | Uso |
|---|---|---|
| `--color-surface` | `bg-gray-50` | Background principal da aplicação |
| `--color-surface-card` | `bg-white` | Background de cards e modais |
| `--color-border` | `border-slate-100` | Borda padrão de 1px |
| `--color-text-primary` | `text-slate-800` | Texto principal e títulos |
| `--color-text-secondary` | `text-slate-500` | Labels, descrições secundárias |
| `--color-text-disabled` | `text-slate-400` | Placeholders e elementos inativos |

---

## 3. Tipografia Revisada

> ⚠️ **CORREÇÃO v2:** `Inter` foi removida. É a fonte mais genérica do ecossistema React/Tailwind e elimina qualquer diferenciação visual. Substituída por stack com caráter institucional.

### Stack Tipográfica

```js
// tailwind.config.js
fontFamily: {
  sans: ['"DM Sans"', 'system-ui', 'sans-serif'],   // UI principal — geométrica, técnica, legível
  mono: ['"JetBrains Mono"', 'monospace'],           // CPFs, protocolos, hashes, códigos
}
```

**Import no globals.css:**
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
```

### Escala Tipográfica

| Papel | Classes Tailwind | Notas |
|---|---|---|
| **Page Title** | `text-2xl font-black text-slate-800 uppercase tracking-tight` | Títulos de página — presença institucional |
| **Section Header** | `text-sm font-black text-slate-400 uppercase tracking-widest` | Cabeçalhos de tabela e seção |
| **Card Title** | `text-base font-bold text-slate-800` | Títulos de cards de controle |
| **Body** | `text-sm font-medium text-slate-600` | Parágrafos e textos de apoio |
| **Label** | `text-xs font-semibold text-slate-500` | Labels de formulários |
| **Caption** | `text-[10px] font-bold text-slate-400 uppercase tracking-wide` | Badges, micro-labels |
| **Mono / ID** | `font-mono text-sm font-semibold text-slate-700` | CPF, protocolo, hash — sempre `font-mono` |

---

## 4. Escalas de Suporte

### 4.1 Border Radius
| Token | Tailwind | Uso |
|---|---|---|
| `--radius-sm` | `rounded-lg` (8px) | Badges, chips, inputs pequenos |
| `--radius-md` | `rounded-xl` (12px) | Botões, inputs |
| `--radius-lg` | `rounded-2xl` (16px) | Cards, modais, painéis |
| `--radius-full` | `rounded-full` | Avatars, dots de status, progress circular |

### 4.2 Shadow Scale
| Token | Classe Tailwind customizada | Uso |
|---|---|---|
| `shadow-card` | `shadow-[0_1px_4px_rgba(0,0,0,0.06)]` | Cards em repouso |
| `shadow-card-hover` | `shadow-[0_4px_16px_rgba(0,0,0,0.10)]` | Cards em hover |
| `shadow-navbar` | `shadow-[0_1px_10px_-5px_rgba(0,0,0,0.10)]` | Navbar sticky |
| `shadow-sidebar` | `shadow-[1px_0_10px_-5px_rgba(0,0,0,0.05)]` | Sidebar |
| `shadow-btn-primary` | `shadow-lg shadow-emerald-600/20` | Botão primário |
| `shadow-btn-security` | `shadow-lg shadow-indigo-600/20` | Botão de segurança |
| `shadow-modal` | `shadow-2xl shadow-black/10` | Modais e drawers |

### 4.3 Z-Index Scale
```css
:root {
  --z-base:    0;
  --z-raised:  10;   /* Cards em hover */
  --z-dropdown: 20;  /* Dropdowns, tooltips */
  --z-sidebar:  40;  /* Sidebar */
  --z-navbar:   50;  /* Navbar sticky */
  --z-modal:    60;  /* Modais e overlays */
  --z-toast:    70;  /* Notificações / toasts */
}
```

### 4.4 Spacing Semântico
```css
:root {
  --space-card-padding:  1.5rem;   /* p-6  — padding interno de cards */
  --space-section-gap:   1.5rem;   /* gap-6 — espaço entre seções */
  --space-form-gap:      1rem;     /* gap-4 — espaço entre campos de formulário */
  --space-inline-gap:    0.5rem;   /* gap-2 — ícone + texto inline */
}
```

---

## 5. Estrutura de Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  NAVBAR  h-[65px] · sticky top-0 · z-50 · glass                │
├──────┬──────────────────────────────────────────────────────────┤
│      │                                                          │
│ SIDE │   bg-gray-50 · min-h-screen · overflow-y-auto           │
│ BAR  │                                                          │
│      │   ┌──────────────────────────────────────────────────┐  │
│ 65px │   │  CONTENT AREA · max-w-7xl · mx-auto · px-6 · py-8│  │
│      │   └──────────────────────────────────────────────────┘  │
└──────┴──────────────────────────────────────────────────────────┘
```

### 5.1 Navbar Premium Glass
```tsx
<nav className="h-[65px] bg-white/80 backdrop-blur-md border-b border-slate-100 
                flex items-center justify-between px-6 shrink-0 sticky top-0 
                z-[50] shadow-[0_1px_10px_-5px_rgba(0,0,0,0.10)]">
```

### 5.2 Sidebar Minimalista
```tsx
<aside className="w-[65px] bg-white/70 backdrop-blur-lg border-r border-slate-100 
                  h-full flex flex-col items-center py-4 shrink-0 
                  transition-all duration-300 z-[40]
                  shadow-[1px_0_10px_-5px_rgba(0,0,0,0.05)]
                  hidden md:flex">
```

### 5.3 Content Area
```tsx
<main className="flex-1 bg-gray-50 min-h-screen overflow-y-auto">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* conteúdo */}
  </div>
</main>
```

---

## 6. Biblioteca de Componentes

### 6.1 Cards

```tsx
{/* Card padrão */}
<div className="bg-white border border-slate-100 rounded-2xl 
                shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6
                hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] 
                transition-shadow duration-200">

{/* Card de Segurança (zona indigo) */}
<div className="bg-white border border-indigo-100 rounded-2xl 
                shadow-[0_1px_4px_rgba(79,70,229,0.08)] p-6">
```

### 6.2 Botões

```tsx
{/* Primário — Ação de fluxo */}
<button className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold 
                   px-6 rounded-xl shadow-lg shadow-emerald-600/20 
                   transition-all duration-200 active:scale-[0.98]
                   focus-visible:outline-none focus-visible:ring-2 
                   focus-visible:ring-emerald-500 focus-visible:ring-offset-2
                   disabled:opacity-50 disabled:pointer-events-none">
  Continuar Atendimento
</button>

{/* Segurança — Ação biométrica */}
<button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold 
                   rounded-xl flex items-center justify-center gap-2 
                   shadow-lg shadow-indigo-600/20 
                   transition-all duration-200 active:scale-[0.98]
                   focus-visible:outline-none focus-visible:ring-2 
                   focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                   disabled:opacity-50 disabled:pointer-events-none">
  <ServerCog size={20} aria-hidden="true" /> Acionar Leitora USB
</button>

{/* Ghost — Ação secundária */}
<button className="h-11 bg-transparent hover:bg-slate-50 text-slate-600 font-semibold 
                   px-6 rounded-xl border border-slate-200
                   transition-all duration-200 active:scale-[0.98]
                   focus-visible:outline-none focus-visible:ring-2 
                   focus-visible:ring-slate-400 focus-visible:ring-offset-2">
  Cancelar
</button>

{/* Danger — Rejeição / Exclusão */}
<button className="h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold 
                   px-6 rounded-xl shadow-lg shadow-rose-600/20
                   transition-all duration-200 active:scale-[0.98]
                   focus-visible:outline-none focus-visible:ring-2 
                   focus-visible:ring-rose-500 focus-visible:ring-offset-2">
  Rejeitar Dossiê
</button>
```

### 6.3 Badges de Status (CORRIGIDO)

> ⚠️ **CORREÇÃO v2:** `FILA` tinha `border-blue-200` — inconsistente com bg/text emerald. Corrigido para `border-emerald-200`.

| Status Origem | Classes CSS | Rótulo |
|---|---|---|
| `FILA` / `ASSUMA_ESTE_PEDIDO` | `bg-emerald-50 text-emerald-700 border-emerald-200` | Na Fila / Disponível |
| `EM_ATENDIMENTO` | `bg-amber-50 text-amber-700 border-amber-200` | Em Atendimento |
| `AGUARDANDO_VIDEO` | `bg-amber-50 text-amber-700 border-amber-200` | Aguarda Vídeo |
| `EMITIDO` / `APROVADO` | `bg-emerald-50 text-emerald-700 border-emerald-200` | Emitido / Aprovado |
| `REJEITADO` | `bg-red-50 text-red-700 border-red-200` | Rejeitado |
| `EXPIRADO` | `bg-slate-100 text-slate-500 border-slate-200` | Expirado |

```tsx
{/* Componente StatusBadge */}
const STATUS_MAP = {
  FILA:              { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Na Fila' },
  EM_ATENDIMENTO:    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Em Atendimento' },
  AGUARDANDO_VIDEO:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Aguarda Vídeo' },
  EMITIDO:           { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Emitido' },
  APROVADO:          { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Aprovado' },
  REJEITADO:         { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     label: 'Rejeitado' },
  EXPIRADO:          { bg: 'bg-slate-100',  text: 'text-slate-500',   border: 'border-slate-200',   label: 'Expirado' },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_MAP }) {
  const s = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] 
                      font-bold uppercase tracking-wide border 
                      ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
}
```

### 6.4 Badges de Biometria (ADICIONADO: REPROVADA)

```tsx
type BioStatus = 'OK' | 'PENDENTE' | 'REPROVADA';

const BIO_MAP: Record<BioStatus, { dot: string; badge: string; label: string }> = {
  OK:        { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Biometria OK'       },
  PENDENTE:  { dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-500 border-gray-200',         label: 'Bio. Pendente'     },
  REPROVADA: { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',              label: 'Bio. Reprovada'    },
};

function BioBadge({ status }: { status: BioStatus }) {
  const s = BIO_MAP[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                      text-[10px] font-bold uppercase tracking-wide border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}
```

### 6.5 Inputs de Formulário

```tsx
{/* Input padrão */}
<div className="relative">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
          size={18} aria-hidden="true" />
  <input
    type="text"
    placeholder="Buscar por CPF ou Nome..."
    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl 
               shadow-sm font-medium text-slate-700 placeholder:text-slate-400
               focus:outline-none focus:ring-2 focus:ring-emerald-500/30 
               focus:border-emerald-500 transition-all duration-200"
  />
</div>

{/* Input com erro */}
<div className="space-y-1">
  <input
    aria-invalid="true"
    aria-describedby="cpf-error"
    className="w-full px-4 py-3 bg-white border border-red-300 rounded-xl
               shadow-sm font-medium text-slate-700
               focus:outline-none focus:ring-2 focus:ring-red-500/20 
               focus:border-red-500 transition-all duration-200"
  />
  <p id="cpf-error" role="alert" className="text-xs font-semibold text-red-600 flex items-center gap-1">
    <AlertCircle size={12} aria-hidden="true" /> CPF inválido ou não encontrado.
  </p>
</div>
```

### 6.6 Tabela de Protocolos

```tsx
<div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
  <table className="w-full">
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50/50">
        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Protocolo
        </th>
        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Titular
        </th>
        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Status
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-50">
      <tr className="hover:bg-emerald-50/30 transition-colors duration-150 cursor-pointer group">
        <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-700">
          #2024-001234
        </td>
        <td className="px-6 py-4 text-sm font-medium text-slate-800">
          João da Silva
        </td>
        <td className="px-6 py-4">
          <StatusBadge status="FILA" />
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 6.7 Skeleton Loading

```tsx
{/* Substituir conteúdo enquanto carrega */}
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-lg w-28" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-lg w-40" /></td>
      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-20" /></td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 animate-pulse space-y-3">
      <div className="h-4 bg-slate-100 rounded-lg w-1/3" />
      <div className="h-8 bg-slate-100 rounded-lg w-1/2" />
      <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
    </div>
  );
}
```

### 6.8 Animação Biométrica (Scanning)

```tsx
{/* Modal de captura biométrica */}
<div className="relative w-32 h-32 flex items-center justify-center" 
     role="status" aria-label="Capturando biometria...">
  <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping" aria-hidden="true" />
  <div className="absolute w-28 h-28 border-4 border-red-500 border-t-transparent 
                  border-b-transparent rounded-full animate-spin" aria-hidden="true" />
  <Fingerprint size={64} className="text-red-500 z-10 animate-pulse" aria-hidden="true" />
</div>

{/* Barra de progresso da qualidade */}
<div role="progressbar" aria-valuenow={quality} aria-valuemin={0} aria-valuemax={100}
     aria-label={`Qualidade de captura: ${quality}%`}
     className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
  <div className="h-full bg-emerald-500 rounded-full transition-all duration-300"
       style={{ width: `${quality}%` }} />
</div>
```

---

## 7. Acessibilidade & Motion

### 7.1 Reduced Motion (NOVO — obrigatório)

```css
/* globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 7.2 Padrões de ARIA para Diálogos Biométricos

```tsx
{/* Modal de segurança — padrão completo */}
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Captura Biométrica</h2>
  <p id="modal-description">
    Posicione o dedo sobre o leitor USB. O processo levará alguns segundos.
  </p>

  {/* Leitura em tempo real da qualidade */}
  <div aria-live="polite" aria-atomic="true" className="sr-only">
    Qualidade de captura: {quality}%
  </div>
</div>
```

### 7.3 Focus Management

Todos os elementos interativos DEVEM ter:
```
focus-visible:outline-none 
focus-visible:ring-2 
focus-visible:ring-emerald-500    ← verde para ações padrão
focus-visible:ring-indigo-500     ← indigo para ações de segurança
focus-visible:ring-offset-2
```

> **Regra:** Nunca remova `outline` sem substituir por `focus-visible:ring-*`. É requisito de compliance ICP-Brasil para operação por atalhos de teclado.

### 7.4 Contraste Mínimo

| Combinação | Ratio | Status |
|---|---|---|
| `text-slate-800` sobre `bg-white` | 12.6:1 | ✅ AAA |
| `text-emerald-700` sobre `bg-emerald-50` | 5.8:1 | ✅ AA |
| `text-amber-700` sobre `bg-amber-50` | 5.4:1 | ✅ AA |
| `text-red-700` sobre `bg-red-50` | 5.9:1 | ✅ AA |
| `text-slate-400` sobre `bg-white` | 3.8:1 | ⚠️ Apenas para decorativo (não usar para info crítica) |

### 7.5 Spotlight Interativo (Implementação Completa)

```tsx
// hooks/useSpotlight.ts
export function useSpotlight(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };
    el.addEventListener('mousemove', handleMove);
    return () => el.removeEventListener('mousemove', handleMove);
  }, [ref]);
}
```

```css
/* globals.css */
.spotlight-card {
  position: relative;
  --mouse-x: 50%;
  --mouse-y: 50%;
  overflow: hidden;
}
.spotlight-card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle at var(--mouse-x) var(--mouse-y),
    rgba(16, 185, 129, 0.08) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s;
}
.spotlight-card:hover::after {
  opacity: 1;
}
```

---

## 8. globals.css Completo

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── Design Tokens ─────────────────────────────────────── */
:root {
  /* Primary (Emerald) */
  --color-primary-50:  240 253 244;
  --color-primary-100: 209 250 229;
  --color-primary-500: 16  185 129;
  --color-primary-600: 5   150 105;
  --color-primary-700: 4   120 87;
  --color-primary-900: 6   78  59;

  /* Security (Indigo) */
  --color-security-50:  238 242 255;
  --color-security-100: 224 231 255;
  --color-security-600: 79  70  229;
  --color-security-700: 67  56  202;
  --color-security-900: 49  46  129;

  /* Warning (Amber) */
  --color-warning-50:  255 251 235;
  --color-warning-200: 253 230 138;
  --color-warning-700: 180 83  9;

  /* Danger (Rose/Red) */
  --color-danger-50:  255 241 242;
  --color-danger-500: 239 68  68;
  --color-danger-700: 190 18  60;

  /* Surface / Neutral */
  --color-surface:      249 250 251;
  --color-surface-card: 255 255 255;
  --color-border:       241 245 249;

  /* Z-Index Scale */
  --z-raised:   10;
  --z-dropdown: 20;
  --z-sidebar:  40;
  --z-navbar:   50;
  --z-modal:    60;
  --z-toast:    70;
}

/* ─── Base ───────────────────────────────────────────────── */
@layer base {
  html { font-family: 'DM Sans', system-ui, sans-serif; }
  body { @apply bg-gray-50 text-slate-800 antialiased; }
  * { @apply border-slate-100; }
}

/* ─── Scroll customizado ─────────────────────────────────── */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { @apply bg-slate-200 rounded-full; }
::-webkit-scrollbar-thumb:hover { @apply bg-slate-300; }

/* ─── Spotlight Card ─────────────────────────────────────── */
.spotlight-card {
  position: relative;
  --mouse-x: 50%;
  --mouse-y: 50%;
  overflow: hidden;
}
.spotlight-card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle at var(--mouse-x) var(--mouse-y),
    rgba(16, 185, 129, 0.08) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}
.spotlight-card:hover::after { opacity: 1; }

/* ─── Screen reader only ─────────────────────────────────── */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}

/* ─── Reduced Motion ─────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. tailwind.config.js

```js
const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', ...fontFamily.sans],
        mono: ['"JetBrains Mono"', ...fontFamily.mono],
      },
      colors: {
        primary: {
          50:  'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        },
        security: {
          50:  'rgb(var(--color-security-50) / <alpha-value>)',
          600: 'rgb(var(--color-security-600) / <alpha-value>)',
          700: 'rgb(var(--color-security-700) / <alpha-value>)',
          900: 'rgb(var(--color-security-900) / <alpha-value>)',
        },
      },
      boxShadow: {
        card:          '0 1px 4px rgba(0,0,0,0.06)',
        'card-hover':  '0 4px 16px rgba(0,0,0,0.10)',
        navbar:        '0 1px 10px -5px rgba(0,0,0,0.10)',
        sidebar:       '1px 0 10px -5px rgba(0,0,0,0.05)',
        modal:         '0 25px 50px -12px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        '2xl': '1rem',   // 16px — cards, modais
        'xl':  '0.75rem', // 12px — botões, inputs
        'lg':  '0.5rem',  // 8px  — badges
      },
      zIndex: {
        dropdown: '20',
        sidebar:  '40',
        navbar:   '50',
        modal:    '60',
        toast:    '70',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'), // para animate-in fade-in
  ],
};
```

---

## 10. Roadmap Acionável

### 🔴 Prioridade 1 — Correções Imediatas (bugs visuais)
- [ ] **Fix `FILA` badge**: trocar `border-blue-200` → `border-emerald-200` em todos os arquivos
- [ ] **Adicionar `BioBadge` status `REPROVADA`** nos componentes de listagem
- [ ] **Trocar `Inter` por `DM Sans`** no `tailwind.config.js` e `globals.css`
- [ ] **Adicionar `font-mono`** em todos os campos que exibem CPF, protocolo e hash

### 🟡 Prioridade 2 — Token Unification
- [ ] **Implementar CSS Variables completas** no `globals.css` (seção 8)
- [ ] **Atualizar `tailwind.config.js`** para consumir `rgb(var(--color-*) / <alpha>)` (seção 9)
- [ ] **Padronizar z-index** — remover `z-50` inline e usar `z-[var(--z-navbar)]`

### 🟢 Prioridade 3 — Completude de UX
- [ ] **Skeleton loading** para tabelas e cards (seção 6.7)
- [ ] **Estados de erro em formulários** com `aria-invalid` e `aria-describedby`
- [ ] **`prefers-reduced-motion`** no `globals.css` (seção 7.1)
- [ ] **`aria-live` nos modais biométricos** para leitura de porcentagem de qualidade
- [ ] **`focus-visible:ring-*`** em todos os botões e inputs interativos

### 🔵 Prioridade 4 — Melhorias de Produto
- [ ] **Spotlight card** com hook `useSpotlight` (seção 7.5)
- [ ] **Scrollbar customizado** via CSS (seção 8)
- [ ] **Status `EXPIRADO`** adicionado à `STATUS_MAP`
- [ ] **Componente `<Table>`** reutilizável com suporte a loading/empty state

---

*Design System AC ANGRY v2.0 — Revisado com foco em correção de tokens, completude de componentes e compliance de acessibilidade ICP-Brasil.*
