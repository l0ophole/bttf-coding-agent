import { Minus, Square, X } from 'lucide-react';

import { IconButton } from '@/components/ui/IconButton';
import { windowControls } from '@/lib/platform';

/** Title-bar buttons for the desktop app (custom, frameless window). */
export function WindowControls() {
  return (
    <div role="group" aria-label="Window" className="flex items-center gap-1 pl-2">
      <IconButton
        label="Minimize window"
        icon={<Minus />}
        tooltip="bottom"
        onClick={() => windowControls.minimize()}
      />
      <IconButton
        label="Maximize window"
        icon={<Square className="!size-3.5" />}
        tooltip="bottom"
        onClick={() => void windowControls.toggleMaximize()}
      />
      <IconButton
        label="Close window"
        icon={<X />}
        tooltip="bottom"
        className="hover:bg-danger-fill hover:text-white"
        onClick={() => windowControls.close()}
      />
    </div>
  );
}
