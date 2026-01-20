"use client"

import * as React from "react"
import { Bold, Italic, List, Mail, Paperclip, Send, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { EmailAccount } from "./email-account-selector-dialog"

// Schema de validation pour le formulaire d'email
const emailComposerSchema = z.object({
  to: z.string().email("Adresse email invalide"),
  cc: z.string().optional(),
  subject: z.string().min(1, "Le sujet est requis"),
  body: z
    .string()
    .refine((value) => value.replace(/<[^>]*>/g, "").trim().length > 0, "Le message est requis"),
})

type EmailComposerFormValues = z.infer<typeof emailComposerSchema>

interface EmailComposerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAccount: EmailAccount | null
  onChangeAccount: () => void
  defaultTo?: string
  defaultSubject?: string
  onSendEmail?: (data: EmailComposerFormValues & { from: EmailAccount }) => void
}

export function EmailComposerDialog({
  open,
  onOpenChange,
  selectedAccount,
  onChangeAccount,
  defaultTo = "",
  defaultSubject = "",
  onSendEmail,
}: EmailComposerDialogProps) {
  const [showCc, setShowCc] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [attachments, setAttachments] = React.useState<File[]>([])
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const editorRef = React.useRef<HTMLDivElement | null>(null)

  const form = useForm<EmailComposerFormValues>({
    resolver: zodResolver(emailComposerSchema),
    defaultValues: {
      to: defaultTo,
      cc: "",
      subject: defaultSubject,
      body: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        to: defaultTo,
        cc: "",
        subject: defaultSubject,
        body: "",
      })
      setAttachments([])
      if (editorRef.current) editorRef.current.innerHTML = ""
    }
  }, [open, defaultTo, defaultSubject, form])

  const handleSendEmail = async (values: EmailComposerFormValues) => {
    if (!selectedAccount) return

    // Toujours prendre la valeur presente dans l'editeur
    const htmlBody = editorRef.current?.innerHTML ?? values.body

    setIsSending(true)
    try {
      if (onSendEmail) {
        await onSendEmail({ ...values, body: htmlBody, from: selectedAccount })
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onOpenChange(false)
      form.reset()
      setAttachments([])
      if (editorRef.current) editorRef.current.innerHTML = ""
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleChooseFiles = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length) {
      setAttachments((prev) => [...prev, ...files])
      event.currentTarget.value = ""
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
  }

  // Helpers de mise en forme WYSIWYG bases sur contentEditable
  const focusEditor = () => editorRef.current?.focus()
  const applyCommand = (command: string, value?: string) => {
    focusEditor()
    try {
      document.execCommand(command, false, value)
    } catch {
      // noop
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl overflow-hidden border border-slate-200 p-0 shadow-2xl">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-900 px-6 py-5 text-slate-50">
          <DialogHeader className="space-y-3 text-slate-50">
            <DialogTitle className="text-lg font-semibold text-white">Nouveau message</DialogTitle>
            <DialogDescription className="text-sm text-slate-200">
              {selectedAccount
                ? `Envoyer depuis ${selectedAccount.email}`
                : "Choisissez un compte d'envoi avant de rediger le message."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-200">
            <Mail className="size-4" />
            <span>
              {selectedAccount ? selectedAccount.email : "Aucun compte selectionne"}
            </span>
            {selectedAccount && (
              <Badge variant="secondary" className="border-0 bg-white/20 text-white">
                {selectedAccount.provider}
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={onChangeAccount}
            >
              {selectedAccount ? "Changer de compte" : "Choisir un compte"}
            </Button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSendEmail)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destinataire</FormLabel>
                      <FormControl>
                        <Input placeholder="client@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objet</FormLabel>
                      <FormControl>
                        <Input placeholder="Objet du message" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                {showCc ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name="cc"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-sm">Copie (CC)</FormLabel>
                            <FormControl>
                              <Input placeholder="autre.contact@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 size-8 text-slate-500 hover:text-slate-900"
                        onClick={() => {
                          setShowCc(false)
                          form.setValue("cc", "")
                        }}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-0 text-slate-600 hover:text-slate-900"
                    onClick={() => setShowCc(true)}
                  >
                    Ajouter un destinataire en copie
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
                        <div
                          ref={editorRef}
                          className="min-h-[220px] w-full rounded-xl border border-slate-200/70 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
                          contentEditable
                          role="textbox"
                          data-placeholder="Ecrivez votre message..."
                          onInput={(event) => {
                            const html = (event.currentTarget as HTMLDivElement).innerHTML
                            field.onChange(html)
                          }}
                          onBlur={field.onBlur}
                          suppressContentEditableWarning
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    title="Gras"
                    onClick={() => applyCommand("bold")}
                  >
                    <Bold className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    title="Italique"
                    onClick={() => applyCommand("italic")}
                  >
                    <Italic className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    title="Liste"
                    onClick={() => applyCommand("insertUnorderedList")}
                  >
                    <List className="size-4" />
                  </Button>
                </div>
                <div className="hidden h-5 w-px bg-slate-200 sm:block" />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleChooseFiles}
                    disabled={isSending}
                  >
                    <Paperclip className="size-4" />
                    Pieces jointes
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFilesSelected}
                  />
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-medium text-slate-600">
                    {attachments.length} piece(s) jointe(s)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
                      >
                        <span className="max-w-[200px] truncate font-medium text-slate-700" title={file.name}>
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 text-slate-500 hover:text-slate-900"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  {selectedAccount ? (
                    <>Expediteur: {selectedAccount.provider}</>
                  ) : (
                    <>Aucun compte selectionne</>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSending}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={!selectedAccount || isSending}>
                    {isSending ? (
                      "Envoi en cours..."
                    ) : (
                      <>
                        <Send className="size-4" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

