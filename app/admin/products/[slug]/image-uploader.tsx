'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, Loader2 } from 'lucide-react';
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
            // Reset input
            e.target.value = '';
        }
    };

    const removeImage = (indexToRemove: number) => {
        onChange(value.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {value.map((url, index) => (
                    <div key={url} className="relative group aspect-square bg-gray-50 border border-gray-200">
                        <Image
                            src={url}
                            alt="Product"
                            fill
                            className="object-contain p-2"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}

                <label className="border-2 border-dashed border-gray-300 flex flex-col items-center justify-center aspect-square cursor-pointer hover:border-gray-500 hover:bg-gray-50 transition-colors">
                    {uploading ? (
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    ) : (
                        <>
                            <Upload className="text-gray-400 mb-2" size={32} />
                            <span className="text-xs font-bold uppercase text-gray-500">Upload Images</span>
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
        </div>
    );
}
