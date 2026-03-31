import {
  LayoutDashboard,
  Plus,
  FileText,
  Presentation,
  Mail,
  Gift,
  Globe,
  Heart,
  Settings,
  BookOpen,
  Video,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Webinars", href: "/dashboard/webinars", icon: Video },
      { title: "New Webinar", href: "/dashboard/webinars/new", icon: Plus },
    ],
  },
  {
    label: "Artifacts",
    items: [
      { title: "Theses", href: "/dashboard/theses", icon: FileText },
      { title: "Presentation", href: "/dashboard/presentation", icon: Presentation },
      { title: "Landing Page", href: "/dashboard/landing", icon: Globe },
      { title: "Thank-You Page", href: "/dashboard/thank-you", icon: Heart },
      { title: "Attendance Chain", href: "/dashboard/attendance", icon: Mail },
      { title: "Gifts", href: "/dashboard/gifts", icon: Gift },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];
