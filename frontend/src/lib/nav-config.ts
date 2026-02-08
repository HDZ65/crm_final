import {
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  FileText,
  Package,
  FlaskConical,
  Truck,
  DollarSign,
  ShieldCheck,
  BarChart3,
  Receipt,
  ListTodo,
  Calendar,
  Mail,
  GitBranch,
  Archive,
  Bell,
  FileDown,
  Settings,
  Shield,
  Palette,
  Rocket,
  Zap,
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
      children: [
        {
          title: "Configuration",
          url: "/taches/configuration",
          icon: Settings,
          parentUrl: "/taches",
        },
      ],
    },
    {
      title: "Messagerie",
      url: "/messagerie",
      icon: Mail,
    },
    {
      title: "Calendrier",
      url: "/calendrier",
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
      children: [
        {
          title: "Validation ADV",
          url: "/commissions/validation",
          icon: ShieldCheck,
          parentUrl: "/commissions",
        },
        {
          title: "Reporting",
          url: "/commissions/reporting",
          icon: BarChart3,
          parentUrl: "/commissions",
        },
      ],
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
      children: [
        {
          title: "Plans",
          url: "/abonnements/plans",
          icon: FileText,
          parentUrl: "/abonnements",
        },
      ],
    },
    {
      title: "Statistiques",
      url: "/statistiques",
      icon: BarChart3,
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
      children: [
        {
          title: "Formules",
          url: "/catalogue/formules",
          icon: FlaskConical,
          parentUrl: "/catalogue",
        },
      ],
    },
    {
      title: "Expéditions",
      url: "/expeditions",
      icon: Truck,
      children: [
        {
          title: "Lots",
          url: "/expeditions/lots",
          icon: Package,
          parentUrl: "/expeditions",
        },
      ],
    },
    {
      title: "DepanSur",
      url: "/depanssur",
      icon: Zap,
      children: [
        {
          title: "Dossiers",
          url: "/depanssur/dossiers",
          icon: FileText,
          parentUrl: "/depanssur",
        },
        {
          title: "Reporting",
          url: "/depanssur/reporting",
          icon: BarChart3,
          parentUrl: "/depanssur",
        },
      ],
    },
  ],
}

/**
 * Paiements Group - Payment management
 */
export const NAV_PAIEMENTS_GROUP: NavGroup = {
  id: "paiements",
  label: "Paiements",
  defaultOpen: false,
  items: [
    {
      title: "Routage",
      url: "/paiements/routing",
      icon: GitBranch,
    },
    {
      title: "Archives",
      url: "/paiements/archives",
      icon: Archive,
    },
    {
      title: "Alertes",
      url: "/paiements/alertes",
      icon: Bell,
    },
    {
      title: "Exports",
      url: "/paiements/exports",
      icon: FileDown,
    },
  ],
}

/**
 * Administration Group - System administration and settings
 */
export const NAV_ADMINISTRATION_GROUP: NavGroup = {
  id: "administration",
  label: "Administration",
  defaultOpen: false,
  items: [
    {
      title: "Paramètres",
      url: "/parametres/types-activites",
      icon: Settings,
    },
    {
      title: "Permissions",
      url: "/parametres/permissions",
      icon: Shield,
    },
    {
      title: "Rôles & Permissions",
      url: "/parametres/roles-permissions",
      icon: ShieldCheck,
    },
    {
      title: "Marque Blanche",
      url: "/parametres/marque-blanche",
      icon: Palette,
    },
    {
      title: "Intégrations",
      url: "/integrations",
      icon: Zap,
      children: [
        {
          title: "WooCommerce",
          url: "/integrations/woocommerce",
          icon: Package,
          parentUrl: "/integrations",
        },
      ],
    },
    {
      title: "Onboarding",
      url: "/onboarding",
      icon: Rocket,
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
  NAV_PAIEMENTS_GROUP,
  NAV_ADMINISTRATION_GROUP,
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
  "messagerie": "Messagerie",
  "calendrier": "Calendrier",
  "agenda": "Agenda",

  // Finance & Ventes routes
  "commissions": "Commissions",
  "commissions/validation": "Validation ADV",
  "commissions/reporting": "Reporting Commissions",
  "facturation": "Facturation",
  "abonnements": "Abonnements",
  "abonnements/plans": "Plans d'abonnement",
  "statistiques": "Statistiques",

  // Catalogue & Opérations routes
  "catalogue": "Catalogue",
  "catalogue/formules": "Formules",
  "expeditions": "Expéditions",
  "expeditions/lots": "Lots d'expédition",
  "depanssur": "DepanSur",
  "depanssur/dossiers": "Dossiers DepanSur",
  "depanssur/reporting": "Reporting DepanSur",

  // Paiements routes
  "paiements": "Paiements",
  "paiements/routing": "Routage des paiements",
  "paiements/archives": "Archives des paiements",
  "paiements/alertes": "Alertes de paiement",
  "paiements/exports": "Exports de paiement",

  // Administration routes
  "parametres": "Paramètres",
  "parametres/types-activites": "Types d'activités",
  "parametres/permissions": "Permissions",
  "parametres/roles-permissions": "Rôles & Permissions",
  "parametres/marque-blanche": "Marque Blanche",
  "integrations": "Intégrations",
  "integrations/woocommerce": "WooCommerce",
  "onboarding": "Onboarding",
}
