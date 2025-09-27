import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Book, Brain, Eye, ArrowRight, FileText, HelpCircle, Play, CreditCard as Edit } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import { useAppStore } from '../../store';
import { HYPNOSIS_PROTOCOLS, getRecommendedProtocols } from '../../data/protocols';

interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  content: any[];
}

interface StarterProtocol {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  flow: string[];
}

const CURATED_STARTERS: StarterProtocol[] = [
  {
    id: 'quick-calm',
    name: 'Quick Calm',
    description: 'Fast stress relief for busy moments',
    category: 'Stress Relief',
    difficulty: 'Beginner',
    duration: 5,
    flow: ['Progressive Relaxation', 'Breathing Focus', 'Rapid Release', 'Gentle Return']
  },
  {
    id: 'confidence-boost',
    name: 'Confidence Boost',
    description: 'Build self-assurance and inner strength',
    category: 'Confidence',
    difficulty: 'Beginner',
    duration: 10,
    flow: ['Anchoring Induction', 'Success Visualization', 'Confidence Installation', 'Power Integration']
  },
  {
    id: 'deep-sleep',
    name: 'Deep Sleep',
    description: 'Natural transition to restful sleep',
    category: 'Sleep',
    difficulty: 'Beginner',
    duration: 15,
    flow: ['Body Scan', 'Progressive Release', 'Sleep Suggestions', 'Drift Away']
  },
  {
    id: 'focus-enhancement',
    name: 'Focus Enhancement',
    description: 'Sharpen concentration and mental clarity',
    category: 'Performance',
    difficulty: 'Intermediate',
    duration: 12,
    flow: ['Attention Induction', 'Mental Clearing', 'Focus Installation', 'Alert Emergence']
  },
  {
    id: 'emotional-healing',
    name: 'Emotional Healing',
    description: 'Process and transform difficult emotions',
    category: 'Healing',
    difficulty: 'Intermediate',
    duration: 20,
    flow: ['Safe Space Creation', 'Emotion Recognition', 'Healing Light Work', 'Integration']
  },
  {
    id: 'habit-transformation',
    name: 'Habit Transformation',
    description: 'Replace old patterns with empowering ones',
    category: 'Habits',
    difficulty: 'Advanced',
    duration: 25,
    flow: ['Pattern Recognition', 'Aversion Creation', 'New Pattern Installation', 'Future Pacing']
  }
];

const INDUCTION_METHODS = [
  {
    id: 'progressive',
    name: 'Progressive Relaxation',
    description: 'Systematic muscle relaxation from head to toe',
    steps: ['Focus on breathing', 'Relax facial muscles', 'Release shoulder tension', 'Continue down the body', 'Achieve full relaxation']
  },
  {
    id: 'rapid',
    name: 'Rapid Induction (Elman)',
    description: 'Quick, direct hypnotic induction',
    steps: ['Close eyes on command', 'Relax eyelids completely', 'Test eyelid catalepsy', 'Deepen with counting', 'Establish somnambulism']
  },
  {
    id: 'breath',
    name: 'Breath-Based',
    description: 'Using rhythmic breathing to induce trance',
    steps: ['Establish breathing rhythm', 'Focus on breath sensations', 'Deepen with exhales', 'Natural trance emergence', 'Maintain awareness']
  },
  {
    id: 'visualization',
    name: 'Visualization Journey',
    description: 'Guided imagery to create hypnotic state',
    steps: ['Set the scene', 'Engage all senses', 'Build immersive experience', 'Deepen the journey', 'Establish trance state']
  }
];

const DEEPENING_TECHNIQUES = [
  {
    id: 'counting',
    name: 'Counting Deepener',
    description: 'Numerical progression to deepen trance',
    example: 'With each number, going deeper... 10... 9... 8...'
  },
  {
    id: 'staircase',
    name: 'Staircase Method',
    description: 'Imaginary descent for deeper relaxation',
    example: 'Step by step down the staircase, each step twice as relaxed...'
  },
  {
    id: 'elevator',
    name: 'Elevator Technique',
    description: 'Smooth descent through levels of consciousness',
    example: 'Going down... floor by floor... deeper with each level...'
  }
];

const PHENOMENA_TYPES = [
  {
    id: 'catalepsy',
    name: 'Catalepsy',
    description: 'Muscular rigidity or inability to move',
    applications: ['Depth testing', 'Convincer', 'Therapeutic tool']
  },
  {
    id: 'anesthesia',
    name: 'Anesthesia',
    description: 'Reduced or eliminated sensation',
    applications: ['Pain management', 'Comfort enhancement', 'Medical procedures']
  },
  {
    id: 'amnesia',
    name: 'Amnesia',
    description: 'Temporary forgetting of specific information',
    applications: ['Habit change', 'Trauma processing', 'Fresh perspective']
  },
  {
    id: 'hallucination',
    name: 'Positive/Negative Hallucinations',
    description: 'Seeing what\'s not there or not seeing what is',
    applications: ['Phobia treatment', 'Confidence building', 'Perception shifting']
  }
];

const CLOSING_METHODS = [
  {
    id: 'counting-up',
    name: 'Counting Up',
    description: 'Traditional 1-5 count to alertness',
    script: '1... 2... 3... 4... 5... eyes open, fully alert!'
  },
  {
    id: 'natural-awakening',
    name: 'Natural Awakening',
    description: 'Gentle, gradual return to awareness',
    script: 'When you\'re ready... naturally and easily... return to full awareness...'
  },
  {
    id: 'energy-return',
    name: 'Energy Return',
    description: 'Restoration of vitality and alertness',
    script: 'Feel energy flowing back... vitality returning... fully energized and alert...'
  }
];

const FAQ_ITEMS = [
  {
    question: 'What is hypnotherapy?',
    answer: 'Hypnotherapy is a therapeutic technique that uses guided relaxation and focused attention to achieve a heightened state of awareness (trance). In this state, you can explore thoughts, feelings, and memories that might be hidden from your conscious mind.'
  },
  {
    question: 'Is hypnosis safe?',
    answer: 'Yes, hypnosis is completely safe when practiced properly. You remain in control at all times and can emerge from the state whenever you choose. You cannot be made to do anything against your will.'
  },
  {
    question: 'How do ego states work?',
    answer: 'Ego states are different aspects of your personality that can be accessed for specific purposes. Each state (Guardian, Rebel, Mystic, etc.) offers unique strengths and perspectives for transformation.'
  },
  {
    question: 'What if I can\'t be hypnotized?',
    answer: 'Everyone can experience hypnosis to some degree. It\'s a natural state similar to daydreaming. Success often depends on your willingness to participate and the rapport with your guide.'
  },
  {
    question: 'How often should I practice?',
    answer: 'For best results, practice daily if possible. Even 5-10 minutes per day can create significant changes over time. Consistency is more important than duration.'
  }
];

const GLOSSARY_TERMS = [
  { term: 'Anchoring', definition: 'Creating a specific trigger (touch, word, image) that recalls a desired state or feeling' },
  { term: 'Catalepsy', definition: 'A trance phenomenon where muscles become rigid or immobile' },
  { term: 'Deepening', definition: 'Techniques used to enhance the hypnotic state after initial induction' },
  { term: 'Emergence', definition: 'The process of returning from hypnotic trance to normal waking consciousness' },
  { term: 'Fractionation', definition: 'Repeatedly inducing and emerging from trance to deepen the state' },
  { term: 'Ideomotor', definition: 'Unconscious muscle movements that can indicate subconscious responses' },
  { term: 'Induction', definition: 'The initial process of guiding someone into a hypnotic state' },
  { term: 'Post-hypnotic suggestion', definition: 'Instructions given during trance to take effect after awakening' },
  { term: 'Rapport', definition: 'The trusting relationship between hypnotist and subject' },
  { term: 'Somnambulism', definition: 'A deep level of trance where complex phenomena can occur' }
];

export default function DocumentationHubModal() {
  const { modals, closeModal, setActiveTab } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [openSection, setOpenSection] = useState<string>('starters');
  const [selectedProtocol, setSelectedProtocol] = useState<StarterProtocol | null>(null);
  const [showProtocolFlow, setShowProtocolFlow] = useState(false);

  const docSections: DocSection[] = [
    {
      id: 'starters',
      title: 'Starter Protocols',
      icon: Play,
      content: CURATED_STARTERS
    },
    {
      id: 'inductions',
      title: 'Induction Methods',
      icon: Brain,
      content: INDUCTION_METHODS
    },
    {
      id: 'deepeners',
      title: 'Deepening Techniques',
      icon: Eye,
      content: DEEPENING_TECHNIQUES
    },
    {
      id: 'phenomena',
      title: 'Hypnotic Phenomena',
      icon: Brain,
      content: PHENOMENA_TYPES
    },
    {
      id: 'closers',
      title: 'Closing Methods',
      icon: ArrowRight,
      content: CLOSING_METHODS
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: HelpCircle,
      content: FAQ_ITEMS
    },
    {
      id: 'glossary',
      title: 'Glossary',
      icon: Book,
      content: GLOSSARY_TERMS
    }
  ];

  const handleSectionToggle = (sectionId: string) => {
    setOpenSection(openSection === sectionId ? '' : sectionId);
  };

  const handleLoadInCreate = (item: any) => {
    // Close modal and switch to Create tab with preloaded template
    closeModal('documentationHub');
    setActiveTab('create');
    // TODO: Pass template data to Create tab
  };

  const handlePreviewFlow = (protocol: StarterProtocol) => {
    setSelectedProtocol(protocol);
    setShowProtocolFlow(true);
  };

  const getFilteredResults = () => {
    if (!searchQuery.trim()) return { methods: [], starters: [], glossary: [] };

    const query = searchQuery.toLowerCase();
    
    return {
      methods: INDUCTION_METHODS.concat(DEEPENING_TECHNIQUES, CLOSING_METHODS).filter(method =>
        method.name.toLowerCase().includes(query) ||
        method.description.toLowerCase().includes(query)
      ),
      starters: CURATED_STARTERS.filter(starter =>
        starter.name.toLowerCase().includes(query) ||
        starter.description.toLowerCase().includes(query) ||
        starter.category.toLowerCase().includes(query)
      ),
      glossary: GLOSSARY_TERMS.filter(item =>
        item.term.toLowerCase().includes(query) ||
        item.definition.toLowerCase().includes(query)
      )
    };
  };

  const searchResults = getFilteredResults();
  const hasSearchResults = searchQuery.trim() && (
    searchResults.methods.length > 0 || 
    searchResults.starters.length > 0 || 
    searchResults.glossary.length > 0
  );

  return (
    <>
      <ModalShell
        isOpen={modals.documentationHub}
        onClose={() => closeModal('documentationHub')}
        title="Libero Documentation Hub"
        className="max-w-4xl h-[85vh]"
      >
        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className="flex-shrink-0 mb-6">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search methods, protocols, terms..."
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 focus:bg-white/15 transition-all"
              />
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {hasSearchResults ? (
              /* Search Results */
              <div className="space-y-6">
                {searchResults.starters.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-3 flex items-center space-x-2">
                      <Play size={20} className="text-teal-400" />
                      <span>Starter Protocols</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {searchResults.starters.map(starter => (
                        <div key={starter.id} className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-4 border border-white/20">
                          <h4 className="text-white font-semibold mb-2">{starter.name}</h4>
                          <p className="text-white/70 text-sm mb-3">{starter.description}</p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePreviewFlow(starter)}
                              className="flex-1 px-3 py-2 bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all text-sm"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleLoadInCreate(starter)}
                              className="flex-1 px-3 py-2 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-all text-sm"
                            >
                              Load in Create
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.methods.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-3 flex items-center space-x-2">
                      <Brain size={20} className="text-purple-400" />
                      <span>Methods</span>
                    </h3>
                    <div className="space-y-2">
                      {searchResults.methods.map(method => (
                        <div key={method.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <h4 className="text-white font-medium">{method.name}</h4>
                          <p className="text-white/70 text-sm">{method.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.glossary.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-3 flex items-center space-x-2">
                      <Book size={20} className="text-yellow-400" />
                      <span>Glossary</span>
                    </h3>
                    <div className="space-y-2">
                      {searchResults.glossary.map(item => (
                        <div key={item.term} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <h4 className="text-white font-medium">{item.term}</h4>
                          <p className="text-white/70 text-sm">{item.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Documentation Sections */
              <div className="space-y-3">
                {docSections.map(section => {
                  const IconComponent = section.icon;
                  const isOpen = openSection === section.id;
                  
                  return (
                    <div key={section.id} className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl border border-white/20 overflow-hidden">
                      <button
                        onClick={() => handleSectionToggle(section.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent size={20} className="text-teal-400" />
                          <span className="text-white font-semibold">{section.title}</span>
                          <span className="text-white/60 text-sm">({section.content.length})</span>
                        </div>
                        {isOpen ? 
                          <ChevronDown size={20} className="text-white/60" /> : 
                          <ChevronRight size={20} className="text-white/60" />
                        }
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 animate-slide-up">
                          {section.id === 'starters' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {CURATED_STARTERS.map(starter => (
                                <div key={starter.id} className="bg-black/20 rounded-lg p-4 border border-white/10">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-white font-semibold">{starter.name}</h4>
                                    <span className="text-xs px-2 py-1 bg-teal-500/20 text-teal-400 rounded-full">
                                      {starter.duration}m
                                    </span>
                                  </div>
                                  <p className="text-white/70 text-sm mb-3">{starter.description}</p>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handlePreviewFlow(starter)}
                                      className="flex-1 px-3 py-2 bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all text-sm flex items-center justify-center space-x-1"
                                    >
                                      <Eye size={14} />
                                      <span>Preview Flow</span>
                                    </button>
                                    <button
                                      onClick={() => handleLoadInCreate(starter)}
                                      className="flex-1 px-3 py-2 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-all text-sm flex items-center justify-center space-x-1"
                                    >
                                      <Edit size={14} />
                                      <span>Load in Create</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {section.id === 'inductions' && (
                            <div className="space-y-4">
                              {INDUCTION_METHODS.map(method => (
                                <div key={method.id} className="bg-black/20 rounded-lg p-4 border border-white/10">
                                  <h4 className="text-white font-semibold mb-2">{method.name}</h4>
                                  <p className="text-white/70 text-sm mb-3">{method.description}</p>
                                  <div className="space-y-1">
                                    <span className="text-white/60 text-xs font-medium">TYPICAL FLOW:</span>
                                    {method.steps.map((step, i) => (
                                      <div key={i} className="flex items-center space-x-2 text-sm">
                                        <span className="text-teal-400 font-bold">{i + 1}.</span>
                                        <span className="text-white/80">{step}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {section.id === 'deepeners' && (
                            <div className="space-y-4">
                              {DEEPENING_TECHNIQUES.map(technique => (
                                <div key={technique.id} className="bg-black/20 rounded-lg p-4 border border-white/10">
                                  <h4 className="text-white font-semibold mb-2">{technique.name}</h4>
                                  <p className="text-white/70 text-sm mb-3">{technique.description}</p>
                                  <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                                    <span className="text-white/60 text-xs font-medium">EXAMPLE:</span>
                                    <p className="text-white/80 text-sm italic mt-1">"{technique.example}"</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {section.id === 'phenomena' && (
                            <div className="space-y-4">
                              {PHENOMENA_TYPES.map(phenomenon => (
                                <div key={phenomenon.id} className="bg-black/20 rounded-lg p-4 border border-white/10">
                                  <h4 className="text-white font-semibold mb-2">{phenomenon.name}</h4>
                                  <p className="text-white/70 text-sm mb-3">{phenomenon.description}</p>
                                  <div>
                                    <span className="text-white/60 text-xs font-medium">APPLICATIONS:</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {phenomenon.applications.map((app, i) => (
                                        <span key={i} className="px-2 py-1 bg-white/10 text-white/80 rounded-full text-xs">
                                          {app}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {section.id === 'closers' && (
                            <div className="space-y-4">
                              {CLOSING_METHODS.map(method => (
                                <div key={method.id} className="bg-black/20 rounded-lg p-4 border border-white/10">
                                  <h4 className="text-white font-semibold mb-2">{method.name}</h4>
                                  <p className="text-white/70 text-sm mb-3">{method.description}</p>
                                  <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                                    <span className="text-white/60 text-xs font-medium">EXAMPLE SCRIPT:</span>
                                    <p className="text-white/80 text-sm italic mt-1">"{method.script}"</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {section.id === 'faq' && (
                            <div className="space-y-4">
                              {FAQ_ITEMS.map((faq, i) => (
                                <div key={i} className="bg-black/20 rounded-lg p-4 border border-white/10">
                                  <h4 className="text-white font-semibold mb-2">{faq.question}</h4>
                                  <p className="text-white/80 text-sm leading-relaxed">{faq.answer}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {section.id === 'glossary' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {GLOSSARY_TERMS.map(item => (
                                <div key={item.term} className="bg-black/20 rounded-lg p-4 border border-white/10">
                                  <h4 className="text-white font-semibold mb-2">{item.term}</h4>
                                  <p className="text-white/70 text-sm">{item.definition}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ModalShell>

      {/* Protocol Flow Preview Modal */}
      {showProtocolFlow && selectedProtocol && (
        <ModalShell
          isOpen={showProtocolFlow}
          onClose={() => setShowProtocolFlow(false)}
          title={`${selectedProtocol.name} - Flow Preview`}
          className="max-w-2xl"
          footer={
            <div className="flex space-x-3">
              <button
                onClick={() => setShowProtocolFlow(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleLoadInCreate(selectedProtocol);
                  setShowProtocolFlow(false);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold hover:scale-105 transition-transform duration-200 shadow-lg shadow-teal-400/30"
              >
                Load in Create
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Protocol Overview */}
            <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-teal-500/20">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-white font-bold text-lg">{selectedProtocol.duration}m</div>
                  <div className="text-white/60 text-xs">Duration</div>
                </div>
                <div>
                  <div className="text-teal-400 font-bold text-lg">{selectedProtocol.difficulty}</div>
                  <div className="text-white/60 text-xs">Level</div>
                </div>
                <div>
                  <div className="text-purple-400 font-bold text-lg">{selectedProtocol.category}</div>
                  <div className="text-white/60 text-xs">Category</div>
                </div>
              </div>
              <p className="text-white/80 text-sm text-center">{selectedProtocol.description}</p>
            </div>

            {/* Flow Steps */}
            <div>
              <h4 className="text-white font-semibold mb-4">Protocol Flow</h4>
              <div className="space-y-3">
                {selectedProtocol.flow.map((step, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-400 font-bold text-sm">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{step}</div>
                    </div>
                    {i < selectedProtocol.flow.length - 1 && (
                      <ArrowRight size={16} className="text-white/40" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
}