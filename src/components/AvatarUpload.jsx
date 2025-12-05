import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, User, Loader2 } from 'lucide-react';

export default function AvatarUpload({ url, onUpload, size = 150, editable = true }) {
    const [uploading, setUploading] = useState(false);

    const uploadAvatar = async (event) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            onUpload(publicUrl);
        } catch (error) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group" style={{ width: size, height: size }}>
            {url ? (
                <img
                    src={url}
                    alt="Avatar"
                    className="rounded-full object-cover w-full h-full border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                />
            ) : (
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 w-full h-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
                    <User size={size * 0.4} />
                </div>
            )}

            {editable && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <label className="cursor-pointer w-full h-full flex items-center justify-center" htmlFor="single">
                        {uploading ? (
                            <Loader2 className="animate-spin text-white" size={size * 0.3} />
                        ) : (
                            <Camera className="text-white" size={size * 0.3} />
                        )}
                        <input
                            type="file"
                            id="single"
                            accept="image/*"
                            onChange={uploadAvatar}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
