import { getOrder } from '../actions';
import { OrderDetailView } from '../OrderDetailView';

export default async function Page({ params }: { params: { id: string } }) {
    const order = await getOrder(params.id);

    if (!order) {
        return <div>Order not found</div>;
    }

    return <OrderDetailView order={order} />;
}
