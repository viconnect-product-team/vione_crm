import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useServerData } from "@/hooks/use-server-data";
import {
  listMembers,
  type MyConversation,
  type DirectoryMember,
} from "@/lib/member-app.functions";
import { ConversationList } from "@/components/association-messages/ConversationList";
import { ChatThread } from "@/components/association-messages/ChatThread";
import { MessagesErrorBoundary } from "@/components/association-messages/MessagesErrorBoundary";
export { isSelfUser } from "@/components/association-messages/types";

const messagesSearchSchema = z.object({
  peerCode: z.string().optional(),
  peerName: z.string().optional(),
});

export const Route = createFileRoute("/association/messages")({
  validateSearch: (search: Record<string, unknown>) => messagesSearchSchema.parse(search),
  component: MessagesScreen,
});

function MessagesScreen() {
  const search = Route.useSearch();
  const fetchMembers = useServerFn(listMembers);
  const { data: members = [] } = useServerData<DirectoryMember[]>(() => fetchMembers(), [], "vba_directory_members");

  const [active, setActive] = useState<MyConversation | null>(() => {
    if (search.peerCode) {
      return {
        peerCode: search.peerCode,
        name: search.peerName || search.peerCode.toUpperCase(),
        last: "",
        time: "Vừa xong",
        unread: 0,
      };
    }
    return null;
  });

  useEffect(() => {
    if (search.peerCode) {
      setActive({
        peerCode: search.peerCode,
        name: search.peerName || search.peerCode.toUpperCase(),
        last: "",
        time: "Vừa xong",
        unread: 0,
      });
    }
  }, [search.peerCode, search.peerName]);

  const handleOpenConversation = (c: MyConversation) => {
    if (!c) return;
    c.unread = 0;
    try {
      const raw = localStorage.getItem("vba.recent_conversations");
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const updated = list.map((item: any) =>
            item?.peerCode && String(item.peerCode).toLowerCase() === String(c.peerCode).toLowerCase()
              ? { ...item, unread: 0 }
              : item
          );
          localStorage.setItem("vba.recent_conversations", JSON.stringify(updated));
        }
      }
    } catch {}
    setActive(c);
  };

  return (
    <MessagesErrorBoundary>
      {active ? (
        <ChatThread peer={active} onBack={() => setActive(null)} members={members || []} />
      ) : (
        <ConversationList onOpen={handleOpenConversation} members={members || []} />
      )}
    </MessagesErrorBoundary>
  );
}
