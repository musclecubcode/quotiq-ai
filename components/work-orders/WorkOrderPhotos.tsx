import { WorkOrderAttachments } from "./WorkOrderAttachments";
import type { WorkOrderAttachment } from "@/lib/types";
export function WorkOrderPhotos(props: { workOrderId: string; attachments: WorkOrderAttachment[] }) { return <WorkOrderAttachments {...props} kind="photo" />; }
