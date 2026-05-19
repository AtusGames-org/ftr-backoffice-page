import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';

export interface CosmeticPreviewItem {
    id: string;
    url: string;
}

interface CosmeticPreviewDialogProps {
    open: boolean;
    item: CosmeticPreviewItem | null;
    title?: string;
    onClose: () => void;
}

function CosmeticPreviewDialog({ open, item, title = 'Cosmetic Preview', onClose }: CosmeticPreviewDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {!item ? (
                    <p className="py-6 text-sm text-[rgba(184,176,214,0.8)]">No cosmetic selected.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="overflow-hidden rounded-lg border border-[#2a2640] bg-black/20">
                            <img src={item.url} alt="Cosmetic" className="max-h-[420px] w-full object-contain" />
                        </div>
                        <p className="break-all text-xs text-[rgba(184,176,214,0.8)]">{item.url}</p>
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={async () => {
                                await navigator.clipboard.writeText(item.url);
                            }}
                        >
                            Copy Link
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default CosmeticPreviewDialog;