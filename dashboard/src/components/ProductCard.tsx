import { formatCurrency } from '../utils/format';
import { Edit3, XCircle } from 'lucide-react';

interface ProductCardProps {
  product: any;
  onEdit?: (p: any) => void;
  onToggle?: (p: any) => void;
}

export default function ProductCard({ product, onEdit, onToggle }: ProductCardProps) {
  return (
    <div className="card p-6 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-display text-feature-heading">{product.name}</h3>
        <span className="pill-chip-coral text-xs">{formatCurrency(product.price_usdc)} / call</span>
      </div>
      <p className="text-caption text-muted-slate flex-1">{product.description}</p>
      <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between">
        <span className="mono-label text-muted-slate">{product.provider}</span>
        <div className="flex gap-2">
          {onEdit && (
            <button onClick={() => onEdit(product)} className="text-muted-slate hover:text-ink transition-colors">
              <Edit3 size={16} />
            </button>
          )}
          {onToggle && (
            <button onClick={() => onToggle(product)} className={`transition-colors ${product.is_active ? 'text-muted-slate hover:text-error-red' : 'text-coral hover:text-ink'}`}>
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}