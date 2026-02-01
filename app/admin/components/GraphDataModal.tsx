import { useState } from 'react';

interface GraphDataModalProps {
    batchId: string;
    batchCode: string;
    hasGraphData: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function GraphDataModal({ batchId, batchCode, hasGraphData, onClose, onSuccess }: GraphDataModalProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = () => {
        window.open(`/api/admin/batches/${batchId}/graph-csv`, '_blank');
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("This will OVERWRITE existing graph data for this batch. Are you sure?")) {
            e.target.value = ''; // Reset input
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`/api/admin/batches/${batchId}/graph-csv`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            alert(`Success! Updated ${data.count} rows.`);
            onSuccess();
            onClose();

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
            console.error(err);
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white p-6 shadow-xl max-w-md w-full border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h3 className="text-lg font-bold uppercase">Graph Data: {batchCode}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
                </div>

                <div className="space-y-6">
                    {/* Status Indicator */}
                    <div className={`p-3 text-sm font-mono border ${hasGraphData ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        STATUS: {hasGraphData ? 'DATA_PRESENT' : 'NO_DATA'}
                    </div>

                    {/* Download Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Export</label>
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center gap-2 border border-black p-3 hover:bg-gray-50 transition-colors font-mono text-sm"
                        >
                            <span>DOWNLOAD CSV</span>
                        </button>
                        <p className="text-[10px] text-gray-400">Format: current_a, capacity_ah, voltage_v</p>
                    </div>

                    <div className="border-t border-dashed my-4"></div>

                    {/* Upload Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Import / Overwrite</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleUpload}
                                disabled={uploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className={`w-full flex items-center justify-center gap-2 bg-black text-white p-3 hover:bg-gray-800 transition-colors font-mono text-sm ${uploading ? 'opacity-50' : ''}`}>
                                <span>{uploading ? 'UPLOADING...' : 'UPLOAD CSV'}</span>
                            </div>
                        </div>
                        {error && (
                            <div className="text-red-500 text-xs font-bold mt-2">
                                ERROR: {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
