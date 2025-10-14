import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AutonomyGuardrailsAgent, type GuardrailOutcome } from '../AutonomyGuardrailsAgent';

type MutableEnv = NodeJS.ProcessEnv & { [key: string]: string | undefined };

const ORIGINAL_ENV = { ...process.env } as MutableEnv;

function resetEnvironment() {
  const currentKeys = Object.keys(process.env);
  for (const key of currentKeys) {
    if (!(key in ORIGINAL_ENV)) {
      delete (process.env as MutableEnv)[key];
    }
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

function setApprovedEnvironment() {
  process.env.AUTONOMY_APPROVED = 'true';
  process.env.CURRENT_REPOSITORY = 'libero-hypnosis-app';
  process.env.REPOSITORY_ALLOWLIST = 'libero-hypnosis-app,another-repo';
}

describe('AutonomyGuardrailsAgent', () => {
  beforeEach(() => {
    resetEnvironment();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetEnvironment();
  });

  it('blocks when the environment approval flag is missing', async () => {
    delete (process.env as MutableEnv).AUTONOMY_APPROVED;
    process.env.CURRENT_REPOSITORY = 'libero-hypnosis-app';
    process.env.REPOSITORY_ALLOWLIST = 'libero-hypnosis-app';

    const auditLogger = vi.fn();
    const agent = new AutonomyGuardrailsAgent({ auditLogger });

    const outcome = await agent.verifyReadiness();

    expect(outcome.ready).toBe(false);
    const report = outcome.reports.find(entry => entry.name === 'EnvironmentApprovalPolicy');
    expect(report?.status).toBe('blocked');
    expect(report?.details).toContain('Environment flag');
    expect(auditLogger).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'denied', policy: 'EnvironmentApprovalPolicy' }),
    );
  });

  it('blocks when the repository is not allowlisted', async () => {
    process.env.AUTONOMY_APPROVED = 'true';
    process.env.CURRENT_REPOSITORY = 'unapproved-repo';
    process.env.REPOSITORY_ALLOWLIST = 'libero-hypnosis-app';

    const outcome = await new AutonomyGuardrailsAgent().verifyReadiness();

    expect(outcome.ready).toBe(false);
    const report = outcome.reports.find(entry => entry.name === 'RepositoryAllowlistPolicy');
    expect(report?.status).toBe('blocked');
    expect(report?.details).toContain('not approved');
  });

  it('halts execution and reports when a command fails', async () => {
    setApprovedEnvironment();

    const commandRunner = vi
      .fn()
      .mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: 'Lint error at src/file.ts' });

    const agent = new AutonomyGuardrailsAgent({ commandRunner });
    const outcome: GuardrailOutcome = await agent.verifyReadiness();

    expect(commandRunner).toHaveBeenCalledTimes(1);
    expect(outcome.ready).toBe(false);
    const lintReport = outcome.reports.find(entry => entry.name === 'Lint');
    expect(lintReport?.status).toBe('failed');
    expect(lintReport?.details).toContain('Lint error at src/file.ts');
    expect(lintReport?.remediation).toContain('npm run lint');
  });

  it('passes when policies and commands succeed', async () => {
    setApprovedEnvironment();

    const commandRunner = vi
      .fn()
      .mockResolvedValueOnce({ exitCode: 0, stdout: 'Lint passed', stderr: '' })
      .mockResolvedValueOnce({ exitCode: 0, stdout: 'Tests passed', stderr: '' })
      .mockResolvedValueOnce({ exitCode: 0, stdout: 'Checked formatting', stderr: '' });

    const outcome = await new AutonomyGuardrailsAgent({ commandRunner }).verifyReadiness();

    expect(commandRunner).toHaveBeenCalledTimes(3);
    expect(outcome.ready).toBe(true);
    const statuses = outcome.reports.map(entry => entry.status);
    expect(statuses.filter(status => status === 'passed').length).toBe(outcome.reports.length);
  });
});
