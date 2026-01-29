import Link from 'next/link';
import { getTemplates } from './actions';
import { Mail, Plus, Edit } from 'lucide-react';
import EmailPreviewDialog from '@/components/admin/EmailPreviewDialog';

export const dynamic = 'force-dynamic';

export default async function EmailTemplatesPage() {
    const templates = await getTemplates();

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
                        <Mail className="w-8 h-8" />
                        EMAIL TEMPLATES
                    </h1>
                    <p className="text-gray-500 font-mono text-sm">Manage automated transactional emails.</p>
                </div>
                <Link
                    href="/admin/marketing/email-templates/new"
                    className="bg-black text-white px-4 py-2 font-bold uppercase text-sm flex items-center gap-2 hover:bg-amber-500 hover:text-black transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    NEW TEMPLATE
                </Link>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm">
                <table className="w-full text-left font-mono text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-bold text-gray-400 uppercase">Key / Slug</th>
                            <th className="p-4 font-bold text-gray-400 uppercase">Subject</th>
                            <th className="p-4 font-bold text-gray-400 uppercase">Last Updated</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {templates.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400">
                                    No templates found.
                                </td>
                            </tr>
                        ) : (
                            templates.map((t: any) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-bold">{t.key}</td>
                                    <td className="p-4">{t.subject}</td>
                                    <td className="p-4 text-gray-500">
                                        {new Date(t.updated_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                        <EmailPreviewDialog html={t.body_html} subject={t.subject} />
                                        <Link
                                            href={`/admin/marketing/email-templates/${t.id}`}
                                            className="inline-flex items-center gap-1 text-xs font-bold uppercase border border-gray-200 px-2 py-1 hover:bg-black hover:text-white transition-colors"
                                        >
                                            <Edit className="w-3 h-3" /> EDIT
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
