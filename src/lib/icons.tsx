import {
  Archive,
  ArrowUpDown,
  Boxes,
  Briefcase,
  Calendar,
  ClipboardList,
  Coffee,
  Cpu,
  DoorOpen,
  Factory,
  FireExtinguisher,
  FlaskConical,
  HardHat,
  HeartPulse,
  MapPin,
  Package,
  Printer,
  Recycle,
  ShieldCheck,
  TriangleAlert,
  Truck,
  Users,
  Warehouse,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/** Icon names available in zone data and the admin icon picker. */
export const ZONE_ICONS: Record<string, LucideIcon> = {
  package: Package,
  calendar: Calendar,
  cpu: Cpu,
  'shield-check': ShieldCheck,
  truck: Truck,
  coffee: Coffee,
  'heart-pulse': HeartPulse,
  'door-open': DoorOpen,
  briefcase: Briefcase,
  users: Users,
  'flask-conical': FlaskConical,
  boxes: Boxes,
  archive: Archive,
  wrench: Wrench,
  'triangle-alert': TriangleAlert,
  factory: Factory,
  warehouse: Warehouse,
  'clipboard-list': ClipboardList,
  'map-pin': MapPin,
  'hard-hat': HardHat,
  'fire-extinguisher': FireExtinguisher,
  zap: Zap,
  printer: Printer,
  recycle: Recycle,
  'arrow-up-down': ArrowUpDown,
};

export const ZONE_ICON_NAMES = Object.keys(ZONE_ICONS);

export function ZoneIcon({
  name,
  className,
  strokeWidth,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ZONE_ICONS[name] ?? MapPin;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
