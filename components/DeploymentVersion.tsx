import React from 'react';

export function DeploymentVersion() {
    const version = process.env.NEXT_PUBLIC_DEPLOYMENT_VERSION || 'dev';
    const shortVersion = version === 'dev' ? 'dev' : version.substring(0, 7);

    return (
        <div className="fixed bottom-1 right-2 z-50 pointer-events-none opacity-30 hover:opacity-100 transition-opacity select-none">
            <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                {shortVersion}
            </span>
        </div>
    );
}
