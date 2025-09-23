import React, { useState } from 'react';
import { User, Volume2, Palette, Shield, Database, Info, ChevronRight } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import { useAppStore } from '../../state/appStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEgoState?: string;
  onEgoStateChange?: (egoStateId: string) => void;
}

export default function SettingsModal({ isOpen, onClose, selectedEgoState, onEgoStateChange }: SettingsModalProps) {
  const { openEgoModal } = useAppStore();
  const [activeTab, setActiveTab] = useState('account');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabs = [
    { id: 'account', name: 'Account', icon: User, color: 'text-blue-400' },
    { id: 'audio', name: 'Audio & Voice', icon: Volume2, color: 'text-green-400' },
    { id: 'appearance', name: 'Appearance', icon: Palette, color: 'text-purple-400' },
    { id: 'ego-states', name: 'Ego States', icon: Shield, color: 'text-orange-400' },
    { id: 'data', name: 'Data', icon: Database, color: 'text-red-400' },
    { id: 'about', name: 'About', icon: Info, color: 'text-gray-400' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-medium mb-3">Account Status</h3>
              <p className="text-white/70 text-base mb-4">Free Plan - 1 session per day</p>
              <button className="w-full px-6 py-4 bg-blue-500/20 border border-blue-500/40 rounded-xl text-blue-400 font-semibold hover:bg-blue-500/30 transition-all duration-300 hover:scale-105">
                Upgrade to Pro
              </button>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-medium mb-3">Stripe Customer Portal</h3>
              <p className="text-white/70 text-base mb-4">Manage billing and subscriptions</p>
              <button className="w-full px-6 py-4 bg-green-500/20 border border-green-500/40 rounded-xl text-green-400 font-semibold hover:bg-green-500/30 transition-all duration-300 hover:scale-105">
                Open Billing Portal
              </button>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-6 border border-white/20">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-base">Voice Guidance</span>
                  <div className="w-14 h-7 bg-green-500/20 rounded-full border border-green-500/40 flex items-center px-1 cursor-pointer hover:bg-green-500/30 transition-all">
                    <div className="w-5 h-5 bg-green-400 rounded-full ml-auto shadow-lg" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 text-base">Voice Volume</span>
                      <span className="text-green-400 font-semibold">80%</span>
                    </div>
                    <input type="range" min="0" max="100" defaultValue="80" className="glass-slider w-full" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 text-base">Speech Rate</span>
                      <span className="text-green-400 font-semibold">1.0x</span>
                    </div>
                    <input type="range" min="0.5" max="2" step="0.1" defaultValue="1" className="glass-slider w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-white/20">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium text-base block">Dark Mode</span>
                    <span className="text-purple-400/80 text-sm">Cosmic night theme</span>
                  </div>
                  <div className="w-14 h-7 bg-purple-500/20 rounded-full border border-purple-500/40 flex items-center px-1 cursor-pointer hover:bg-purple-500/30 transition-all">
                    <div className="w-5 h-5 bg-purple-400 rounded-full ml-auto shadow-lg" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium text-base block">Haptic Feedback</span>
                    <span className="text-white/60 text-sm">Touch vibrations</span>
                  </div>
                  <div className="w-14 h-7 bg-white/10 rounded-full border border-white/20 flex items-center px-1 cursor-pointer hover:bg-white/20 transition-all">
                    <div className="w-5 h-5 bg-white/40 rounded-full shadow-lg" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium text-base block">Reduce Motion</span>
                    <span className="text-white/60 text-sm">Accessibility setting</span>
                  </div>
                  <div className="w-14 h-7 bg-white/10 rounded-full border border-white/20 flex items-center px-1 cursor-pointer hover:bg-white/20 transition-all">
                    <div className="w-5 h-5 bg-white/40 rounded-full shadow-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'ego-states':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-medium mb-3">Ego States Collection</h3>
              <p className="text-white/70 text-base mb-6 leading-relaxed">Manage your inner guides and unlock new archetypal states for deeper transformation</p>
              <button 
                onClick={openEgoModal}
                className="w-full px-6 py-4 bg-orange-500/20 border border-orange-500/40 rounded-xl text-orange-400 font-semibold hover:bg-orange-500/30 transition-all duration-300 flex items-center justify-between hover:scale-105"
              >
                <span>Open Archetypal Collection</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-medium mb-3">Data Management</h3>
              <div className="space-y-4">
                <button className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white/80 hover:bg-white/20 transition-all duration-300 hover:scale-105 font-medium">
                  Export Usage Data
                </button>
                <button className="w-full px-6 py-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 hover:bg-red-500/30 transition-all duration-300 hover:scale-105 font-medium">
                  Reset Local State
                </button>
              </div>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-xl p-6 border border-white/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-purple-400 flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={24} className="text-black" />
                </div>
                <h3 className="text-white font-medium text-lg mb-2">Libero v1.0</h3>
                <p className="text-white/70 text-sm">The Hypnotist That Frees Minds</p>
              </div>
              
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 font-medium">
                  Privacy Policy
                </button>
                <button className="w-full text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 font-medium">
                  Terms of Service
                </button>
                <button className="w-full text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 font-medium">
                  Open Source Licenses
                </button>
                <button className="w-full text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 font-medium">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        title="Settings"
        className={isMobile ? "mx-2 my-4 max-h-[95vh]" : "md:max-w-4xl"}
      >
        {isMobile ? (
          /* Mobile Layout - Full Screen Stacked */
          <div className="h-full flex flex-col">
            {/* Mobile Tab Navigation */}
            <div className="flex-shrink-0 mb-6">
              <div className="grid grid-cols-3 gap-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center space-y-2 px-3 py-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                        activeTab === tab.id
                          ? 'bg-white/15 border border-white/30 shadow-lg'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                      style={{ minHeight: '80px' }}
                    >
                      <IconComponent size={24} className={tab.color} />
                      <span className="text-white font-medium text-xs text-center leading-tight">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {renderTabContent()}
            </div>
          </div>
        ) : (
          /* Desktop Layout - Sidebar */
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-1/3 pr-6 border-r border-white/10">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-white/10 border border-white/20'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <IconComponent size={20} className={tab.color} />
                      <span className="text-white font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pl-6">
              {renderTabContent()}
            </div>
          </div>
        )}
      </ModalShell>

    </>
  );
}