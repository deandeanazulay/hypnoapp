import type { StartSessionOptions } from './session';

export interface SessionContext {
  egoState: string;
  goalId: string;
  goalName: string;
  actionName: string;
  methodName: string;
  protocolName: string;
  lengthSec: number;
  customProtocolGoals: string;
  customProtocolInduction: string;
  customProtocolDuration: number;
  protocolDescription: string;
  protocolDuration: number;
  userLevel: number;
  userExperience: string;
  currentTime: string;
  sessionUniqueId: string;
  promptVariation: number;
  sessionType: string;
  customProtocol: any;
  userPrefs?: any;
  goal?: any;
  action?: any;
  method?: any;
  protocol?: any;
  [key: string]: any;
}

export function mapStartOptionsToContext(options: StartSessionOptions): SessionContext {
  const now = new Date();

  return {
    egoState: options.egoState,
    goalId: options.goalId || options.goal?.id || 'transformation',
    goalName: options.goal?.name || options.goalId || 'personal transformation',
    actionName: options.action?.name || options.action?.id || 'transformation',
    methodName: options.method?.name || options.method?.id || 'guided relaxation',
    protocolName: options.protocol?.name || options.customProtocol?.name || 'custom session',
    lengthSec: options.lengthSec || 600,
    customProtocolGoals: options.customProtocol?.goals?.join(', ') || '',
    customProtocolInduction: options.customProtocol?.induction || '',
    customProtocolDuration: options.customProtocol?.duration || options.lengthSec || 600,
    protocolDescription: options.protocol?.description || '',
    protocolDuration: options.protocol?.duration || options.lengthSec || 600,
    userLevel: options.userPrefs?.level || 1,
    userExperience: options.userPrefs?.experience || 'beginner',
    currentTime: now.toISOString(),
    sessionUniqueId: `${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
    promptVariation: Math.floor(Math.random() * 5) + 1,
    sessionType: options.customProtocol
      ? 'custom_protocol'
      : options.protocol
        ? 'predefined_protocol'
        : 'guided_session',
    customProtocol: options.customProtocol,
    userPrefs: options.userPrefs,
    goal: options.goal,
    action: options.action,
    method: options.method,
    protocol: options.protocol
  };
}
