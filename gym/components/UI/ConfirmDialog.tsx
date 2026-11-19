import { ShieldCheck } from 'lucide-react';
import Button from './Button';

export default function ConfirmDialog({ title, detail, error, busy, onCancel, onConfirm, }: {
    title: string;
    detail: string;
    error?: string;
    busy: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <>
            <div className="modal-symbol">
                <ShieldCheck size={26} />
            </div>
            <h2>{title}</h2>
            <p>{detail}</p>
            {error && (
                <div className= "error" role="alert">
                    {error}
                </div>
            )}
            <div className="modal-actions">
                <Button variant="secondary" disabled={busy} onClick={onCancel}>
                    No, keep it
                </Button>
                <Button variant="primary" disabled={busy} onClick={onConfirm}>
                    {busy ? 'Saving' : 'Yes, confirm'}
                </Button>
            </div>
        </>
    );
}