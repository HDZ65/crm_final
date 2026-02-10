"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { AlertCircle, CheckCircle2, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { importContratsFromExternal, type ImportContratsData } from "@/actions/contrat-import"
import { toast } from "sonner"

const importContratsSchema = z.object({
  sourceUrl: z.string().optional(),
  apiKey: z.string().optional(),
  dryRun: z.boolean(),
})

type ImportContratsFormValues = z.infer<typeof importContratsSchema>

interface ImportContratsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organisationId: string
}

export function ImportContratsDialog({
  open,
  onOpenChange,
  organisationId,
}: ImportContratsDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<ImportContratsData | null>(null)

  const form = useForm<ImportContratsFormValues>({
    resolver: zodResolver(importContratsSchema),
    defaultValues: {
      sourceUrl: "",
      apiKey: "",
      dryRun: true,
    },
  })

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset()
      setResult(null)
    }
    onOpenChange(isOpen)
  }

  const onSubmit = async (values: ImportContratsFormValues) => {
    if (!organisationId) {
      toast.error("Organisation introuvable")
      return
    }

    setLoading(true)
    setResult(null)

    const response = await importContratsFromExternal({
      organisationId,
      dryRun: values.dryRun,
    })

    setLoading(false)

    if (!response.success || !response.data) {
      toast.error(response.error || "Erreur lors de l'import")
      return
    }

    setResult(response.data)
    toast.success(values.dryRun ? "Simulation terminée" : "Import terminé")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            Importer des contrats
          </DialogTitle>
          <DialogDescription>
            Importez des contrats depuis une API externe en mode simulation ou exécution.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
               control={form.control}
               name="dryRun"
               render={({ field }) => (
                 <FormItem className="flex flex-row items-center gap-3 rounded-md border p-3">
                   <FormControl>
                     <Checkbox
                       checked={field.value}
                       onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                       disabled={loading}
                     />
                   </FormControl>
                   <div className="space-y-1">
                     <FormLabel>Mode simulation (dry run)</FormLabel>
                     <p className="text-xs text-muted-foreground">
                       N&apos;écrit aucune donnée, retourne uniquement le résultat de validation.
                     </p>
                   </div>
                 </FormItem>
               )}
             />

             <div className="flex justify-end">
               <Button type="submit" disabled={loading}>
                 {loading ? "Synchronisation en cours..." : "Synchroniser"}
               </Button>
             </div>
           </form>
         </Form>

         {result && (
           <>
             <Separator />
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <h4 className="text-sm font-semibold">Résultats de la synchronisation</h4>
                 {result.lastSyncDate && (
                   <p className="text-xs text-muted-foreground">
                     Dernier sync: {new Date(result.lastSyncDate).toLocaleString('fr-FR')}
                   </p>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-2 text-sm">
                 <div className="rounded-md border p-2">
                   <p className="text-xs text-muted-foreground">Total</p>
                   <p className="font-semibold">{result.total}</p>
                 </div>
                 <div className="rounded-md border p-2">
                   <p className="text-xs text-muted-foreground">Créés</p>
                   <p className="font-semibold text-green-600">{result.created}</p>
                 </div>
                 <div className="rounded-md border p-2">
                   <p className="text-xs text-muted-foreground">Mis à jour</p>
                   <p className="font-semibold text-blue-600">{result.updated}</p>
                 </div>
                 <div className="rounded-md border p-2">
                   <p className="text-xs text-muted-foreground">Ignorés</p>
                   <p className="font-semibold text-gray-600">{result.skipped}</p>
                 </div>
               </div>

               {result.byEntityType && Object.keys(result.byEntityType).length > 0 && (
                 <div className="rounded-md border p-3 bg-muted/30">
                   <p className="mb-2 text-sm font-medium">Détail par type d'entité</p>
                   <div className="space-y-2">
                     {Object.entries(result.byEntityType).map(([entityType, stats]) => (
                       <div key={entityType} className="flex items-center justify-between text-sm">
                         <span className="capitalize text-muted-foreground">{entityType}</span>
                         <div className="flex gap-3">
                           <span className="text-green-600">+{stats.created}</span>
                           <span className="text-blue-600">~{stats.updated}</span>
                           <span className="text-gray-600">-{stats.skipped}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               <Alert variant={result.errors.length > 0 ? "destructive" : "default"}>
                 {result.errors.length > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                 <AlertDescription>
                   {result.errors.length > 0 ? `${result.errors.length} erreur(s)` : "Synchronisation réussie"}
                 </AlertDescription>
               </Alert>

               {result.errors.length > 0 && (
                 <div className="rounded-md border p-3">
                   <p className="mb-2 text-sm font-medium">Erreurs</p>
                   <ul className="space-y-1 text-sm text-muted-foreground max-h-40 overflow-y-auto">
                     {result.errors.map((error, index) => (
                       <li key={`${error.entityType}-${index}`}>
                         {error.entityType && <span className="font-medium">[{error.entityType}]</span>} {error.message}
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
             </div>
           </>
         )}
      </DialogContent>
    </Dialog>
  )
}
