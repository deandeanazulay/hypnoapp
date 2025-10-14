import { spawnSync } from 'node:child_process';

export type GuardrailReportStatus = 'passed' | 'failed' | 'blocked';

export interface GuardrailReport {
  name: string;
  status: GuardrailReportStatus;
  details?: string;
  remediation?: string;
}

export interface GuardrailOutcome {
  ready: boolean;
  reports: GuardrailReport[];
}

export interface CommandRunnerOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface CommandResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export type CommandRunner = (
  command: string,
  args: string[],
  options?: CommandRunnerOptions,
) => Promise<CommandResult>;

export interface GuardrailPolicyResult {
  allowed: boolean;
  reason?: string;
  remediation?: string;
}

export interface GuardrailPolicy {
  name: string;
  evaluate: () => GuardrailPolicyResult;
}

export interface AuditLogEvent {
  policy: string;
  outcome: 'allowed' | 'denied';
  reason?: string;
  remediation?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type AuditLogger = (event: AuditLogEvent) => void;

export interface GuardrailCommand {
  name: string;
  command: string;
  args: string[];
  remediation: string;
}

export interface AutonomyGuardrailsAgentOptions {
  auditLogger?: AuditLogger;
  commandRunner?: CommandRunner;
  commands?: GuardrailCommand[];
  policies?: GuardrailPolicy[];
  repositoryName?: string;
  allowlistedRepositories?: string[];
  environmentApprovalFlag?: string;
  commandOptions?: CommandRunnerOptions;
}

const defaultCommandRunner: CommandRunner = async (command, args, options) => {
  const result = spawnSync(command, args, {
    encoding: 'utf-8',
    stdio: 'pipe',
    ...options,
  });

  const exitCode = typeof result.status === 'number' ? result.status : result.error ? 1 : null;

  return {
    exitCode,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? (result.error ? String(result.error) : ''),
  };
};

const defaultAuditLogger: AuditLogger = event => {
  if (event.outcome === 'denied') {
    const messageParts = [
      `[AUTONOMY-GUARDRAILS] Policy ${event.policy} denied automation`,
      event.reason ? `reason: ${event.reason}` : undefined,
      event.remediation ? `remediation: ${event.remediation}` : undefined,
    ].filter(Boolean);

    console.warn(messageParts.join(' | '));
  }
};

const DEFAULT_COMMANDS: GuardrailCommand[] = [
  {
    name: 'Lint',
    command: 'npm',
    args: ['run', 'lint'],
    remediation: 'Run "npm run lint" locally and resolve lint issues before retrying.',
  },
  {
    name: 'Unit tests',
    command: 'npm',
    args: ['run', 'test'],
    remediation: 'Fix failing tests locally with "npm run test".',
  },
  {
    name: 'Prettier check',
    command: 'npx',
    args: ['prettier', '--check', '.'],
    remediation: 'Apply formatting with "npx prettier --write ." to address style violations.',
  },
];

function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);
}

function toLower(value: string | undefined): string | undefined {
  return value ? value.toLowerCase() : undefined;
}

export class AutonomyGuardrailsAgent {
  private readonly auditLogger: AuditLogger;
  private readonly commandRunner: CommandRunner;
  private readonly policies: GuardrailPolicy[];
  private readonly commands: GuardrailCommand[];
  private readonly commandOptions?: CommandRunnerOptions;

  constructor(private readonly options: AutonomyGuardrailsAgentOptions = {}) {
    this.auditLogger = options.auditLogger ?? defaultAuditLogger;
    this.commandRunner = options.commandRunner ?? defaultCommandRunner;
    this.commands = options.commands ?? DEFAULT_COMMANDS;
    this.commandOptions = options.commandOptions;
    this.policies = options.policies ?? this.buildDefaultPolicies(options);
  }

  async verifyReadiness(): Promise<GuardrailOutcome> {
    const reports: GuardrailReport[] = [];

    for (const policy of this.policies) {
      const result = policy.evaluate();

      if (!result.allowed) {
        const report: GuardrailReport = {
          name: policy.name,
          status: 'blocked',
          details: result.reason,
          remediation: result.remediation,
        };
        reports.push(report);

        this.auditLogger({
          policy: policy.name,
          outcome: 'denied',
          reason: result.reason,
          remediation: result.remediation,
          timestamp: new Date().toISOString(),
        });

        return {
          ready: false,
          reports,
        };
      }

      reports.push({
        name: policy.name,
        status: 'passed',
        details: 'Policy prerequisites satisfied.',
      });
    }

    for (const command of this.commands) {
      const result = await this.commandRunner(command.command, command.args, this.commandOptions);

      if (result.exitCode === 0) {
        reports.push({
          name: command.name,
          status: 'passed',
          details: result.stdout?.trim() || 'Command succeeded.',
        });
        continue;
      }

      const details = [
        `Command \"${[command.command, ...command.args].join(' ')}\" exited with code ${result.exitCode ?? 'unknown'}.`,
        result.stderr?.trim() || result.stdout?.trim() || 'No additional output was captured.',
      ]
        .filter(Boolean)
        .join(' ');

      reports.push({
        name: command.name,
        status: 'failed',
        details,
        remediation: command.remediation,
      });

      return {
        ready: false,
        reports,
      };
    }

    return {
      ready: true,
      reports,
    };
  }

  private buildDefaultPolicies(options: AutonomyGuardrailsAgentOptions): GuardrailPolicy[] {
    const environmentFlag = options.environmentApprovalFlag ?? 'AUTONOMY_APPROVED';
    const repositoryName =
      options.repositoryName ??
      process.env.CURRENT_REPOSITORY ??
      process.env.REPOSITORY_NAME ??
      process.env.GITHUB_REPOSITORY ??
      null;

    const allowlistedRepositories =
      options.allowlistedRepositories ?? parseAllowlist(process.env.REPOSITORY_ALLOWLIST);

    const environmentPolicy: GuardrailPolicy = {
      name: 'EnvironmentApprovalPolicy',
      evaluate: () => {
        const flagValue = toLower(process.env[environmentFlag]);

        if (flagValue !== 'true') {
          return {
            allowed: false,
            reason: `Environment flag \"${environmentFlag}\" must be set to \"true\" to permit automation.`,
            remediation: `Set ${environmentFlag}=true in the execution environment once manual review is complete.`,
          };
        }

        return { allowed: true };
      },
    };

    const repositoryPolicy: GuardrailPolicy = {
      name: 'RepositoryAllowlistPolicy',
      evaluate: () => {
        if (!repositoryName) {
          return {
            allowed: false,
            reason: 'Current repository identifier is unavailable; cannot verify allowlist membership.',
            remediation:
              'Provide the repository name via repositoryName option or the CURRENT_REPOSITORY/REPOSITORY_NAME environment variable.',
          };
        }

        if (!allowlistedRepositories.length) {
          return {
            allowed: false,
            reason: 'No repositories are allowlisted for guarded automation.',
            remediation:
              'Populate REPOSITORY_ALLOWLIST with a comma-separated list of approved repositories or configure allowlistedRepositories.',
          };
        }

        if (allowlistedRepositories.includes(repositoryName)) {
          return { allowed: true };
        }

        return {
          allowed: false,
          reason: `Repository \"${repositoryName}\" is not approved for guarded automation.`,
          remediation: `Add ${repositoryName} to the REPOSITORY_ALLOWLIST or adjust allowlistedRepositories before continuing.`,
        };
      },
    };

    return [environmentPolicy, repositoryPolicy];
  }
}
