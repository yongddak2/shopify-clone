import OrderDetailClient from "./OrderDetailClient";

export default async function MypageOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailClient id={id} />;
}
