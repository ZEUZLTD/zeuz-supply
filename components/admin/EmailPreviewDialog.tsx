'use client';


import { useState, useRef, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import { createPortal } from 'react-dom';

interface EmailPreviewDialogProps {
    html: string;
    subject: string;
}

export default function EmailPreviewDialog({ html, subject }: EmailPreviewDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Portal to body to avoid z-index issues
    const Portal = ({ children }: { children: React.ReactNode }) => {
        if (typeof window === 'undefined') return null;
        return createPortal(children, document.body);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase border border-gray-600 px-2 py-1 text-gray-400 hover:border-white hover:text-white transition-colors"
            >
                <Eye className="w-3 h-3" />
                Preview
            </button>

            {isOpen && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Modal */}
                        <div className="relative w-full max-w-3xl bg-[#050505] border border-[#333] shadow-2xl flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#0A0A0A]">
                                <div>
                                    <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">Preview Protocol</div>
                                    <h3 className="font-mono text-white text-sm font-bold truncate max-w-md">{subject}</h3>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-[#222]"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content (Iframe for isolation) */}
                            <div className="flex-1 overflow-hidden bg-[#111] p-4">
                                <iframe
                                    srcDoc={html}
                                    className="w-full h-full min-h-[500px] border-none bg-white"
                                    title="Email Preview"
                                />
                            </div>

                            {/* Footer */}
                            <div className="p-3 border-t border-[#333] bg-[#0A0A0A] text-[10px] text-gray-600 font-mono text-center">
                                RENDERED OUTPUT // ZEUZ MAIL SYSTEM
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </>
    );
}
