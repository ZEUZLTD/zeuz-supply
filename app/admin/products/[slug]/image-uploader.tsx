'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
    value: string[];
    onChange: (urls: string[]) => void;
    slug?: string;
}

export default function ImageUploader({ value, onChange, slug = 'temp' }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const files = Array.from(e.target.files);
        const newUrls: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${slug}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                newUrls.push(publicUrl);
            }
            onChange([...value, ...newUrls]);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const removeImage = (indexToRemove: number) => {
        onChange(value.filter((_, index) => index !== indexToRemove));
    };

    const moveImage = (index: number, direction: 'left' | 'right') => {
        const newValue = [...value];
        if (direction === 'left') {
            if (index === 0) return;
            [newValue[index - 1], newValue[index]] = [newValue[index], newValue[index - 1]];
        } else {
            if (index === value.length - 1) return;
            [newValue[index + 1], newValue[index]] = [newValue[index], newValue[index + 1]];
        }
        onChange(newValue);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {value.map((url, index) => (
                    <div key={url} className="relative group bg-white border border-gray-200 shadow-sm flex flex-col">
                        <div className="relative aspect-square w-full bg-gray-50/50">
                            <Image
                                src={url}
                                alt="Product"
                                fill
                                className="object-contain p-2"
                            />

                            {/* Status Badge */}
                            {index === 0 && (
                                <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 uppercase shadow-sm z-10 tracking-wider">
                                    MAIN
                                </div>
                            )}

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-white text-red-500 hover:bg-red-50 border border-red-100 p-1.5 rounded-full shadow-sm z-20 transition-transform active:scale-95"
                                title="Remove Image"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Filename Info */}
                        <div className="px-2 py-1 border-t border-b text-[10px] font-mono text-gray-500 truncate bg-gray-50 text-center" title={url.split('/').pop()}>
                            {url.split('/').pop()?.split('-').slice(1).join('-') || 'image'}
                        </div>

                        {/* Controls - Always Visible */}
                        <div className="p-2 bg-white flex justify-between items-center gap-2">
                            <button
                                type="button"
                                onClick={() => moveImage(index, 'left')}
                                disabled={index === 0}
                                className="flex-1 flex justify-center py-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
                                title="Move Left (Earlier)"
                            >
                                <ArrowLeft size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => moveImage(index, 'right')}
                                disabled={index === value.length - 1}
                                className="flex-1 flex justify-center py-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
                                title="Move Right (Later)"
                            >
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                <label className="border-2 border-dashed border-gray-300 flex flex-col items-center justify-center aspect-square cursor-pointer hover:border-gray-500 hover:bg-gray-50 transition-colors bg-gray-50/30">
                    {uploading ? (
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    ) : (
                        <>
                            <Upload className="text-gray-400 mb-2" size={32} />
                            <span className="text-xs font-bold uppercase text-gray-500">Upload</span>
                        </>
                    )}
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            </div>
            <p className="text-xs text-gray-400 italic text-center w-full">Use arrows to reorder • First image is Main</p>
        </div>
    );
}
