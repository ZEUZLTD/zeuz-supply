
import { getSettings, updateSetting } from './actions';
// Removed missing Switch import, using raw buttons.

export default async function MarketingPage() {
    const settings = await getSettings();
    const showSplash = settings.find((s: { key: string }) => s.key === 'SHOW_SPLASH')?.value ?? true;
    const splashMessage = settings.find((s: { key: string, value: any }) => s.key === 'SPLASH_MESSAGE')?.value || '';
    const launchDiscount = settings.find((s: { key: string }) => s.key === 'LAUNCH_DISCOUNT_ACTIVE')?.value ?? true;
    const launchTitle = settings.find((s: { key: string }) => s.key === 'LAUNCH_TITLE')?.value || '';
    const launchSubtitle = settings.find((s: { key: string }) => s.key === 'LAUNCH_SUBTITLE')?.value || '';

    return (
        <div>
            <h1 className="text-4xl font-black mb-8">MARKETING CONTROL</h1>

            <div className="grid gap-8 max-w-2xl">

                {/* SPLASH SCREEN */}
                <section className="bg-white p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        🛑 SPLASH SCREEN
                    </h2>
                    <form action={async () => {
                        'use server';
                        await updateSetting('SHOW_SPLASH', !showSplash);
                    }}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-500">Enable/Disable the initial loading overlay.</span>
                            <button className={`px-4 py-2 font-bold text-sm uppercase transition-colors ${showSplash ? 'bg-green-500 text-white' : 'bg-gray-200 text-black'}`}>
                                {showSplash ? 'ACTIVE' : 'DISABLED'}
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <a href="/?splash=true" target="_blank" className="text-xs text-amber-600 font-bold underline hover:text-amber-500">
                                PREVIEW SPLASH (NEW TAB)
                            </a>
                        </div>
                    </form>

                    <form action={async (formData) => {
                        'use server';
                        const msg = formData.get('message');
                        await updateSetting('SPLASH_MESSAGE', msg);
                    }} className="flex gap-2">
                        <input
                            name="message"
                            defaultValue={splashMessage}
                            className="flex-1 border border-gray-300 p-2 font-mono text-sm"
                            placeholder="Enter Splash Message..."
                        />
                        <button className="bg-black text-white px-4 py-2 font-bold text-sm uppercase hover:bg-amber-500 hover:text-black">
                            SAVE TEXT
                        </button>
                    </form>
                </section>

                {/* LAUNCH DISCOUNT */}
                <section className="bg-white p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        🚀 LAUNCH PROMO (FIRST 100)
                    </h2>
                    <form action={async () => {
                        'use server';
                        await updateSetting('LAUNCH_DISCOUNT_ACTIVE', !launchDiscount);
                    }}>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Show the "20% OFF FIRST 100 ORDERS" banner.</span>
                            <button className={`px-4 py-2 font-bold text-sm uppercase transition-colors ${launchDiscount ? 'bg-green-500 text-white' : 'bg-gray-200 text-black'}`}>
                                {launchDiscount ? 'ACTIVE' : 'DISABLED'}
                            </button>
                        </div>
                        <div className="flex justify-end mb-4">
                            <a href="/?launch_promo=true" target="_blank" className="text-xs text-amber-600 font-bold underline hover:text-amber-500">
                                PREVIEW PROMO (NEW TAB)
                            </a>
                        </div>
                    </form>

                    <form action={async (formData) => {
                        'use server';
                        await updateSetting('LAUNCH_TITLE', formData.get('title'));
                        await updateSetting('LAUNCH_SUBTITLE', formData.get('subtitle'));
                    }} className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Promo Title (Supports &lt;br/&gt;)</label>
                        <input
                            name="title"
                            defaultValue={launchTitle}
                            className="bg-gray-50 border border-gray-300 p-2 font-mono text-sm w-full"
                            placeholder="£1.00 CELL<br />DROP"
                        />

                        <label className="text-xs font-bold text-gray-400 uppercase mt-2">Promo Subtitle</label>
                        <textarea
                            name="subtitle"
                            defaultValue={launchSubtitle}
                            className="bg-gray-50 border border-gray-300 p-2 font-mono text-sm w-full resize-y"
                            rows={3}
                            placeholder="Details about the offer..."
                        />

                        <button className="bg-black text-white px-4 py-2 font-bold text-sm uppercase hover:bg-amber-500 hover:text-black mt-2 self-end">
                            SAVE TEXT
                        </button>
                    </form>
                </section>

                {/* EMAIL TEMPLATES */}
                <section className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full translate-x-16 -translate-y-16 group-hover:bg-amber-500/20 transition-colors" />

                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2 relative z-10">
                        📧 EMAIL AUTOMATION
                    </h2>
                    <p className="text-sm text-gray-500 mb-6 relative z-10">
                        Manage transactional email templates (Abandoned Cart, Order Confirmed).
                    </p>

                    <div className="relative z-10">
                        <a href="/admin/marketing/email-templates" className="inline-block bg-black text-white px-6 py-3 font-bold text-sm uppercase hover:bg-amber-500 hover:text-black transition-colors">
                            MANAGE TEMPLATES
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
