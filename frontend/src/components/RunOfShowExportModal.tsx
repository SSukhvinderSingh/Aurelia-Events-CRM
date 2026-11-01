import React, { useState } from 'react';
import {
  Check,
  Copy,
  Cpu,
  Download,
  FileText,
  KeyRound,
  Printer,
  X,
} from 'lucide-react';
import { LLMConfigStatus } from '../types/crm';

interface RunOfShowExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdownBrief: string;
  eventName: string;
  llmStatus: LLMConfigStatus | null;
  onUpdateLLMConfig: (payload: {
    provider?: string;
    model?: string;
    gemini_api_key?: string;
    openai_api_key?: string;
    anthropic_api_key?: string;
    openai_base_url?: string;
  }) => Promise<void>;
}

export const RunOfShowExportModal: React.FC<RunOfShowExportModalProps> = ({
  isOpen,
  onClose,
  markdownBrief,
  eventName,
  llmStatus,
  onUpdateLLMConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'llm'>('brief');
  const [copied, setCopied] = useState(false);

  const [provider, setProvider] = useState(llmStatus?.configured_provider || 'auto');
  const [model, setModel] = useState(llmStatus?.active_model || '');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdownBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownBrief], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventName.toLowerCase().replace(/\s+/g, '-')}-run-of-show-brief.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveLLM = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateLLMConfig({
      provider,
      model,
      gemini_api_key: geminiKey || undefined,
      openai_api_key: openaiKey || undefined,
      anthropic_api_key: anthropicKey || undefined,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('brief')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'brief'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Client Run-of-Show & Budget Brief
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('llm')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'llm'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              LLM-Agnostic (.env & Runtime) Settings
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-slate-400 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {activeTab === 'brief' ? (
          <div className="flex flex-1 flex-col overflow-hidden p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-400">
                Synchronized deliverable generated from Swimlanes 1–3 (Milestones, Contracted Vendors, and Payment Tranches).
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download .MD Brief
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
              </div>
            </div>

            <pre className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {markdownBrief}
            </pre>
          </div>
        ) : (
          <form onSubmit={handleSaveLLM} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4" />
                  Active Runtime Adapter Status
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                  {llmStatus?.active_provider} ({llmStatus?.active_model})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure API keys in <code className="text-amber-300">.env</code> or override them at runtime below. When no external API key is provided, the deterministic <strong>Autonomous Swarm Engine</strong> executes all 4 sub-agents and FastMCP tools seamlessly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  LLM Provider (`LLM_PROVIDER`)
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                >
                  <option value="auto">auto (Detect from .env or Autonomous Engine)</option>
                  <option value="antigravity">antigravity (Google Antigravity SDK)</option>
                  <option value="gemini">gemini (Google Gemini API)</option>
                  <option value="openai">openai (OpenAI / Compatible Endpoint)</option>
                  <option value="anthropic">anthropic (Anthropic Claude)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Model Override (`LLM_MODEL`)
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., gemini-2.5-pro, gpt-4o, claude-3-7-sonnet-latest"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gemini / Antigravity API Key (`GEMINI_API_KEY`)
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={llmStatus?.keys_configured.gemini ? '•••••••• (Configured)' : 'Optional runtime key'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  OpenAI API Key (`OPENAI_API_KEY`)
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={llmStatus?.keys_configured.openai ? '•••••••• (Configured)' : 'Optional runtime key'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Anthropic API Key (`ANTHROPIC_API_KEY`)
                </label>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder={llmStatus?.keys_configured.anthropic ? '•••••••• (Configured)' : 'Optional runtime key'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedBanner ? (
                <span className="text-xs font-bold text-emerald-400">
                  ✓ Runtime LLM configuration updated!
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Save Runtime LLM Config
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
