import React, { useState } from 'react';
import { User, Volume2, Palette, Shield, Database, Info, ChevronRight } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import EgoStatesModal from './EgoStatesModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEgoState?: string;
  onEgoStateChange?: (egoStateId: string) => void;
}

export default function SettingsModal({ isOpen, onClose, selectedEgoState, onEgoStateChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('account');
  const [showEgoStates, setShowEgoStates] = useState(false);

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
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-white/20">
              <h3 className="text-white font-medium mb-3">Account Status</h3>
              <p className="text-white/70 text-sm mb-3">Free Plan - 1 session per day</p>
              <button className="w-full px-4 py-3 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400 font-medium hover:bg-blue-500/30 transition-all duration-300">
                Upgrade to Pro
              </button>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-4 border border-white/20">
              <h3 className="text-white font-medium mb-3">Stripe Customer Portal</h3>
              <p className="text-white/70 text-sm mb-3">Manage billing and subscriptions</p>
              <button className="w-full px-4 py-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 font-medium hover:bg-green-500/30 transition-all duration-300">
                Open Billing Portal
              </button>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">Voice Guidance</span>
                <div className="w-12 h-6 bg-green-500/20 rounded-full border border-green-500/40 flex items-center px-1">
                  <div className="w-4 h-4 bg-green-400 rounded-full ml-auto" />
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-sm">Voice Volume</span>
                <input type="range" min="0" max="100" defaultValue="80" className="w-24" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Speech Rate</span>
                <input type="range" min="0.5" max="2" step="0.1" defaultValue="1" className="w-24" />
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">Dark Mode</span>
                <div className="w-12 h-6 bg-purple-500/20 rounded-full border border-purple-500/40 flex items-center px-1">
                  <div className="w-4 h-4 bg-purple-400 rounded-full ml-auto" />
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-sm">Haptic Feedback</span>
                <div className="w-12 h-6 bg-white/10 rounded-full border border-white/20 flex items-center px-1">
                  <div className="w-4 h-4 bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'ego-states':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl p-4 border border-white/20">
              <h3 className="text-white font-medium mb-3">Ego States Collection</h3>
              <p className="text-white/70 text-sm mb-4">Manage your inner guides and unlock new states</p>
              <button 
                onClick={() => setShowEgoStates(true)}
                className="w-full px-4 py-3 bg-orange-500/20 border border-orange-500/40 rounded-lg text-orange-400 font-medium hover:bg-orange-500/30 transition-all duration-300 flex items-center justify-between"
              >
                Open Collection
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-white/20">
              <h3 className="text-white font-medium mb-3">Data Management</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white/80 hover:bg-white/20 transition-all duration-300">
                  Export Usage Data
                </button>
                <button className="w-full px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/30 transition-all duration-300">
                  Reset Local State
                </button>
              </div>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-xl p-4 border border-white/20">
              <h3 className="text-white font-medium mb-3">Hypno Portal v1.0</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300">
                  Privacy Policy
                </button>
                <button className="w-full text-left px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300">
                  Terms of Service
                </button>
                <button className="w-full text-left px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300">
                  Open Source Licenses
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
        className="md:max-w-4xl"
      >
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
      </ModalShell>

      {selectedEgoState && onEgoStateChange && (
        <EgoStatesModal
          isOpen={showEgoStates}
          onClose={() => setShowEgoStates(false)}
          selectedEgoState={selectedEgoState}
          onEgoStateChange={onEgoStateChange}
        />
      )}
    </>
  );
}