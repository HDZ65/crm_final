"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Plus, Send } from "lucide-react"
import type { EventItem } from "@/types/client"

// Re-export pour compatibilité
export type ClientHistoryItem = EventItem

type NoteItem = { id: string; date: string; author: string; content: string }

export function ClientNotesSheet(props: { history?: EventItem[] }) {
  const { history: _history } = props

  const [notes, setNotes] = React.useState<NoteItem[]>([
    {
      id: "n1",
      date: "12/10/2024 15:20",
      author: "Alexandre Martin",
      content: "Appel client, RDV fixé au 15/10.",
    },
    {
      id: "n2",
      date: "01/10/2024 09:00",
      author: "Alexandre Martin",
      content: "Demande duplicata facture envoyée.",
    },
  ])
  const [newNote, setNewNote] = React.useState("")
  const bottomRef = React.useRef<HTMLDivElement | null>(null)

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" })
  }

  function addNote() {
    const content = newNote.trim()
    if (!content) return
    const now = new Date()
    const date = now.toLocaleString("fr-FR")
    setNotes((prev) => [
      ...prev,
      { id: `${now.getTime()}`, date, author: "Vous", content },
    ])
    setNewNote("")
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      addNote()
    }
  }

  React.useEffect(() => {
    scrollToBottom(notes.length <= 1 ? "auto" : "smooth")
  }, [notes.length])

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" /> Notes
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] sm:w-[560px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Notes</SheetTitle>
          <SheetDescription>Ajoutez et consultez les notes du client.</SheetDescription>
        </SheetHeader>
        <div className="px-4 flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">
            <ul className="space-y-3 py-2">
              {notes.map((n) => {
                const isMe = n.author === "Vous"
                return (
                  <li key={n.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-white"}`}>
                      <div className={`text-[11px] font-medium mb-1 ${isMe ? "text-primary-foreground/90" : "text-black"}`}>{n.author}</div>
                      <div className="whitespace-pre-wrap">{n.content}</div>
                      <div className={`mt-1 text-[10px] opacity-75 ${isMe ? "text-primary-foreground" : "text-black"}`}>{n.date}</div>
                    </div>
                  </li>
                )
              })}
              <div ref={bottomRef} />
            </ul>
          </ScrollArea>
        </div>
        <SheetFooter className="border-t flex flex-row items-center gap-2 bg-primary/5">
          <Input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Écrire un message..."
          />
          <Button onClick={addNote} size="sm" disabled={!newNote.trim()}>
            <Send className="size-4" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
