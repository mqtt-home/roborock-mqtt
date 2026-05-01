import type { DeviceSummary } from '@/types/status';

interface DeviceSwitcherProps {
  devices: DeviceSummary[];
  selected: string;
  onSelect: (slug: string) => void;
}

export function DeviceSwitcher({ devices, selected, onSelect }: DeviceSwitcherProps) {
  if (devices.length <= 1) return null;

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto">
      {devices.map((device) => (
        <button
          key={device.slug}
          onClick={() => onSelect(device.slug)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            selected === device.slug
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
          }`}
        >
          <span>{device.name}</span>
          <span className={`ml-2 inline-block w-2 h-2 rounded-full ${device.online ? 'bg-green-500' : 'bg-red-500'}`} />
        </button>
      ))}
    </div>
  );
}
