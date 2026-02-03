import { getOrder } from '../actions';
import { OrderDetailView } from '../OrderDetailView';

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const order = await getOrder(params.id);

    if (!order) {
        return <div>Order not found</div>;
    }

    return <OrderDetailView order={order} />;
}
