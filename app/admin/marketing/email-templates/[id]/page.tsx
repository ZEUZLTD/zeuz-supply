import { getTemplate, upsertTemplate } from '../actions';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default async function EditTemplatePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const isNew = params.id === 'new';
    const template = isNew ? {} : await getTemplate(params.id);

    return (
        <div className="max-w-4xl mx-auto">
            <Link href="/admin/marketing/email-templates" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black mb-6 uppercase">
                <ArrowLeft className="w-4 h-4" /> Back to List
            </Link>

            <h1 className="text-3xl font-black mb-8 flex items-center gap-2">
                {isNew ? 'CREATE TEMPLATE' : `EDIT: ${template.key}`}
            </h1>

            <form action={upsertTemplate} className="bg-white border border-gray-200 shadow-sm p-8 grid gap-6">
                <input type="hidden" name="id" value={params.id} />

                {/* KEY */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Template Key (Unique)</label>
                    <input
                        name="key"
                        className="w-full border border-gray-300 p-3 font-mono text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 ring-amber-500"
                        placeholder="e.g. abandoned_cart"
                        defaultValue={template.key || ''}
                        required
                    />
                    <p className="text-xs text-gray-400 mt-1">Used in code to trigger this email.</p>
                </div>

                {/* DESCRIPTION */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                    <input
                        name="description"
                        className="w-full border border-gray-300 p-3 font-mono text-sm focus:outline-none focus:ring-2 ring-amber-500"
                        placeholder="Internal notes..."
                        defaultValue={template.description || ''}
                    />
                </div>

                {/* SUBJECT */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subject Line</label>
                    <input
                        name="subject"
                        className="w-full border border-gray-300 p-3 font-mono text-sm focus:outline-none focus:ring-2 ring-amber-500"
                        placeholder="Subject..."
                        defaultValue={template.subject || ''}
                        required
                    />
                </div>

                {/* BODY */}
                <div className="h-96">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">HTML Body</label>
                    <textarea
                        name="body_html"
                        className="w-full h-full border border-gray-300 p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 ring-amber-500 resize-none"
                        placeholder="<html>...</html>"
                        defaultValue={template.body_html || ''}
                        required
                    />
                    <p className="text-xs text-gray-400 mt-1">Supports variables like {'{{name}}'}, {'{{order_id}}'}.</p>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button className="bg-black text-white px-8 py-3 font-bold uppercase text-sm flex items-center gap-2 hover:bg-amber-500 hover:text-black transition-colors">
                        <Save className="w-4 h-4" />
                        SAVE CHANGES
                    </button>
                </div>
            </form>
        </div>
    );
}
