import { type Product, getTaxLabel } from '@/db/database';
import { Package, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package className="h-12 w-12 mb-3 opacity-40" />
        <p className="font-display text-lg">No products found</p>
        <p className="text-sm">Add products in Inventory</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map((product, i) => {
        const isLowStock = product.stock <= product.lowStockAlert;
        const isOutOfStock = product.stock <= 0;

        return (
          <motion.button
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => !isOutOfStock && onAddToCart(product)}
            disabled={isOutOfStock}
            className={`
              relative flex flex-col p-3 rounded-lg border text-left transition-all touch-target
              ${isOutOfStock 
                ? 'bg-muted/50 border-border opacity-60 cursor-not-allowed' 
                : 'bg-card border-border hover:border-primary hover:shadow-md active:scale-[0.98]'}
            `}
          >
            {isLowStock && !isOutOfStock && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning">
                <AlertTriangle className="h-3 w-3 text-foreground" />
              </span>
            )}
            <span className="font-display font-semibold text-sm leading-tight line-clamp-2 mb-1">
              {product.name}
            </span>
            <span className="text-xs text-muted-foreground mb-2">{product.sku}</span>
            <div className="mt-auto flex items-end justify-between">
              <span className="font-display font-bold text-lg text-primary">
                KES {product.price.toLocaleString()}
              </span>
              <span className={`text-xs font-medium ${isOutOfStock ? 'text-destructive' : isLowStock ? 'text-warning' : 'text-muted-foreground'}`}>
                {isOutOfStock ? 'Out' : `${product.stock} left`}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
