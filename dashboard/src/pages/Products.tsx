import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const token = localStorage.getItem('agentcart_token') || '';
  const { data, isLoading } = useProducts(token);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-section-heading text-near-black tracking-tight">API Marketplace</h2>
          <p className="text-muted-slate text-caption mt-1">{data?.products?.length || 0} available APIs</p>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-muted-slate">Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.products?.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}