// Personalized Hypnotherapy Script Generator
import { HypnosisProtocol } from '../data/protocols';

interface UserProfile {
  experience_level?: 'new' | 'some' | 'experienced';
  preferred_imagery?: 'nature' | 'abstract' | 'body' | 'mind';
  voice_tone?: 'gentle' | 'authoritative' | 'friend';
  specific_goals?: string[];
  challenges?: string[];
  personality_type?: 'analytical' | 'emotional' | 'practical' | 'creative';
}

interface SessionContext {
  egoState: string;
  userProfile?: UserProfile;
  customGoals?: string[];
  sessionHistory?: any[];
}

export class ScriptGenerator {
  private getPersonalizedInduction(protocol: HypnosisProtocol, context: SessionContext): string {
    const { userProfile, egoState } = context;
    let induction = protocol.script.induction;

    // Adapt based on experience level
    if (userProfile?.experience_level === 'new') {
      induction = `This is a safe and gentle process... You remain in complete control at all times... ${induction}`;
    } else if (userProfile?.experience_level === 'experienced') {
      induction = `You know this process well... Allow yourself to go deeper more quickly... ${induction}`;
    }

    // Adapt based on ego state
    const egoAdaptations: { [key: string]: string } = {
      guardian: 'Feel completely safe and protected as you begin this journey...',
      rebel: 'You\'re breaking free from old limitations as you start this session...',
      healer: 'Feel healing energy beginning to flow through you...',
      explorer: 'You\'re embarking on an exciting journey of discovery...',
      mystic: 'Connect with the deeper wisdom within you...',
      sage: 'Access the ancient wisdom that lies within...',
      child: 'Approach this with wonder and curiosity...',
      performer: 'Step into your most authentic, expressive self...',
      shadow: 'Embrace all aspects of yourself with compassion...'
    };

    const egoPrefix = egoAdaptations[egoState] || '';
    return `${egoPrefix} ${induction}`;
  }

  private getPersonalizedDeepening(protocol: HypnosisProtocol, context: SessionContext): string {
    const { userProfile } = context;
    let deepening = protocol.script.deepening;

    // Adapt imagery based on preferences
    if (userProfile?.preferred_imagery === 'nature') {
      deepening = deepening.replace(/going deeper/gi, 'sinking into the earth like roots of a tree');
      deepening = deepening.replace(/relaxation/gi, 'the peace of a quiet forest');
    } else if (userProfile?.preferred_imagery === 'abstract') {
      deepening = deepening.replace(/going deeper/gi, 'flowing into infinite space');
      deepening = deepening.replace(/relaxation/gi, 'pure, weightless calm');
    }

    return deepening;
  }

  private getPersonalizedSuggestions(protocol: HypnosisProtocol, context: SessionContext): string {
    const { userProfile, customGoals } = context;
    let suggestions = protocol.script.suggestions;

    // Add custom goals if provided
    if (customGoals && customGoals.length > 0) {
      const goalSuggestions = customGoals.map(goal => 
        `You easily achieve your goal of ${goal.toLowerCase()}...`
      ).join(' ');
      suggestions = `${goalSuggestions} ${suggestions}`;
    }

    // Adapt based on personality type
    if (userProfile?.personality_type === 'analytical') {
      suggestions = suggestions.replace(/you feel/gi, 'you understand logically that you');
      suggestions = suggestions.replace(/naturally/gi, 'through clear reasoning');
    } else if (userProfile?.personality_type === 'emotional') {
      suggestions = suggestions.replace(/you understand/gi, 'you feel deeply that');
      suggestions = suggestions.replace(/logically/gi, 'emotionally');
    }

    return suggestions;
  }

  generatePersonalizedScript(protocol: HypnosisProtocol, context: SessionContext): HypnosisProtocol {
    return {
      ...protocol,
      script: {
        induction: this.getPersonalizedInduction(protocol, context),
        deepening: this.getPersonalizedDeepening(protocol, context),
        suggestions: this.getPersonalizedSuggestions(protocol, context),
        emergence: protocol.script.emergence // Keep emergence standard for safety
      }
    };
  }

  generateCustomProtocol(
    name: string,
    goals: string[],
    duration: number,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    context: SessionContext
  ): HypnosisProtocol {
    const customProtocol: HypnosisProtocol = {
      id: `custom-${Date.now()}`,
      name,
      description: `Custom protocol for ${goals.join(', ')}`,
      category: 'emotional-healing', // Default category for custom
      difficulty,
      duration: duration as any,
      benefits: goals.map(goal => `Supports ${goal.toLowerCase()}`),
      tags: ['custom', 'personalized', ...goals.map(g => g.toLowerCase())],
      preparationSteps: [
        'Set clear intention for your custom goals',
        'Find a comfortable, private space',
        'Review your specific objectives',
        'Commit to the transformation process'
      ],
      postSessionTips: [
        'Practice the techniques learned in daily life',
        'Monitor progress toward your custom goals',
        'Adjust the protocol based on your experience',
        'Celebrate small improvements'
      ],
      script: {
        induction: this.generateCustomInduction(goals, context),
        deepening: this.generateCustomDeepening(goals, context),
        suggestions: this.generateCustomSuggestions(goals, context),
        emergence: 'Return with confidence in your ability to achieve your goals... 1, 2, 3, 4, 5, empowered and ready.'
      }
    };

    return this.generatePersonalizedScript(customProtocol, context);
  }

  private generateCustomInduction(goals: string[], context: SessionContext): string {
    const goalFocus = goals.length > 0 ? goals[0] : 'personal growth';
    return `Close your eyes and focus on your intention to ${goalFocus.toLowerCase()}... Feel your commitment to positive change... Your subconscious mind is ready to help you achieve ${goalFocus.toLowerCase()}...`;
  }

  private generateCustomDeepening(goals: string[], context: SessionContext): string {
    return `Going deeper into this state of transformation... Your mind is open to new possibilities for ${goals.join(' and ').toLowerCase()}... Each breath takes you closer to your goals...`;
  }

  private generateCustomSuggestions(goals: string[], context: SessionContext): string {
    const suggestions = goals.map(goal => 
      `You are naturally capable of ${goal.toLowerCase()}... ${goal} comes easily to you... You embody ${goal.toLowerCase()} in all that you do...`
    ).join(' ');
    
    return `${suggestions} These changes integrate naturally into your daily life... You maintain these positive changes effortlessly...`;
  }
}

export const scriptGenerator = new ScriptGenerator();

// Pre-built script variations to prevent habituation
export const generateScriptVariation = (protocol: HypnosisProtocol, variationNumber: number = 1): HypnosisProtocol => {
  const variations = {
    1: { // Original
      inductionPrefix: '',
      deepeningModifier: '',
      suggestionSuffix: ''
    },
    2: { // Variation A
      inductionPrefix: 'Take your time to settle in... ',
      deepeningModifier: 'even more deeply... ',
      suggestionSuffix: '... and these changes happen naturally and easily'
    },
    3: { // Variation B
      inductionPrefix: 'Allow yourself to begin this journey... ',
      deepeningModifier: 'further and further... ',
      suggestionSuffix: '... becoming more true for you each day'
    }
  };

  const variation = variations[variationNumber as keyof typeof variations] || variations[1];

  return {
    ...protocol,
    script: {
      induction: `${variation.inductionPrefix}${protocol.script.induction}`,
      deepening: protocol.script.deepening.replace(/deeper/gi, `${variation.deepeningModifier}deeper`),
      suggestions: `${protocol.script.suggestions}${variation.suggestionSuffix}`,
      emergence: protocol.script.emergence
    }
  };
};