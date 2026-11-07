import { LogoMark } from '@/components/brand/LogoMark';

/**
 * Logo and product name, rendered inside the top bar's <header> so it belongs to
 * the banner landmark. Its width matches the rail (+ sidebar) columns below it.
 */
export function BrandHeader() {
  return (
    <div className="flex w-14 shrink-0 items-center gap-3 self-stretch px-3 lg:w-[292px]">
      <LogoMark
        className="size-9 shrink-0 drop-shadow-[0_0_10px_rgb(56_214_240/0.45)]"
        title="PiCode"
      />
      <div className="hidden min-w-0 lg:block">
        <p className="text-2xl leading-6 font-bold tracking-tight text-brand">PiCode</p>
        <p className="truncate text-sm text-brand">Agentic Coding Assistant</p>
      </div>
    </div>
  );
}
