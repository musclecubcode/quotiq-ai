import { WorkOrderAttachments } from "./WorkOrderAttachments";
import type { WorkOrderAttachment } from "@/lib/types";
export function WorkOrderDocuments(props: { workOrderId: string; attachments: WorkOrderAttachment[] }) { return <WorkOrderAttachments {...props} kind="document" />; }
