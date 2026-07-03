import { PageHeader } from "@/components/ui/PageHeader";
import { AssistantChat } from "@/components/ai/AssistantChat";

export default function AiAssistantPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Assistant"
        description="Ask about jobs, estimates, or invoices — or get a first draft on a new estimate."
      />
      <AssistantChat />
    </div>
  );
}
