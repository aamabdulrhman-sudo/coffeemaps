import { Award, Camera, Coffee, Compass, Heart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BadgePillProps {
  name: string;
  icon: string;
  description?: string;
  compact?: boolean;
}

const ICONS = {
  coffee: Coffee,
  star: Star,
  award: Award,
  heart: Heart,
  camera: Camera,
  compass: Compass,
};

export function BadgePill({ name, icon, description, compact = false }: BadgePillProps) {
  const Icon = ICONS[icon as keyof typeof ICONS] ?? Award;

  if (compact) {
    return (
      <Badge variant="accent" className="gap-1 px-2 py-0.5 text-[10px]">
        <Icon className="h-2.5 w-2.5" />
        {name}
      </Badge>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{name}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
