import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { CheckoutDialog } from '@/components/pos/CheckoutDialog';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

export default function SalesPage() {
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { products } = useProducts(search);
  const cart = useCart();

  return (
    <div className="flex h-full">
      {/* Product catalog */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <ProductGrid products={products} onAddToCart={cart.addToCart} />
        </div>

        {/* Mobile cart FAB */}
        <div className="lg:hidden fixed bottom-20 right-4 z-10">
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button className="h-14 w-14 rounded-full shadow-lg relative">
                <ShoppingCart className="h-6 w-6" />
                {cart.cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center">
                    {cart.cartItems.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <CartPanel
                items={cart.cartItems}
                subtotal={cart.subtotal}
                totalTax={cart.totalTax}
                total={cart.total}
                onUpdateQuantity={cart.updateQuantity}
                onRemove={cart.removeFromCart}
                onClear={cart.clearCart}
                onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop cart sidebar */}
      <div className="hidden lg:flex w-[380px] shrink-0">
        <CartPanel
          items={cart.cartItems}
          subtotal={cart.subtotal}
          totalTax={cart.totalTax}
          total={cart.total}
          onUpdateQuantity={cart.updateQuantity}
          onRemove={cart.removeFromCart}
          onClear={cart.clearCart}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        total={cart.total}
        onConfirm={cart.checkout}
      />
    </div>
  );
}
