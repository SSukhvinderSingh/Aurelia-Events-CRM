import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  DollarSign,
  Heart,
  Loader2,
  MapPin,
  Music,
  Sparkles,
  Trees,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { CreateEventPayload } from '../types/crm';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (payload: CreateEventPayload) => Promise<void>;
}

const EVENT_TYPE_CARDS: Array<{
  type: 'wedding' | 'birthday' | 'community';
  title: string;
  subtitle: string;
  defaultBudget: number;
  defaultGuests: number;
  defaultTheme: string;
  defaultVenue: string;
  defaultCity: string;
  icon: React.FC<{ className?: string }>;
  accent: string;
}> = [
  {
    type: 'wedding',
    title: 'Luxury Wedding',
    subtitle: 'Multi-day heritage, vineyard, or estate celebration',
    defaultBudget: 95000,
    defaultGuests: 240,
    defaultTheme: 'Vineyard Botanical Candlelight & Acoustic Strings',
    defaultVenue: 'Solage Calistoga Vineyard Estate',
    defaultCity: 'Napa Valley, CA',
    icon: Heart,
    accent: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  },
  {
    type: 'birthday',
    title: 'Milestone Birthday Gala',
    subtitle: 'Private supper club, live brass/vinyl, & mixology',
    defaultBudget: 42000,
    defaultGuests: 110,
    defaultTheme: 'Art Deco Velvet Supper Club & Live-to-Vinyl',
    defaultVenue: 'The Beekman Penthouse & Atrium',
    defaultCity: 'New York, NY',
    icon: Music,
    accent: 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300',
  },
  {
    type: 'community',
    title: 'Community & Civic Festival',
    subtitle: 'Solar soundstage, culinary village, & public art',
    defaultBudget: 65000,
    defaultGuests: 1200,
    defaultTheme: 'Zero-Waste Solar Soundstage & Street Food Village',
    defaultVenue: 'Waterfront Civic Commons',
    defaultCity: 'Austin, TX',
    icon: Trees,
    accent: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  },
];

const AI_PROMPT_TEMPLATES: Record<'wedding' | 'birthday' | 'community', string[]> = {
  wedding: [
    'Plan an outdoor vineyard ceremony & candlelit reception with a 7-course farm-to-table tasting menu, acoustic strings, and clear-span glass marquee backup.',
    'Design a 3-day royal heritage wedding with a twilight Mehendi courtyard welcome night, suspended floral mandap, and live folk-fusion ensemble.',
    'Create a coastal botanical black-tie wedding with zero-waste floral mechanics, oyster & champagne raw bar, and synchronized fireworks finale.',
  ],
  birthday: [
    'Build a 1920s Art Deco velvet supper club gala with a sommelier tasting flight, 8-piece brass band, and midnight live-to-vinyl recording encore.',
    'Plan a rooftop sunset-to-midnight milestone celebration with bespoke molecular mixology stations, immersive projection mapping, and vinyl DJ.',
    'Create an intimate chef’s table & rare bourbon tasting lounge with custom foil-stamped keepsake menus and acoustic jazz quartet.',
  ],
  community: [
    'Organize a 100% solar-powered civic arts & sustainability festival with 12 local street-food carts, RFID zero-waste dishware, and interactive community mural.',
    'Plan a neighborhood cultural heritage street fair with municipal traffic closures, ADA family viewing zones, youth orchestra, and artisan market.',
    'Build a waterfront green-tech & music showcase with solar battery microgrid, compostable hydration hubs, and sunset headline concert.',
  ],
};

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onCreateEvent,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [eventType, setEventType] = useState<'wedding' | 'birthday' | 'community'>('wedding');
  const [name, setName] = useState('Napa Valley Harvest Wedding Weekend');
  const [clientName, setClientName] = useState('Maya Lin & Jordan Vance');
  const [clientOrg, setClientOrg] = useState('Lin-Vance Family Office');
  const [eventDate, setEventDate] = useState('2027-09-18');
  const [venue, setVenue] = useState('Solage Calistoga Vineyard Estate');
  const [city, setCity] = useState('Napa Valley, CA');
  const [guestCount, setGuestCount] = useState(240);
  const [totalBudget, setTotalBudget] = useState(95000);
  const [theme, setTheme] = useState('Vineyard Botanical Candlelight & Acoustic Strings');
  const [aiPrompt, setAiPrompt] = useState(AI_PROMPT_TEMPLATES.wedding[0]);

  if (!isOpen) return null;

  const handleSelectEventType = (type: 'wedding' | 'birthday' | 'community') => {
    setEventType(type);
    const preset = EVENT_TYPE_CARDS.find((c) => c.type === type)!;
    setTotalBudget(preset.defaultBudget);
    setGuestCount(preset.defaultGuests);
    setTheme(preset.defaultTheme);
    setVenue(preset.defaultVenue);
    setCity(preset.defaultCity);
    setAiPrompt(AI_PROMPT_TEMPLATES[type][0]);
    if (type === 'wedding') {
      setName('Napa Valley Harvest Wedding Weekend');
      setClientName('Maya Lin & Jordan Vance');
      setClientOrg('Lin-Vance Family Office');
    } else if (type === 'birthday') {
      setName('Elena Rostova 40th Velvet Supper Club');
      setClientName('Elena Rostova');
      setClientOrg('Rostova Ventures');
    } else {
      setName('Austin Waterfront Solar & Arts Festival');
      setClientName('Civic Arts & Green Parks Coalition');
      setClientOrg('City of Austin Cultural Division');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim() || !venue.trim() || !city.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateEvent({
        name: name.trim(),
        event_type: eventType,
        client_name: clientName.trim(),
        client_organization: clientOrg.trim() || undefined,
        event_date: eventDate,
        venue: venue.trim(),
        city: city.trim(),
        guest_count: Number(guestCount) || 150,
        total_budget: Number(totalBudget) || 50000,
        currency: 'USD',
        theme: theme.trim(),
        ai_prompt: aiPrompt.trim(),
        auto_plan: true,
      });
      setStep(1);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl shadow-black">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Create & Auto-Plan New Event
                </h2>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  Step {step} of 2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automatically generates your 5-phase timeline, vendor shortlist, and budget plan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {step === 1 ? (
            <>
              {/* Event Type Selector Cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  1. Select Event Portfolio Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {EVENT_TYPE_CARDS.map((card) => {
                    const Icon = card.icon;
                    const active = eventType === card.type;
                    return (
                      <button
                        key={card.type}
                        type="button"
                        onClick={() => handleSelectEventType(card.type)}
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                          active
                            ? `${card.accent} ring-2 ring-amber-400/70`
                            : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon className="h-4 w-4" />
                          {active && <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />}
                        </div>
                        <span className="mt-2 text-xs font-bold text-white">{card.title}</span>
                        <span className="mt-0.5 text-[11px] text-slate-400 leading-tight">
                          {card.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event Core Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Napa Valley Harvest Wedding Weekend"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client Organization (Optional)
                  </label>
                  <input
                    type="text"
                    value={clientOrg}
                    onChange={(e) => setClientOrg(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-sky-400" /> Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City / Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-amber-400" /> Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3 text-emerald-400" /> Guests *
                    </label>
                    <input
                      type="number"
                      min={10}
                      required
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-amber-400" /> Budget ($) *
                    </label>
                    <input
                      type="number"
                      min={1000}
                      step={500}
                      required
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Aesthetic & Design Theme
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-black text-slate-950 hover:bg-amber-400 transition"
                >
                  Next: AI Auto-Planner Prompt
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: AI Auto-Plan Goals & Prompt */}
              <div className="rounded-xl border border-amber-500/30 bg-slate-950/90 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-white">{name}</span>
                  <span className="text-slate-400">
                    {' '}
                    • {venue} ({city}) • {guestCount} guests • ${totalBudget.toLocaleString()} ceiling
                  </span>
                </div>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                  {eventType}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5 flex items-center gap-1.5">
                  <Bot className="h-4 w-4" />
                  2. Describe Your Event Vision & Priorities
                </label>
                <p className="text-xs text-slate-400 mb-2.5">
                  Describe your vision, special cultural or experiential moments, or vendor priorities. Your planning assistant will organize all 5 timeline phases, link vetted vendors, and allocate budgets under ${totalBudget.toLocaleString()}.
                </p>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the ideal ceremony/schedule, dining style, music, and backup requirements..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* 1-Click Prompt Templates */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Wand2 className="h-3.5 w-3.5 text-amber-400" />
                  Quick Vision Templates for {eventType.toUpperCase()}:
                </span>
                <div className="space-y-1.5">
                  {AI_PROMPT_TEMPLATES[eventType].map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAiPrompt(tpl)}
                      className={`w-full rounded-xl border p-2.5 text-left text-xs transition ${
                        aiPrompt === tpl
                          ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                          : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      “{tpl}”
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Event Basics
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Building Your 5-Phase Event Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Create & Auto-Plan Event
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
