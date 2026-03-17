import {
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  FileText,
  Package,
  Truck,
  DollarSign,
  ShieldCheck,
  BarChart3,
  Receipt,
  ListTodo,
  Calendar,
  CalendarDays,
  GitBranch,
  Archive,
  Bell,
  FileDown,
  Settings,
  Shield,
  Palette,
  Zap,
  Smartphone,
  BookOpen,
  BoxIcon,
  Flame,
  FileStack,
} from "lucide-react"
import { type LucideIcon } from "lucide-react"

/**
 * Navigation item interface
 */
export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  parentUrl?: string
  requiredRole?: string
  description?: string
  external?: boolean
  children?: NavItem[]
}

/**
 * Navigation group interface
 */
export interface NavGroup {
  id: string
  label: string
  icon?: LucideIcon
  defaultOpen: boolean
  items: NavItem[]
}

/**
 * Dashboard - top-level item (not in a group)
 */
export const DASHBOARD_ITEM: NavItem = {
  title: "Dashboard",
  url: "/",
  icon: LayoutDashboard,
}

/**
 * CRM Group - Core customer relationship management
 */
export const NAV_CRM_GROUP: NavGroup = {
  id: "crm",
  label: "CRM",
  defaultOpen: true,
  items: [
    {
      title: "Clients",
      url: "/clients",
      icon: Users,
    },
    {
      title: "Commerciaux",
      url: "/commerciaux",
      icon: Briefcase,
    },
    {
      title: "Tâches",
      url: "/taches",
      icon: ListTodo,
    },
    {
      title: "Réunions",
      url: "/reunions",
      icon: Calendar,
    },
  ],
}

/**
 * Finance & Ventes Group - Financial and sales management
 */
export const NAV_FINANCE_VENTES_GROUP: NavGroup = {
  id: "finance-ventes",
  label: "Finance & Ventes",
  defaultOpen: false,
  items: [
    {
      title: "Commissions",
      url: "/commissions",
      icon: DollarSign,
    },
    {
      title: "Facturation",
      url: "/facturation",
      icon: Receipt,
    },
    {
      title: "Abonnements",
      url: "/abonnements",
      icon: CreditCard,
    },
    {
      title: "Paiements",
      url: "/paiements",
      icon: CreditCard,
    },
    {
      title: "Statistiques",
      url: "/statistiques",
      icon: BarChart3,
    },
    {
      title: "Documents",
      url: "/documents",
      icon: FileStack,
    },
  ],
}

/**
 * Catalogue & Opérations Group - Product catalog and operations
 */
export const NAV_CATALOGUE_OPERATIONS_GROUP: NavGroup = {
  id: "catalogue-operations",
  label: "Catalogue & Opérations",
  defaultOpen: false,
  items: [
    {
      title: "Catalogue",
      url: "/catalogue",
      icon: Package,
    },
    {
      title: "Expéditions",
      url: "/expeditions",
      icon: Truck,
    },
    {
      title: "Dossiers SAV",
      url: "/depanssur/dossiers",
      icon: Zap,
      children: [
        {
          title: "Dossiers",
          url: "/depanssur/dossiers",
          icon: FileText,
          parentUrl: "/depanssur/dossiers",
        },
        {
          title: "Reporting",
          url: "/depanssur/reporting",
          icon: BarChart3,
          parentUrl: "/depanssur/dossiers",
        },
      ],
    },

    {
      title: "Télécom",
      url: "/telecom",
      icon: Smartphone,
    },
    {
      title: "ReducBox",
      url: "/reducbox",
      icon: BoxIcon,
    },
    {
      title: "Énergie",
      url: "/energie",
      icon: Flame,
    },
  ],
}

/**
 * Administration Group - Settings and integrations
 */
export const NAV_ADMIN_GROUP: NavGroup = {
  id: "administration",
  label: "Administration",
  icon: Settings,
  defaultOpen: false,
  items: [
    {
      title: "Intégrations",
      url: "/parametres/integrations",
      icon: Zap,
    },
    {
      title: "Documentation",
      url: `${process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3405'}/api/docs`,
      icon: BookOpen,
      external: true,
    },
  ],
}

/**
 * All navigation groups in order
 */
export const NAV_GROUPS: NavGroup[] = [
  NAV_CRM_GROUP,
  NAV_FINANCE_VENTES_GROUP,
  NAV_CATALOGUE_OPERATIONS_GROUP,
  NAV_ADMIN_GROUP,
]

/**
 * Route labels mapping for breadcrumbs and UI labels
 * Maps URL segments to French labels
 */
export const NAV_ROUTE_LABELS: Record<string, string> = {
  // Top-level routes
  "": "Accueil",
  "dashboard": "Tableau de bord",

  // CRM routes
  "clients": "Clients",
  "commerciaux": "Commerciaux",
  "taches": "Tâches",
  "taches/configuration": "Configuration des tâches",
  "reunions": "Réunions",

  // Finance & Ventes routes
  "commissions": "Commissions",
  "commissions/validation": "Validation ADV",
  "commissions/reporting": "Reporting Commissions",
  "facturation": "Facturation",
  "abonnements": "Abonnements",
  "abonnements/plans": "Plans d'abonnement",
  "paiements": "Paiements",
  "statistiques": "Statistiques",
  "documents": "Documents",

  // Catalogue & Opérations routes
  "catalogue": "Catalogue",
  "expeditions": "Expéditions",
  "expeditions/lots": "Lots d'expédition",
  "depanssur": "Dossiers SAV",
  "depanssur/dossiers": "Dossiers",
  "depanssur/reporting": "Reporting",
  "telecom": "Télécom",
  "reducbox": "ReducBox",
  "energie": "Énergie",

  // Administration routes
  "parametres": "Paramètres",
  "parametres/integrations": "Intégrations",
  "docs": "Documentation",
}
