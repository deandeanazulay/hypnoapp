// Comprehensive Hypnotherapy Protocol Library
export interface HypnosisProtocol {
  id: string;
  name: string;
  description: string;
  category: 'stress-relief' | 'sleep' | 'confidence' | 'habits' | 'pain-management' | 'phobias' | 'performance' | 'emotional-healing';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: 10 | 20 | 30 | 45;
  benefits: string[];
  tags: string[];
  preparationSteps: string[];
  postSessionTips: string[];
  script: {
    induction: string;
    deepening: string;
    suggestions: string;
    emergence: string;
  };
  isPopular?: boolean;
  isRecommended?: boolean;
}

export const PROTOCOL_CATEGORIES = [
  { id: 'stress-relief', name: 'Stress Relief', icon: '🧘', color: 'from-blue-500/20 to-cyan-500/20' },
  { id: 'sleep', name: 'Sleep Enhancement', icon: '🌙', color: 'from-indigo-500/20 to-purple-500/20' },
  { id: 'confidence', name: 'Confidence Building', icon: '💪', color: 'from-orange-500/20 to-amber-500/20' },
  { id: 'habits', name: 'Habit Change', icon: '🔄', color: 'from-green-500/20 to-teal-500/20' },
  { id: 'pain-management', name: 'Pain Management', icon: '🩹', color: 'from-red-500/20 to-pink-500/20' },
  { id: 'phobias', name: 'Phobia Treatment', icon: '🦋', color: 'from-purple-500/20 to-indigo-500/20' },
  { id: 'performance', name: 'Performance', icon: '🎯', color: 'from-yellow-500/20 to-orange-500/20' },
  { id: 'emotional-healing', name: 'Emotional Healing', icon: '💚', color: 'from-emerald-500/20 to-green-500/20' }
] as const;

export const HYPNOSIS_PROTOCOLS: HypnosisProtocol[] = [
  // STRESS RELIEF PROTOCOLS
  {
    id: 'progressive-relaxation-basic',
    name: 'Progressive Relaxation',
    description: 'Classic muscle relaxation technique perfect for beginners to release physical and mental tension',
    category: 'stress-relief',
    difficulty: 'beginner',
    duration: 20,
    benefits: ['Reduces muscle tension', 'Calms nervous system', 'Easy to learn', 'Immediate stress relief'],
    tags: ['muscle relaxation', 'tension release', 'beginner-friendly', 'body awareness'],
    preparationSteps: [
      'Find a comfortable position lying down or sitting',
      'Wear loose, comfortable clothing',
      'Ensure you won\'t be disturbed for 20 minutes',
      'Dim the lights or close your eyes'
    ],
    postSessionTips: [
      'Take a few minutes to stretch gently',
      'Drink water to stay hydrated',
      'Notice how different your body feels',
      'Practice this technique daily for best results'
    ],
    script: {
      induction: 'Close your eyes and take three deep breaths... Feel your body settling into the chair or bed... Starting with your toes, begin to notice each part of your body...',
      deepening: 'With each breath, you\'re going deeper into relaxation... Feel your muscles becoming loose and heavy... Each exhale releases more tension...',
      suggestions: 'Your body knows how to relax completely... You can return to this peaceful state whenever you need to... Stress flows away like water...',
      emergence: 'In a moment, I\'ll count from 1 to 5... With each number, you\'ll become more alert and refreshed... 1... 2... 3... 4... 5... Eyes open, fully alert.'
    },
    isPopular: true,
    isRecommended: true
  },
  {
    id: 'rapid-stress-release',
    name: 'Rapid Stress Release',
    description: 'Quick and effective technique for immediate stress relief in urgent situations',
    category: 'stress-relief',
    difficulty: 'intermediate',
    duration: 10,
    benefits: ['Fast stress relief', 'Can be used anywhere', 'Builds confidence', 'Practical for daily use'],
    tags: ['quick relief', 'emergency technique', 'workplace stress', 'anxiety'],
    preparationSteps: [
      'Find a quiet moment, even just 5 minutes',
      'Sit comfortably with feet flat on floor',
      'Place one hand on chest, one on stomach',
      'Set intention to release stress quickly'
    ],
    postSessionTips: [
      'Take three deep breaths before returning to activity',
      'Use this technique whenever stress arises',
      'Practice regularly to strengthen the response',
      'Combine with positive self-talk'
    ],
    script: {
      induction: 'Take a deep breath and hold it for 4 seconds... Now exhale slowly for 6 seconds... Feel immediate relief washing over you...',
      deepening: 'With each breath, stress melts away faster and faster... Your body knows exactly how to let go...',
      suggestions: 'You have the power to release stress instantly... This calm feeling is always available to you... You handle challenges with ease...',
      emergence: 'Count down 3, 2, 1... Take a deep breath and open your eyes, feeling refreshed and capable.'
    },
    isPopular: true
  },

  // SLEEP ENHANCEMENT PROTOCOLS
  {
    id: 'bedtime-ritual',
    name: 'Bedtime Ritual',
    description: 'Gentle transition into deep, restorative sleep using progressive relaxation and sleep suggestions',
    category: 'sleep',
    difficulty: 'beginner',
    duration: 30,
    benefits: ['Improves sleep quality', 'Reduces bedtime anxiety', 'Creates healthy sleep habits', 'Natural sleep induction'],
    tags: ['insomnia', 'sleep quality', 'bedtime routine', 'relaxation'],
    preparationSteps: [
      'Complete your bedtime routine (brush teeth, etc.)',
      'Ensure bedroom is cool, dark, and quiet',
      'Lie in your normal sleeping position',
      'Turn off all electronic devices'
    ],
    postSessionTips: [
      'If you wake up, use the breathing technique from the session',
      'Avoid looking at clocks if you wake during the night',
      'Trust that rest is happening even if you don\'t sleep immediately',
      'Use this protocol consistently for 2 weeks for best results'
    ],
    script: {
      induction: 'Settle into your bed and feel how comfortable and supportive it is... Notice how tired your body feels after the day... Let your breathing slow and deepen naturally...',
      deepening: 'With each breath, you sink deeper into the mattress... Your mind begins to quiet... Thoughts drift away like clouds...',
      suggestions: 'Your body knows exactly how to sleep deeply and peacefully... You wake refreshed and energized... Sleep comes easily and naturally...',
      emergence: 'Continue drifting deeper into peaceful sleep... Let these suggestions work in your subconscious mind throughout the night...'
    },
    isRecommended: true
  },
  {
    id: 'dream-enhancement',
    name: 'Lucid Dream Enhancement',
    description: 'Advanced protocol for developing dream awareness and control using visualization and reality checks',
    category: 'sleep',
    difficulty: 'advanced',
    duration: 45,
    benefits: ['Increases dream recall', 'Develops lucid dreaming ability', 'Enhances creativity', 'Improves sleep awareness'],
    tags: ['lucid dreaming', 'dream recall', 'consciousness', 'advanced'],
    preparationSteps: [
      'Keep a dream journal by your bedside',
      'Practice reality checks throughout the day',
      'Set intention to remember dreams',
      'Avoid caffeine 6 hours before sleep'
    ],
    postSessionTips: [
      'Write down any dreams immediately upon waking',
      'Practice reality checks when you wake up',
      'Be patient - lucid dreaming develops over time',
      'Continue dream journaling daily'
    ],
    script: {
      induction: 'As you prepare for sleep, set the intention to become aware in your dreams... Feel your consciousness expanding beyond the physical body...',
      deepening: 'Deeper and deeper into the realm between waking and sleeping... Your awareness remains alert while your body rests...',
      suggestions: 'In your dreams, you will recognize when you are dreaming... You have control over your dream experiences... You remember your dreams clearly...',
      emergence: 'Carry this awareness into your dreams... Sleep deeply while your consciousness explores new realms...'
    }
  },

  // CONFIDENCE BUILDING PROTOCOLS
  {
    id: 'self-confidence-builder',
    name: 'Self-Confidence Builder',
    description: 'Build unshakeable self-confidence through visualization and positive programming',
    category: 'confidence',
    difficulty: 'beginner',
    duration: 20,
    benefits: ['Increases self-esteem', 'Reduces social anxiety', 'Builds inner strength', 'Improves self-image'],
    tags: ['self-esteem', 'social confidence', 'inner strength', 'positive thinking'],
    preparationSteps: [
      'Think of a situation where you want more confidence',
      'Sit or lie in a confident posture',
      'Recall a time when you felt truly confident',
      'Set intention to embody confidence'
    ],
    postSessionTips: [
      'Practice confident body language throughout the day',
      'Remind yourself of the confident feelings from the session',
      'Use the anchor phrase "I am confident" when needed',
      'Visualize successful outcomes before challenging situations'
    ],
    script: {
      induction: 'Sit up straight and feel the strength in your spine... Remember a time when you felt completely confident... Let that feeling grow stronger...',
      deepening: 'This confidence flows through every cell of your body... You feel it in your posture, your voice, your presence...',
      suggestions: 'You are naturally confident and capable... You trust in your abilities... Others see your confidence and respect you for it...',
      emergence: 'Bring this confidence back with you... Feel it in your body as you return to full awareness... 1, 2, 3, 4, 5, eyes open, fully confident.'
    },
    isPopular: true,
    isRecommended: true
  },
  {
    id: 'public-speaking-mastery',
    name: 'Public Speaking Mastery',
    description: 'Overcome speaking fears and develop compelling presentation skills through mental rehearsal',
    category: 'confidence',
    difficulty: 'intermediate',
    duration: 30,
    benefits: ['Eliminates speaking anxiety', 'Improves presentation skills', 'Builds audience connection', 'Increases persuasive ability'],
    tags: ['public speaking', 'presentation', 'anxiety', 'communication'],
    preparationSteps: [
      'Prepare your upcoming speech or presentation',
      'Visualize the venue where you\'ll be speaking',
      'Think about your audience positively',
      'Set intention to be an effective communicator'
    ],
    postSessionTips: [
      'Practice your speech out loud',
      'Visualize success before each speaking opportunity',
      'Use deep breathing before speaking',
      'Remember the calm, confident feeling from hypnosis'
    ],
    script: {
      induction: 'Imagine yourself preparing for your presentation... Feel calm and confident as you think about speaking... Your body is relaxed and your mind is clear...',
      deepening: 'See yourself walking confidently to the stage... The audience is welcoming and interested... You feel completely at ease...',
      suggestions: 'You are a natural, compelling speaker... Your message flows effortlessly... The audience connects with your words... You enjoy sharing your knowledge...',
      emergence: 'Carry this speaking confidence with you always... Each time you speak, you become more skilled and confident... Eyes open, ready to inspire others.'
    }
  },

  // HABIT CHANGE PROTOCOLS
  {
    id: 'smoking-cessation',
    name: 'Freedom from Smoking',
    description: 'Comprehensive approach to quitting smoking using aversion therapy and positive replacement behaviors',
    category: 'habits',
    difficulty: 'intermediate',
    duration: 45,
    benefits: ['Reduces smoking cravings', 'Builds motivation to quit', 'Creates healthy substitutes', 'Strengthens willpower'],
    tags: ['smoking cessation', 'addiction', 'health', 'willpower'],
    preparationSteps: [
      'Set a quit date within the next week',
      'Remove all smoking materials from your space',
      'Prepare healthy replacement activities',
      'Commit fully to becoming smoke-free'
    ],
    postSessionTips: [
      'Avoid smoking triggers for the first week',
      'Use deep breathing when cravings arise',
      'Reward yourself for each smoke-free day',
      'Listen to this session daily for first month'
    ],
    script: {
      induction: 'Think about your decision to become smoke-free... Feel proud of this healthy choice... Your body wants to be clean and healthy...',
      deepening: 'Deeper into this commitment to health... See yourself as a non-smoker, free and healthy... This is who you truly are...',
      suggestions: 'Cigarettes are no longer appealing to you... You prefer fresh air and clean breathing... You are free from the smoking habit... Your body heals and strengthens...',
      emergence: 'Return as a confident non-smoker... Each day smoke-free makes you stronger... 1, 2, 3, 4, 5, awake and smoke-free.'
    }
  },
  {
    id: 'healthy-eating-habits',
    name: 'Mindful Eating Transformation',
    description: 'Develop a healthy relationship with food through mindfulness and portion awareness',
    category: 'habits',
    difficulty: 'beginner',
    duration: 20,
    benefits: ['Improves eating habits', 'Increases food awareness', 'Reduces emotional eating', 'Supports healthy weight'],
    tags: ['weight loss', 'mindful eating', 'food habits', 'health'],
    preparationSteps: [
      'Reflect on your current eating patterns',
      'Set realistic health goals',
      'Clear unhealthy foods from immediate environment',
      'Plan nutritious meals for the coming days'
    ],
    postSessionTips: [
      'Eat slowly and mindfully at your next meal',
      'Check in with hunger levels before eating',
      'Choose one healthy food to incorporate today',
      'Practice the mindful eating technique daily'
    ],
    script: {
      induction: 'Think about nourishing your body with healthy foods... Feel grateful for your body and its needs... Notice how good healthy foods make you feel...',
      deepening: 'Going deeper into this awareness of your body\'s wisdom... Your body knows exactly what it needs to be healthy...',
      suggestions: 'You naturally choose foods that nourish you... You eat slowly and mindfully... You stop eating when satisfied... Healthy foods taste better to you...',
      emergence: 'Return with this new awareness of mindful eating... Trust your body\'s wisdom... 1, 2, 3, 4, 5, awake and healthy.'
    },
    isRecommended: true
  },

  // PAIN MANAGEMENT PROTOCOLS
  {
    id: 'chronic-pain-relief',
    name: 'Chronic Pain Management',
    description: 'Advanced pain management using dissociation techniques and comfort suggestions',
    category: 'pain-management',
    difficulty: 'advanced',
    duration: 30,
    benefits: ['Reduces pain intensity', 'Improves pain coping', 'Increases comfort', 'Enhances quality of life'],
    tags: ['chronic pain', 'pain relief', 'comfort', 'medical'],
    preparationSteps: [
      'Consult with your healthcare provider first',
      'Find your most comfortable position',
      'Use any prescribed pain medications as directed',
      'Set intention for comfort and relief'
    ],
    postSessionTips: [
      'Move gently and mindfully',
      'Continue using pain management techniques learned',
      'Practice the comfort visualization daily',
      'Maintain regular medical care'
    ],
    script: {
      induction: 'Focus on the parts of your body that feel comfortable... Notice areas free from discomfort... Let these comfortable feelings expand...',
      deepening: 'Imagine a warm, healing light surrounding the uncomfortable areas... This light brings relief and comfort...',
      suggestions: 'Your body has natural healing abilities... You can find comfort even with challenges... Pain signals become less intense... You focus on comfort and healing...',
      emergence: 'Carry this comfort with you... Your body continues healing and finding relief... 1, 2, 3, 4, 5, comfortable and alert.'
    }
  },

  // PHOBIA TREATMENT PROTOCOLS
  {
    id: 'flying-phobia-cure',
    name: 'Confident Flying',
    description: 'Systematic desensitization for flying anxiety using gradual exposure and relaxation',
    category: 'phobias',
    difficulty: 'intermediate',
    duration: 30,
    benefits: ['Reduces flying anxiety', 'Builds travel confidence', 'Creates positive flying associations', 'Enables travel freedom'],
    tags: ['flying phobia', 'travel anxiety', 'desensitization', 'fear'],
    preparationSteps: [
      'Practice relaxation techniques for several days first',
      'Gather positive information about flight safety',
      'Visualize successful trips you want to take',
      'Start with short, familiar flights if possible'
    ],
    postSessionTips: [
      'Practice the relaxation technique before traveling',
      'Use the calm breathing during flights',
      'Focus on your destination and purpose for traveling',
      'Celebrate each successful flight'
    ],
    script: {
      induction: 'Imagine yourself planning a wonderful trip... Feel excited about your destination... You are calm and relaxed about the journey...',
      deepening: 'See yourself at the airport, feeling confident and calm... You understand that flying is safe and routine...',
      suggestions: 'You enjoy flying and feel completely safe... The sounds of the plane are comforting... You use flight time for relaxation... Flying takes you to wonderful places...',
      emergence: 'Return with this new confidence about flying... You look forward to your next trip... 1, 2, 3, 4, 5, confident traveler.'
    }
  },

  // PERFORMANCE ENHANCEMENT PROTOCOLS
  {
    id: 'athletic-performance',
    name: 'Peak Athletic Performance',
    description: 'Mental training for athletes to achieve optimal performance through visualization and confidence building',
    category: 'performance',
    difficulty: 'intermediate',
    duration: 30,
    benefits: ['Improves focus during competition', 'Builds mental toughness', 'Enhances muscle memory', 'Reduces performance anxiety'],
    tags: ['sports performance', 'competition', 'focus', 'mental training'],
    preparationSteps: [
      'Think about your next competition or performance',
      'Visualize your perfect technique or performance',
      'Set specific performance goals',
      'Prepare in athletic clothing if helpful'
    ],
    postSessionTips: [
      'Practice the visualization before training',
      'Use the breathing technique before competition',
      'Maintain the confident mindset during performance',
      'Review and adjust goals based on results'
    ],
    script: {
      induction: 'See yourself in your sport, performing at your absolute best... Feel the strength and skill in your body... You are in the zone...',
      deepening: 'Every movement is perfect and effortless... Your mind and body work in complete harmony... You perform beyond your previous limits...',
      suggestions: 'You are a peak performer... Pressure makes you stronger... You thrive in competition... Your skills improve with every practice...',
      emergence: 'Bring this peak performance mindset with you... You are ready to excel... 1, 2, 3, 4, 5, champion mindset activated.'
    }
  },

  // EMOTIONAL HEALING PROTOCOLS
  {
    id: 'anxiety-relief',
    name: 'Anxiety Relief & Calm',
    description: 'Gentle approach to reducing anxiety using breathing techniques and safe place visualization',
    category: 'emotional-healing',
    difficulty: 'beginner',
    duration: 20,
    benefits: ['Reduces anxiety symptoms', 'Creates sense of safety', 'Improves emotional regulation', 'Builds coping skills'],
    tags: ['anxiety', 'panic attacks', 'emotional support', 'safety'],
    preparationSteps: [
      'Identify your current anxiety level (1-10)',
      'Choose a real place where you feel completely safe',
      'Practice the 4-7-8 breathing technique',
      'Set intention to feel calm and safe'
    ],
    postSessionTips: [
      'Return to your safe place visualization when anxious',
      'Practice the breathing technique throughout the day',
      'Use positive self-talk from the session',
      'Gradually face anxiety-provoking situations with your new skills'
    ],
    script: {
      induction: 'Take a deep breath in for 4 counts... Hold for 7... Exhale for 8... Feel your body beginning to relax with each breath...',
      deepening: 'Imagine your safest, most peaceful place... You are completely protected here... Nothing can disturb this peace...',
      suggestions: 'You handle life\'s challenges with calm confidence... Anxiety flows through you and away... You trust in your ability to cope... You are safe and protected...',
      emergence: 'Carry this calm feeling with you... You can return to your safe place anytime... 1, 2, 3, 4, 5, calm and confident.'
    },
    isPopular: true,
    isRecommended: true
  },
  {
    id: 'grief-healing',
    name: 'Healing from Loss',
    description: 'Compassionate support for processing grief and finding peace after loss',
    category: 'emotional-healing',
    difficulty: 'intermediate',
    duration: 30,
    benefits: ['Processes grief healthily', 'Finds peace with loss', 'Honors loved ones', 'Reduces emotional pain'],
    tags: ['grief', 'loss', 'healing', 'support'],
    preparationSteps: [
      'Allow yourself to feel whatever emotions arise',
      'Have tissues nearby if needed',
      'Think of the person or thing you\'ve lost with love',
      'Set intention for healing and peace'
    ],
    postSessionTips: [
      'Be gentle with yourself today',
      'Express emotions through journaling or art',
      'Reach out to supportive friends or family',
      'Practice self-compassion and patience'
    ],
    script: {
      induction: 'Allow yourself to feel held and supported... Your grief is natural and shows how deeply you loved... You are not alone in this process...',
      deepening: 'Feel surrounded by love and compassion... Your heart can hold both grief and love... Healing happens in its own time...',
      suggestions: 'Your loved one lives on in your heart and memories... You can feel sad and still find moments of peace... Healing comes gradually and naturally... You honor your loss by living fully...',
      emergence: 'Return with a sense of peace and support... Grief and love can coexist... 1, 2, 3, 4, 5, supported and healing.'
    }
  }
];

// Helper functions
export const getProtocolsByCategory = (category: string) => {
  return HYPNOSIS_PROTOCOLS.filter(p => p.category === category);
};

export const getProtocolsByDifficulty = (difficulty: string) => {
  return HYPNOSIS_PROTOCOLS.filter(p => p.difficulty === difficulty);
};

export const getProtocolsByDuration = (duration: number) => {
  return HYPNOSIS_PROTOCOLS.filter(p => p.duration === duration);
};

export const getRecommendedProtocols = () => {
  return HYPNOSIS_PROTOCOLS.filter(p => p.isRecommended);
};

export const getPopularProtocols = () => {
  return HYPNOSIS_PROTOCOLS.filter(p => p.isPopular);
};

export const searchProtocols = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return HYPNOSIS_PROTOCOLS.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    p.benefits.some(benefit => benefit.toLowerCase().includes(lowerQuery))
  );
};