import { Check, Cloud, Cpu, Laptop, Server, ShieldCheck } from 'lucide-react';

import { useUpdateSessionSettings } from '@/api/hooks/mutations';
import { useEnvironments, useModels } from '@/api/hooks/queries';
import type { EnvironmentKind, Session } from '@/api/types';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toastStore';

import { APPROVAL_OPTIONS, TOOL_ACCESS_OPTIONS } from './settingsOptions';

const ENV_ICONS: Record<EnvironmentKind, typeof Laptop> = {
  local: Laptop,
  cloud: Cloud,
  ssh: Server,
};

type Variant = 'pill' | 'toolbar' | 'field';

interface SessionSelectProps {
  session: Session;
  variant?: Variant;
  className?: string;
  visibleLabel?: boolean;
}

function useSettingsMutation(session: Session) {
  const mutation = useUpdateSessionSettings(session.id);
  return (patch: Parameters<typeof mutation.mutate>[0], message: string) =>
    mutation.mutate(patch, { onSuccess: () => toast.success(message) });
}

export function ModelSelect({
  session,
  variant = 'pill',
  className,
  visibleLabel,
}: SessionSelectProps) {
  const { data: models = [] } = useModels();
  const update = useSettingsMutation(session);
  const options = models.map((model) => ({
    value: model.id,
    label: model.name,
    description: `${model.provider} · ${model.description}`,
  }));
  return (
    <Select
      label="Model"
      value={session.settings.modelId}
      options={options}
      variant={variant}
      className={className}
      visibleLabel={visibleLabel}
      align="end"
      leadingIcon={variant === 'toolbar' ? <Cpu className="text-fg-muted" /> : undefined}
      showChevron={variant !== 'pill'}
      renderValue={(option) =>
        variant === 'pill' ? `Model: ${option?.label ?? '—'}` : (option?.label ?? 'Choose model')
      }
      onChange={(modelId) =>
        update({ modelId }, `Model set to ${models.find((m) => m.id === modelId)?.name ?? modelId}`)
      }
    />
  );
}

export function EnvironmentSelect({
  session,
  variant = 'toolbar',
  className,
  visibleLabel,
}: SessionSelectProps) {
  const { data: environments = [] } = useEnvironments();
  const update = useSettingsMutation(session);
  const current = environments.find((env) => env.id === session.settings.environmentId);
  const Icon = current ? ENV_ICONS[current.kind] : Laptop;
  return (
    <Select
      label="Environment"
      value={session.settings.environmentId}
      options={environments.map((env) => {
        const EnvIcon = ENV_ICONS[env.kind];
        return { value: env.id, label: env.name, description: env.description, icon: <EnvIcon /> };
      })}
      variant={variant}
      className={className}
      visibleLabel={visibleLabel}
      leadingIcon={<Icon className="text-success" />}
      renderValue={(option) => (
        <span className="inline-block min-w-12 text-left">{option?.label}</span>
      )}
      onChange={(environmentId) =>
        update(
          { environmentId },
          `Environment set to ${environments.find((e) => e.id === environmentId)?.name ?? environmentId}`,
        )
      }
    />
  );
}

export function ApprovalSelect({
  session,
  variant = 'pill',
  className,
  visibleLabel,
}: SessionSelectProps) {
  const update = useSettingsMutation(session);
  const auto = session.settings.approvalMode === 'auto';
  return (
    <Select
      label="Tool approval"
      value={session.settings.approvalMode}
      options={APPROVAL_OPTIONS}
      variant={variant}
      visibleLabel={visibleLabel}
      className={className}
      leadingIcon={
        variant === 'pill' ? (
          auto ? (
            <Check className="text-success" strokeWidth={3} />
          ) : (
            <ShieldCheck className="text-warning" />
          )
        ) : undefined
      }
      renderValue={(option) => option?.label}
      onChange={(approvalMode) =>
        update(
          { approvalMode },
          `Approval: ${APPROVAL_OPTIONS.find((o) => o.value === approvalMode)?.label}`,
        )
      }
    />
  );
}

export function ToolAccessSelect({
  session,
  variant = 'pill',
  className,
  visibleLabel,
}: SessionSelectProps) {
  const update = useSettingsMutation(session);
  return (
    <Select
      label="Tool access"
      value={session.settings.toolAccess}
      options={TOOL_ACCESS_OPTIONS}
      variant={variant}
      visibleLabel={visibleLabel}
      showChevron={variant !== 'pill'}
      className={cn(className)}
      renderValue={(option) =>
        variant === 'pill' ? `Tool access: ${option?.label ?? '—'}` : (option?.label ?? '')
      }
      onChange={(toolAccess) =>
        update(
          { toolAccess },
          `Tool access: ${TOOL_ACCESS_OPTIONS.find((o) => o.value === toolAccess)?.label}`,
        )
      }
    />
  );
}
