export type ContractSlice = {
  company: string
  contracts: number
}

// Source unique pour le donut et la liste
export const contractsData: ContractSlice[] = [
  { company: "France Téléphone", contracts: 6 },
  { company: "Mondial TV", contracts: 9 },
  { company: "Action Prévoyance", contracts: 12 },
  { company: "Dépanssur", contracts: 4 },
]

