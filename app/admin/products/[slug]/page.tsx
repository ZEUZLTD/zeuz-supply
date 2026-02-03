import { getProduct } from '../product-actions';
import ProductForm from './product-form';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function AdminProductPage(props: PageProps) {
    const params = await props.params;
    const isNew = params.slug === 'new';
    let product = null;

    if (!isNew) {
        product = await getProduct(params.slug);
    }

    return (
        <div className="container mx-auto max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-black uppercase">
                    {isNew ? 'New Product' : `Edit: ${product?.model || params.slug}`}
                </h1>
                <p className="opacity-50 font-mono text-sm">
                    {isNew ? 'Create a new inventory item.' : `ID: ${product?.id}`}
                </p>
            </div>

            <ProductForm product={product} />
        </div>
    );
}
