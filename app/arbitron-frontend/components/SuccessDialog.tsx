import { useEffect, useRef } from "react";

type Props = Readonly<{
    title: string;
    children: React.ReactNode;
    onClose(): void;
}>;

export function SuccessDialog({ title, children, onClose }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) {
            dialog.showModal();
        }
    }, []);

    return (
        <dialog
            ref={dialogRef}
            onClose={() => {
                dialogRef.current?.close();
                onClose();
            }}
            style={{
                padding: '24px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto'
            }}
        >
            <h2 style={{ margin: '0 0 16px 0' }}>{title}</h2>
            {children}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                    type="button"
                    onClick={(clickEvent) => {
                        clickEvent.preventDefault();
                        dialogRef.current?.close();
                    }}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer'
                    }}
                >
                    Cool!
                </button>
            </div>
        </dialog>
    );
} 