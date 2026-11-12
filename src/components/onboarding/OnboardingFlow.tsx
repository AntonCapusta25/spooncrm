import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Phone, Mail, User, CheckCircle2, ArrowRight, ArrowLeft, 
  Sparkles, ExternalLink, MessageCircle, Calendar, Store, AlertCircle, 
  Loader2, MapPin, Check, RefreshCw, X
} from 'lucide-react';
import { CrmLead, OnboardingApplicationData } from '../../types/crm';
import { searchLeadsForMatching, submitOnboardingApplication } from '../../lib/supabase';
import { fireCelebration } from '../../lib/confetti';

interface OnboardingFlowProps {
  onExit?: () => void;
  initialLead?: CrmLead | null;
}

const WHATSAPP_NUMBER = '3197010208809';
const PHONE_NUMBER = '+3197010208809';
const ONBOARDING_EMAIL = 'onboarding@spoonful.delivery';
const CALENDLY_URL = 'https://calendly.com/homemademeals-info/interview-with-homemade';

const DELIVERY_OPTIONS = [
  {
    id: 'own_delivery',
    title: 'Yes, we do our own delivery',
    description: 'We have our own drivers to deliver orders to customers in Enschede',
    icon: '🛵'
  },
  {
    id: 'pickup_only',
    title: 'No, takeaway & pickup only',
    description: 'Customers collect their food orders directly at our restaurant',
    icon: '🛍️'
  },
  {
    id: 'planning_delivery',
    title: 'Not yet, but planning to start delivery',
    description: 'Currently pickup only, looking to set up our own delivery drivers soon',
    icon: '📦'
  }
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onExit, initialLead }) => {
  // Step state: 1 = Restaurant, 2 = Own Delivery, 3 = Contact Person, 4 = Phone & Email, 5 = Congrats
  const [step, setStep] = useState<number>(1);

  // Form State
  const [restaurantInput, setRestaurantInput] = useState<string>(initialLead?.name || '');
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(initialLead || null);
  const [thuisbezorgdUrl, setThuisbezorgdUrl] = useState<string>(initialLead?.website || '');
  const [isThuisbezorgdLink, setIsThuisbezorgdLink] = useState<boolean>(false);
  const [hasOwnDelivery, setHasOwnDelivery] = useState<string>('Yes, we do our own delivery');
  const [contactName, setContactName] = useState<string>(initialLead?.contact_person || '');
  const [role, setRole] = useState<string>('Owner / Proprietor');
  const [phone, setPhone] = useState<string>(initialLead?.phone || '+31 ');
  const [email, setEmail] = useState<string>(initialLead?.email || '');
  const [preferredContact, setPreferredContact] = useState<'call' | 'whatsapp' | 'email'>('call');

  // Search & matching state
  const [searchResults, setSearchResults] = useState<CrmLead[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [isNewRestaurantMode, setIsNewRestaurantMode] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<{ lead: CrmLead | null; isNewLead: boolean } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-focus input references
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to extract clean name from Thuisbezorgd / Takeaway URL
  const extractNameFromUrl = (url: string): string => {
    try {
      const cleanUrl = url.trim();
      const match = cleanUrl.match(/(?:menu\/|restaurant\/|order\/|thuisbezorgd\.nl\/|takeaway\.com\/)([a-zA-Z0-9-]+)/i);
      if (match && match[1]) {
        // Remove city suffix if attached (e.g. bapao-enschede -> bapao)
        let name = match[1].replace(/-/g, ' ');
        name = name.replace(/\benschede\b/gi, '').trim();
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    } catch (e) {
      // fallback
    }
    return '';
  };

  // Inspect restaurantInput for Thuisbezorgd link
  useEffect(() => {
    const trimmed = restaurantInput.trim();
    if (trimmed.includes('thuisbezorgd.nl') || trimmed.includes('takeaway.com')) {
      setIsThuisbezorgdLink(true);
      setThuisbezorgdUrl(trimmed);
      const parsedName = extractNameFromUrl(trimmed);
      if (parsedName) {
        // Trigger background search for matched lead
        searchLeadsForMatching(parsedName).then(results => {
          if (results.length > 0) {
            setSelectedLead(results[0]);
            setSearchResults(results);
          }
        });
      }
    } else {
      setIsThuisbezorgdLink(false);
    }
  }, [restaurantInput]);

  // Debounced search when user types restaurant name
  useEffect(() => {
    const query = restaurantInput.trim();
    if (selectedLead && selectedLead.name.toLowerCase() === query.toLowerCase()) {
      return; // Already selected
    }
    if (query.length < 2 || isThuisbezorgdLink) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const leads = await searchLeadsForMatching(query);
      setSearchResults(leads);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [restaurantInput, isThuisbezorgdLink, selectedLead]);

  // Focus input on step change
  useEffect(() => {
    if (step === 1 || step === 3 || step === 4) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [step]);

  // Trigger celebration confetti when entering congrats screen (Step 5)
  useEffect(() => {
    if (step === 5) {
      fireCelebration();
    }
  }, [step]);

  // Step Validations
  const canProceedStep1 = restaurantInput.trim().length > 1;
  const canProceedStep2 = hasOwnDelivery.trim().length > 0;
  const canProceedStep3 = contactName.trim().length > 1;

  // Step 4 Validation (phone must have at least 8 digits)
  const cleanPhone = phone.replace(/\D/g, '');
  const isValidPhone = cleanPhone.length >= 8;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canProceedStep4 = isValidPhone && isValidEmail;

  // Handle Form Submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canProceedStep4 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: OnboardingApplicationData = {
      restaurantName: selectedLead?.name || (isThuisbezorgdLink ? extractNameFromUrl(thuisbezorgdUrl) || restaurantInput : restaurantInput),
      thuisbezorgdUrl: isThuisbezorgdLink ? restaurantInput : thuisbezorgdUrl || undefined,
      hasOwnDelivery: hasOwnDelivery,
      contactPerson: contactName.trim(),
      role: role,
      phone: phone.trim(),
      email: email.trim(),
      preferredContact: preferredContact,
      matchedLeadId: selectedLead?.id,
      address: selectedLead?.address || undefined,
      city: selectedLead?.city || 'Enschede',
    };

    const res = await submitOnboardingApplication(payload);

    if (res.success && res.lead) {
      setSubmitResult({
        lead: res.lead,
        isNewLead: res.isNewLead
      });
      setIsSubmitting(false);
      setStep(5);
    } else {
      setIsSubmitting(false);
      setErrorMessage(res.message || 'Failed to submit application. Please check your network connection.');
    }
  };

  // Keyboard Navigation: Enter advances to next step
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step === 1 && canProceedStep1) setStep(2);
      else if (step === 2 && canProceedStep2) setStep(3);
      else if (step === 3 && canProceedStep3) setStep(4);
      else if (step === 4 && canProceedStep4) handleSubmit();
    }
  };

  // External Action Handlers
  const handleCall = () => {
    window.location.href = `tel:${PHONE_NUMBER}`;
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi Spoonful! I just submitted an onboarding application for ${submitResult?.lead?.name || restaurantInput}. Looking forward to connecting!`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const handleBookMeeting = () => {
    window.open(CALENDLY_URL, '_blank');
  };

  const handleEmailUs = () => {
    const subject = encodeURIComponent(`Spoonful Restaurant Onboarding - ${submitResult?.lead?.name || restaurantInput}`);
    const body = encodeURIComponent(
      `Hi Spoonful Onboarding Team,\n\nWe have submitted our application for ${submitResult?.lead?.name || restaurantInput}.\nContact: ${contactName} (${phone})\n\nLooking forward to speaking with you!`
    );
    window.location.href = `mailto:${ONBOARDING_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div 
      onKeyDown={handleKeyDown}
      className="min-h-[100dvh] w-screen bg-[#FAFAFA] text-[#18181B] flex flex-col font-['Inter',sans-serif] selection:bg-[#FF5A1F]/20 relative overflow-x-hidden"
    >
      {/* Top Floating Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E4E4E7] px-4 md:px-8 py-3.5 flex items-center justify-between">
        
        {/* Spoonful Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5A1F] to-[#FF8A50] text-white flex items-center justify-center text-lg font-bold shadow-sm shadow-[#FF5A1F]/25">
            🥄
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm md:text-base tracking-tight text-[#18181B]">
                Spoonful
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFF1EB] text-[#FF5A1F] border border-[#FF5A1F]/20">
                Partner Onboarding
              </span>
            </div>
            <p className="text-[11px] text-[#71717A] hidden sm:block">
              Enschede & Twente Restaurant Network
            </p>
          </div>
        </div>

        {/* Right Action: Contact Pills & Optional Exit */}
        <div className="flex items-center gap-2">
          {/* Quick Support Pill */}
          <button
            onClick={handleWhatsApp}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] text-xs font-semibold transition-all border border-[#25D366]/30 cursor-pointer"
            title="Chat on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleCall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#3F3F46] text-xs font-semibold transition-all border border-[#E4E4E7] cursor-pointer"
            title="Call Support"
          >
            <Phone className="w-3.5 h-3.5 text-[#FF5A1F]" />
            <span className="hidden xs:inline">Call Us</span>
          </button>
        </div>
      </header>

      {/* Progress Bar (Typeform Style) */}
      <div className="w-full bg-[#E4E4E7] h-1.5 relative overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#FF5A1F] to-[#FF8A50] transition-all duration-500 ease-out"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {/* Main Typeform Card Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-3xl mx-auto w-full relative">
        
        {/* Step Indicator Tag */}
        {step < 5 && (
          <div className="w-full mb-4 flex items-center justify-between text-xs font-semibold text-[#71717A]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF5A1F]" />
              Step {step} of 4
            </span>
            <span className="text-[11px] text-[#A1A1AA]">
              {step === 1 && 'Restaurant Profile'}
              {step === 2 && 'Delivery Setup'}
              {step === 3 && 'Representative'}
              {step === 4 && 'Verification & Dispatch'}
            </span>
          </div>
        )}

        {/* STEP 1: Restaurant Name or Thuisbezorgd Link */}
        {step === 1 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-2 mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#18181B] tracking-tight">
                What is the name of your restaurant?
              </h1>
              <p className="text-sm md:text-base text-[#71717A]">
                Paste your <strong className="text-[#18181B] font-semibold">Thuisbezorgd profile link</strong> or type your restaurant name. We will automatically link your menu and store info.
              </p>
            </div>

            {/* Input Box */}
            <div className="relative mb-3">
              <div className="relative flex items-center">
                <div className="absolute left-4 text-[#A1A1AA]">
                  {isThuisbezorgdLink ? (
                    <span className="text-lg">🍔</span>
                  ) : (
                    <Store className="w-5 h-5 text-[#FF5A1F]" />
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={restaurantInput}
                  onChange={(e) => {
                    setRestaurantInput(e.target.value);
                    if (selectedLead && e.target.value !== selectedLead.name) {
                      setSelectedLead(null);
                    }
                  }}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="e.g. Bistro Cinq OR https://www.thuisbezorgd.nl/menu/..."
                  className="w-full pl-12 pr-10 py-4 bg-white text-base md:text-lg text-[#18181B] rounded-2xl border-2 border-[#E4E4E7] focus:border-[#FF5A1F] focus:ring-4 focus:ring-[#FF5A1F]/10 outline-none transition-all shadow-sm placeholder:text-[#A1A1AA]"
                />

                {isSearching && (
                  <div className="absolute right-4 text-[#A1A1AA]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF5A1F]" />
                  </div>
                )}
                {restaurantInput && !isSearching && (
                  <button
                    onClick={() => {
                      setRestaurantInput('');
                      setSelectedLead(null);
                      setSearchResults([]);
                    }}
                    className="absolute right-4 text-[#A1A1AA] hover:text-[#18181B]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Matched Lead Chip if Selected */}
              {selectedLead && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between text-xs text-[#166534]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                    <div>
                      <span className="font-bold">{selectedLead.name}</span>
                      <span className="text-[#15803D] ml-2">📍 {selectedLead.address}</span>
                    </div>
                  </div>
                  <span className="bg-[#22C55E]/15 text-[#15803D] font-bold text-[10px] px-2 py-0.5 rounded-md shrink-0">
                    Verified Location
                  </span>
                </div>
              )}

              {/* Thuisbezorgd Detected Banner */}
              {isThuisbezorgdLink && !selectedLead && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-between text-xs text-[#9A3412]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                    <span>
                      Thuisbezorgd link detected: <strong className="font-bold">{extractNameFromUrl(restaurantInput) || 'Storefront'}</strong>
                    </span>
                  </div>
                  <span className="bg-[#FF5A1F]/15 text-[#C2410C] font-bold text-[10px] px-2 py-0.5 rounded-md">
                    Store Link Ready
                  </span>
                </div>
              )}

              {/* Live Search Suggestions Dropdown */}
              {searchFocused && searchResults.length > 0 && !selectedLead && (
                <div className="mt-2 bg-white rounded-2xl border border-[#E4E4E7] shadow-xl overflow-hidden divide-y divide-[#F4F4F5] max-h-64 overflow-y-auto">
                  <div className="p-2.5 bg-[#FAFAFA] text-[11px] font-semibold text-[#71717A] flex items-center justify-between">
                    <span>Suggestions in Enschede ({searchResults.length}):</span>
                    <span className="text-[#FF5A1F]">Click to select</span>
                  </div>
                  {searchResults.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => {
                        setSelectedLead(lead);
                        setRestaurantInput(lead.name);
                        setSearchFocused(false);
                      }}
                      className="w-full text-left p-3 hover:bg-[#FFF1EB] transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#18181B] group-hover:text-[#FF5A1F]">
                          {lead.name}
                        </p>
                        <p className="text-xs text-[#71717A] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#A1A1AA]" />
                          <span>{lead.address}</span>
                          {lead.cuisine && (
                            <span className="text-[#A1A1AA] ml-1">• {lead.cuisine}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-[#FF5A1F] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Select <Check className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Helper / Fallback */}
            <div className="flex items-center justify-between text-xs text-[#71717A] pt-1">
              <span>
                Not in the list? No problem, just enter your restaurant's name and we'll add it to the map.
              </span>
            </div>

            {/* Next Button */}
            <div className="mt-8 flex items-center justify-between">
              <span className="text-xs text-[#A1A1AA] hidden sm:flex items-center gap-1.5">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E4E4E7] text-[#71717A] font-mono text-[10px]">Enter ↵</kbd> to proceed
              </span>

              <button
                type="button"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
                className={`ml-auto flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer ${
                  canProceedStep1
                    ? 'bg-[#FF5A1F] hover:bg-[#E04B14] text-white shadow-[#FF5A1F]/30 hover:scale-[1.02]'
                    : 'bg-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed shadow-none'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Do you have your own delivery? */}
        {step === 2 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-2 mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#18181B] tracking-tight">
                Do you have your own delivery?
              </h1>
              <p className="text-sm md:text-base text-[#71717A]">
                Let us know how food orders are fulfilled at your restaurant in Enschede.
              </p>
            </div>

            {/* Delivery Option Cards */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {DELIVERY_OPTIONS.map((opt) => {
                const isSelected = hasOwnDelivery === opt.title;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setHasOwnDelivery(opt.title);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 group ${
                      isSelected
                        ? 'border-[#FF5A1F] bg-[#FFF1EB]/60 shadow-sm ring-2 ring-[#FF5A1F]/20'
                        : 'border-[#E4E4E7] bg-white hover:border-[#D4D4D8] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <span className="text-2xl shrink-0 p-2 rounded-xl bg-white border border-[#E4E4E7] shadow-2xs group-hover:scale-110 transition-transform">
                      {opt.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-sm font-bold ${isSelected ? 'text-[#FF5A1F]' : 'text-[#18181B]'}`}>
                          {opt.title}
                        </p>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#71717A] hover:text-[#18181B] px-3 py-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer ${
                  canProceedStep2
                    ? 'bg-[#FF5A1F] hover:bg-[#E04B14] text-white shadow-[#FF5A1F]/30 hover:scale-[1.02]'
                    : 'bg-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed shadow-none'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Contact Person Name & Role */}
        {step === 3 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-2 mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#18181B] tracking-tight">
                Who should our onboarding department speak with?
              </h1>
              <p className="text-sm md:text-base text-[#71717A]">
                The business owner, restaurant manager, or partner responsible for operational setup.
              </p>
            </div>

            {/* Full Name Input */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-[#71717A] mb-1.5">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-5 h-5 text-[#A1A1AA] absolute left-4" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Marco Rossi"
                    className="w-full pl-12 pr-4 py-4 bg-white text-base md:text-lg text-[#18181B] rounded-2xl border-2 border-[#E4E4E7] focus:border-[#FF5A1F] focus:ring-4 focus:ring-[#FF5A1F]/10 outline-none transition-all shadow-sm placeholder:text-[#A1A1AA]"
                  />
                </div>
              </div>

              {/* Role Select Pills */}
              <div>
                <label className="block text-xs font-semibold text-[#71717A] mb-2">
                  Your Role at {selectedLead?.name || restaurantInput || 'the Restaurant'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Owner / Proprietor', 'General Manager', 'Head Chef', 'Operations / Other'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        role === r
                          ? 'border-[#FF5A1F] bg-[#FFF1EB] text-[#FF5A1F] shadow-xs'
                          : 'border-[#E4E4E7] bg-white text-[#71717A] hover:border-[#D4D4D8] hover:text-[#18181B]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#71717A] hover:text-[#18181B] px-3 py-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={!canProceedStep3}
                onClick={() => setStep(4)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer ${
                  canProceedStep3
                    ? 'bg-[#FF5A1F] hover:bg-[#E04B14] text-white shadow-[#FF5A1F]/30 hover:scale-[1.02]'
                    : 'bg-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed shadow-none'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Phone Number & Email */}
        {step === 4 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-2 mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#18181B] tracking-tight">
                Where can our onboarding team reach you?
              </h1>
              <p className="text-sm md:text-base text-[#71717A]">
                We will send dispatch details for your Sunmi POS terminal and reach out to verify your operating hours and menu.
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              {/* Phone Field */}
              <div>
                <label className="block text-xs font-semibold text-[#71717A] mb-1.5">
                  Direct Phone Number <span className="text-[#FF5A1F]">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center gap-1 text-sm font-semibold text-[#71717A]">
                    <span>🇳🇱</span>
                    <Phone className="w-4 h-4 text-[#A1A1AA] ml-1" />
                  </div>
                  <input
                    ref={inputRef}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+31 6 12345678"
                    className="w-full pl-20 pr-4 py-4 bg-white text-base md:text-lg text-[#18181B] rounded-2xl border-2 border-[#E4E4E7] focus:border-[#FF5A1F] focus:ring-4 focus:ring-[#FF5A1F]/10 outline-none transition-all shadow-sm placeholder:text-[#A1A1AA]"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-[#71717A] mb-1.5">
                  Business Email Address <span className="text-[#FF5A1F]">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-5 h-5 text-[#A1A1AA] absolute left-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@yourrestaurant.nl"
                    className="w-full pl-12 pr-4 py-4 bg-white text-base md:text-lg text-[#18181B] rounded-2xl border-2 border-[#E4E4E7] focus:border-[#FF5A1F] focus:ring-4 focus:ring-[#FF5A1F]/10 outline-none transition-all shadow-sm placeholder:text-[#A1A1AA]"
                  />
                </div>
              </div>

              {/* Contact Preference */}
              <div>
                <label className="block text-xs font-semibold text-[#71717A] mb-2">
                  Preferred Contact Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'call', label: 'Phone Call', icon: Phone },
                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                    { id: 'email', label: 'Email', icon: Mail },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPreferredContact(item.id as any)}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          preferredContact === item.id
                            ? 'border-[#FF5A1F] bg-[#FFF1EB] text-[#FF5A1F] shadow-xs'
                            : 'border-[#E4E4E7] bg-white text-[#71717A] hover:border-[#D4D4D8] hover:text-[#18181B]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Error Message if Any */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-[#FFE2DD] border border-[#F5C0B8] text-[#D44026] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Navigation & Submit Buttons */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#71717A] hover:text-[#18181B] px-3 py-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={!canProceedStep4 || isSubmitting}
                onClick={() => handleSubmit()}
                className={`flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-sm md:text-base transition-all shadow-lg cursor-pointer ${
                  canProceedStep4 && !isSubmitting
                    ? 'bg-[#FF5A1F] hover:bg-[#E04B14] text-white shadow-[#FF5A1F]/30 hover:scale-[1.02]'
                    : 'bg-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed shadow-none'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: CONGRATS SCREEN & ACTIONS */}
        {step === 5 && (
          <div className="w-full text-center animate-in zoom-in-95 duration-500 py-4">
            
            {/* Big Party Icon */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#FFF1EB] border-4 border-white text-4xl md:text-5xl flex items-center justify-center mx-auto shadow-xl shadow-[#FF5A1F]/20 mb-6 animate-bounce">
              🎉
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#18181B] tracking-tight mb-3">
              Application Received!
            </h1>

            <p className="text-base md:text-lg text-[#71717A] max-w-lg mx-auto mb-6">
              Thank you, <strong className="text-[#18181B]">{contactName}</strong>! Our onboarding department will reach out shortly to verify your details, configure your menu, and dispatch your terminal.
            </p>

            {/* Application Summary Card */}
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 md:p-6 text-left shadow-sm max-w-xl mx-auto mb-8 space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F4F4F5]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] block">
                    Restaurant
                  </span>
                  <p className="text-base font-bold text-[#18181B]">
                    {submitResult?.lead?.name || restaurantInput}
                  </p>
                </div>
                <span className="bg-[#22C55E]/15 text-[#16A34A] text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Application Submitted
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#A1A1AA] block">Contact Representative</span>
                  <span className="font-semibold text-[#18181B]">{contactName} ({role})</span>
                </div>
                <div>
                  <span className="text-[#A1A1AA] block">Delivery Model</span>
                  <span className="font-semibold text-[#18181B]">{hasOwnDelivery}</span>
                </div>
                <div>
                  <span className="text-[#A1A1AA] block">Direct Phone</span>
                  <span className="font-semibold text-[#18181B]">{phone}</span>
                </div>
                <div>
                  <span className="text-[#A1A1AA] block">Email</span>
                  <span className="font-semibold text-[#18181B] truncate block">{email}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#A1A1AA] block">Application Status</span>
                  <span className="font-bold text-[#FF5A1F] flex items-center gap-1">
                    ⚡ Under Priority Review
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS (As requested: "adding call us, book a meeting or email us button") */}
            <div className="max-w-xl mx-auto space-y-3">
              <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                Need immediate activation? Reach our onboarding team now:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Call Us Button */}
                <button
                  type="button"
                  onClick={handleCall}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition-all shadow-md hover:scale-[1.02] cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-[#FF5A1F]" />
                  <span>Call Us Now</span>
                </button>

                {/* 2. Book a Meeting Button */}
                <button
                  type="button"
                  onClick={handleBookMeeting}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white hover:bg-[#F4F4F5] border-2 border-[#E4E4E7] hover:border-[#D4D4D8] text-[#18181B] text-xs font-bold transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#3B82F6]" />
                  <span>Book a Meeting</span>
                </button>

                {/* 3. Email Us Button */}
                <button
                  type="button"
                  onClick={handleEmailUs}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white hover:bg-[#F4F4F5] border-2 border-[#E4E4E7] hover:border-[#D4D4D8] text-[#18181B] text-xs font-bold transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-[#10B981]" />
                  <span>Email Team</span>
                </button>
              </div>

              {/* Direct WhatsApp Option */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#128C7E] hover:underline"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Or text us anytime on WhatsApp ({PHONE_NUMBER})</span>
                </button>
              </div>
            </div>

            {/* Back to Home / Reset */}
            <div className="mt-8 pt-6 border-t border-[#E4E4E7] flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setRestaurantInput('');
                  setSelectedLead(null);
                  setContactName('');
                  setPhone('+31 ');
                  setEmail('');
                  setSubmitResult(null);
                }}
                className="text-xs text-[#71717A] hover:text-[#18181B] font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Submit another restaurant application</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="py-4 text-center text-xs text-[#A1A1AA] border-t border-[#E4E4E7] bg-white/50">
        <span>Spoonful B.V. • Partner Network Enschede • Secure TLS 1.3 Transmission</span>
      </footer>

    </div>
  );
};

