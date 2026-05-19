import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';

export interface CosmeticDialogItem {
    id: string;
    url: string;
}

interface CosmeticsDialogProps {
    open: boolean;
    title: string;
    items: CosmeticDialogItem[];
    page: number;
    total: number;
    pageSize: number;
    onClose: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onItemClick?: (item: CosmeticDialogItem) => void;
    emptyMessage?: string;
}

function CosmeticsDialog({
    open,
    title,
    items,
    page,
    total,
    pageSize,
    onClose,
    onPrevious,
    onNext,
    onItemClick,
    emptyMessage = 'No cosmetics found.',
}: CosmeticsDialogProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {items.length === 0 ? (
                    <p className="py-6 text-sm text-[rgba(184,176,214,0.8)]">{emptyMessage}</p>
                ) : (
                    <div className="grid grid-cols-4 gap-4">
                        {items.map((item) => (
                            <div key={item.id} className="rounded-lg border border-[#2a2640] p-3">
                                <button
                                    type="button"
                                    className="block w-full text-left"
                                    onClick={() => onItemClick?.(item)}
                                >
                                    <img src={item.url} alt="Cosmetic" className="cursor-pointer h-24 w-full rounded object-cover" />
                                    <p className="mt-2 text-xs text-[rgba(184,176,214,0.8)]">Click to preview</p>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                    <Button size="small" variant="outlined" disabled={page === 0} onClick={onPrevious}>
                        Previous
                    </Button>
                    <p className="text-xs text-[rgba(184,176,214,0.8)]">
                        Page {page + 1} of {totalPages}
                    </p>
                    <Button size="small" variant="outlined" disabled={(page + 1) * pageSize >= total} onClick={onNext}>
                        Next
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default CosmeticsDialog;