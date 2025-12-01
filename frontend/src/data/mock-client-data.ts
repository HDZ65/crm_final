import {
  Calendar,
  Paperclip,
  CheckCircle2,
  FileText,
} from "lucide-react"
import type { Contract, Payment, Document, Shipment } from "@/types/client"

export const mockDocuments: Document[] = [
  {
    name: "Pièce d'identité - Carte Nationale",
    type: "PDF",
    updated: "15/01/2024",
  },
  {
    name: "Justificatif de domicile",
    type: "PDF",
    updated: "15/01/2024",
  },
  {
    name: "RIB - Compte bancaire principal",
    type: "PDF",
    updated: "15/01/2024",
  },
  {
    name: "Mandat SEPA signé",
    type: "PDF",
    updated: "20/01/2024",
  },
  {
    name: "Conditions Générales signées",
    type: "PDF",
    updated: "20/01/2024",
  },
  {
    name: "Attestation d'assurance",
    type: "PDF",
    updated: "05/02/2024",
  },
  {
    name: "Formulaire KYC complété",
    type: "PDF",
    updated: "10/02/2024",
  },
  {
    name: "Contrat CT-2023-15 signé",
    type: "PDF",
    updated: "01/06/2023",
  },
  {
    name: "Contrat CT-2023-15B signé",
    type: "PDF",
    updated: "05/07/2023",
  },
  {
    name: "Avenant modification tarif",
    type: "PDF",
    updated: "15/03/2024",
  },
]

export const mockUpcomingPayments: Payment[] = [
  {
    label: "Paiement de la facture n°1",
    date: "01/09/2024",
    amount: "100.00 EUR",
    status: "Payé",
  },
  {
    label: "Paiement de la facture n°2",
    date: "01/10/2024",
    amount: "100.00 EUR",
    status: "Payé",
  },
  {
    label: "Paiement de la facture n°3",
    date: "01/11/2024",
    amount: "100.00 EUR",
    status: "Payé",
  },
  {
    label: "Paiement de la facture n°4",
    date: "01/12/2024",
    amount: "100.00 EUR",
    status: "Payé",
  },
  {
    label: "Paiement de la facture n°5",
    date: "01/01/2025",
    amount: "100.00 EUR",
    status: "Payé",
  },
  {
    label: "Paiement de la facture n°6",
    date: "01/02/2025",
    amount: "100.00 EUR",
    status: "Payé",
  },
  {
    label: "Paiement de la facture n°7",
    date: "01/03/2025",
    amount: "100.00 EUR",
    status: "Payé",
  },
  {
    label: "Paiement de la facture n°8",
    date: "01/04/2025",
    amount: "100.00 EUR",
    status: "Payé",
  },
  {
    label: "Paiement de la facture n°9",
    date: "01/05/2025",
    amount: "100.00 EUR",
    status: "Payé",
  },
  {
    label: "Paiement de la facture n°10",
    date: "01/06/2025",
    amount: "100.00 EUR",
    status: "Payé",
  },
]

export const mockContracts: Contract[] = [
  {
    ref: "CT-2023-15",
    product: "France Téléphone",
    status: "Actif",
    start: "01/06/2023",
    pay: "SEPA",
    sales: "Alexandre",
    history: [
      { icon: Calendar, label: "Création du contrat", date: "01/06/2024" },
      { icon: Paperclip, label: "Envoi du mandat SEPA", date: "03/06/2024" },
      { icon: Paperclip, label: "Envoi du mandat SEPA", date: "03/06/2024" },
      { icon: Paperclip, label: "Envoi du mandat SEPA", date: "03/06/2024" },
      { icon: CheckCircle2, label: "Activation de la ligne", date: "11/06/2024" },
      { icon: CheckCircle2, label: "Activation de la ligne", date: "11/06/2024" },
      { icon: CheckCircle2, label: "Activation de la ligne", date: "11/06/2024" },
      { icon: CheckCircle2, label: "Activation de la ligne", date: "11/06/2024" },
      { icon: CheckCircle2, label: "Activation de la ligne", date: "11/06/2024" },
      { icon: FileText, label: "Emission facture n°1", date: "01/09/2024" },
    ],
  },
  {
    ref: "CT-2023-15B",
    product: "Action Prévoyance",
    status: "Actif",
    start: "01/06/2023",
    pay: "SEPA",
    sales: "Alexandre",
    history: [
      { icon: Calendar, label: "Création du contrat", date: "05/07/2024" },
      { icon: FileText, label: "Emission facture n°1", date: "05/08/2024" },
    ],
  },
  {
    ref: "CT-2020-02",
    product: "France Téléphone",
    status: "Actif",
    start: "01/06/2023",
    pay: "SEPA",
    sales: "Alexandre",
    history: [
      { icon: Calendar, label: "Création du contrat", date: "10/02/2020" },
      { icon: FileText, label: "Emission facture n°36", date: "10/10/2025" },
    ],
  },
]

export const mockShipments: Shipment[] = [
  {
    id: "1",
    trackingNumber: "6A12345678901",
    status: "delivered",
    recipientName: "ZVING MONIQUE",
    recipientAddress: "123 Rue de Paris, 75001 Paris, France",
    senderName: "Votre Entreprise",
    senderAddress: "456 Avenue des Champs, 75008 Paris, France",
    product: "Colissimo",
    weight: 1.2,
    createdAt: "15/10/2024",
    estimatedDelivery: "18/10/2024",
    deliveredAt: "17/10/2024",
    contractRef: "CT-2023-15",
    events: [
      {
        date: "17/10/2024 14:32",
        status: "Colis livré",
        location: "Paris 75001",
        description: "Votre colis a été livré et remis au destinataire",
      },
      {
        date: "17/10/2024 09:15",
        status: "En cours de livraison",
        location: "Paris Hub",
        description: "Le colis est en cours de livraison",
      },
      {
        date: "16/10/2024 18:42",
        status: "En transit",
        location: "Plateforme Paris Nord",
        description: "Colis arrivé à la plateforme de distribution",
      },
      {
        date: "15/10/2024 16:20",
        status: "Pris en charge",
        location: "Paris 75008",
        description: "Le colis a été pris en charge par La Poste",
      },
    ],
  },
  {
    id: "2",
    trackingNumber: "8Z98765432109",
    status: "in_transit",
    recipientName: "ZVING MONIQUE",
    recipientAddress: "123 Rue de Paris, 75001 Paris, France",
    senderName: "Votre Entreprise",
    senderAddress: "456 Avenue des Champs, 75008 Paris, France",
    product: "Colissimo Recommandé",
    weight: 0.5,
    createdAt: "02/11/2024",
    estimatedDelivery: "05/11/2024",
    contractRef: "CT-2023-15B",
    events: [
      {
        date: "03/11/2024 11:23",
        status: "En transit",
        location: "Centre de tri Lyon",
        description: "Le colis est en cours d'acheminement",
      },
      {
        date: "02/11/2024 15:45",
        status: "Pris en charge",
        location: "Paris 75008",
        description: "Le colis a été pris en charge par La Poste",
      },
    ],
  },
  {
    id: "3",
    trackingNumber: "7R55443322110",
    status: "out_for_delivery",
    recipientName: "ZVING MONIQUE",
    recipientAddress: "123 Rue de Paris, 75001 Paris, France",
    senderName: "Votre Entreprise",
    senderAddress: "456 Avenue des Champs, 75008 Paris, France",
    product: "Chronopost Express",
    weight: 2.3,
    createdAt: "03/11/2024",
    estimatedDelivery: "03/11/2024",
    contractRef: "CT-2023-15",
    events: [
      {
        date: "03/11/2024 08:15",
        status: "En cours de livraison",
        location: "Paris 75001",
        description: "Le colis est en cours de livraison par le facteur",
      },
      {
        date: "03/11/2024 06:30",
        status: "Arrivé au bureau",
        location: "Bureau de Poste Paris Louvre",
        description: "Le colis est arrivé au bureau de distribution",
      },
      {
        date: "02/11/2024 22:10",
        status: "En transit",
        location: "Hub Chronopost Paris",
        description: "Colis en transit",
      },
      {
        date: "02/11/2024 18:00",
        status: "Pris en charge",
        location: "Paris 75008",
        description: "Le colis a été pris en charge par Chronopost",
      },
    ],
  },
  {
    id: "4",
    trackingNumber: "5K11223344556",
    status: "pending",
    recipientName: "ZVING MONIQUE",
    recipientAddress: "123 Rue de Paris, 75001 Paris, France",
    senderName: "Votre Entreprise",
    senderAddress: "456 Avenue des Champs, 75008 Paris, France",
    product: "Colissimo",
    weight: 0.8,
    createdAt: "03/11/2024",
    estimatedDelivery: "06/11/2024",
    events: [
      {
        date: "03/11/2024 14:00",
        status: "Étiquette créée",
        location: "En ligne",
        description: "L'étiquette d'expédition a été créée",
      },
    ],
  },
]
