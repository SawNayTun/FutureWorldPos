import { Injectable, signal, computed, effect } from '@angular/core';

export interface Product {
  id: number;
  barcode: string;
  name: string;
  price: number; // Selling Price
  cost: number;  // Buying Price (For Profit Calc)
  category: string;
  image: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number; // Total Buying Price
  totalProfit: number; // Profit for this order
  paymentMethod: 'Cash' | 'KBZ Pay' | 'Wave Pay';
  currency: 'MMK' | 'THB' | 'CNY';
}

export interface ParkedOrder {
  id: number;
  timestamp: Date;
  items: CartItem[];
  note: string;
}

export interface ShopConfig {
  name: string;
  address: string;
  phone: string;
  footerMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class PosService {
  private exchangeRates = {
    MMK: 1,
    THB: 100,
    CNY: 450
  };

  // Mock initial data
  private initialProducts: Product[] = [
    { id: 1, barcode: '8850123', name: 'Royal D', price: 500, cost: 350, category: 'Drinks', image: 'https://picsum.photos/200/200?random=1', stock: 50 },
    { id: 2, barcode: '8850124', name: 'Myanmar Beer', price: 2500, cost: 2100, category: 'Drinks', image: 'https://picsum.photos/200/200?random=2', stock: 24 },
  ];

  // Shop Configuration
  shopInfo = signal<ShopConfig>({
      name: 'FUTURE WORLD',
      address: 'Yangon, Myanmar',
      phone: '09-123456789',
      footerMessage: 'Thank You! See you again.'
  });

  // Dynamic Categories
  categories = signal<string[]>(['Drinks', 'Food', 'Stationery', 'Other']);

  products = signal<Product[]>([]);
  cart = signal<CartItem[]>([]);
  orders = signal<Order[]>([]);
  parkedOrders = signal<ParkedOrder[]>([]);
  activeCurrency = signal<'MMK' | 'THB' | 'CNY'>('MMK');
  
  cartDiscount = signal<number>(0); 
  
  // Licensing
  enteredLicense = signal<string>(localStorage.getItem('fw_entered_license') || '');
  requiredLicense = signal<string>(localStorage.getItem('fw_target_license') || 'FUTURE-2025');
  adminPassword = signal<string>(localStorage.getItem('fw_admin_pass') || 'MasterSaiYan');

  isProVersion = computed(() => this.enteredLicense() === this.requiredLicense());

  constructor() {
    this.loadData();

    // Auto-save effects
    effect(() => localStorage.setItem('fw_products', JSON.stringify(this.products())));
    effect(() => localStorage.setItem('fw_orders', JSON.stringify(this.orders())));
    effect(() => localStorage.setItem('fw_parked', JSON.stringify(this.parkedOrders())));
    effect(() => localStorage.setItem('fw_categories', JSON.stringify(this.categories())));
    effect(() => localStorage.setItem('fw_shop_info', JSON.stringify(this.shopInfo())));
    
    // Security persistence
    effect(() => localStorage.setItem('fw_entered_license', this.enteredLicense()));
    effect(() => localStorage.setItem('fw_target_license', this.requiredLicense()));
    effect(() => localStorage.setItem('fw_admin_pass', this.adminPassword()));
  }

  private loadData() {
    const p = localStorage.getItem('fw_products');
    const o = localStorage.getItem('fw_orders');
    const park = localStorage.getItem('fw_parked');
    const cats = localStorage.getItem('fw_categories');
    const shop = localStorage.getItem('fw_shop_info');
    
    if (p) this.products.set(JSON.parse(p));
    else this.products.set(this.initialProducts);

    if (o) this.orders.set(JSON.parse(o));
    if (park) this.parkedOrders.set(JSON.parse(park));
    if (cats) this.categories.set(JSON.parse(cats));
    if (shop) this.shopInfo.set(JSON.parse(shop));
  }

  // --- Calculations ---
  cartSubTotalMMK = computed(() => {
    return this.cart().reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  });

  cartTotalCostMMK = computed(() => {
      return this.cart().reduce((acc, item) => acc + (item.product.cost * item.quantity), 0);
  });

  cartTotalMMK = computed(() => {
      const sub = this.cartSubTotalMMK();
      const disc = this.cartDiscount();
      return Math.max(0, sub - disc);
  });

  cartCount = computed(() => {
    return this.cart().reduce((acc, item) => acc + item.quantity, 0);
  });

  totalSalesToday = computed(() => {
      const today = new Date().toDateString();
      return this.orders()
        .filter(o => new Date(o.date).toDateString() === today)
        .reduce((acc, order) => acc + order.total, 0);
  });
  
  totalProfitToday = computed(() => {
      const today = new Date().toDateString();
      return this.orders()
        .filter(o => new Date(o.date).toDateString() === today)
        .reduce((acc, order) => acc + (order.totalProfit || 0), 0);
  });

  dailySalesSummary = computed(() => {
      const today = new Date().toDateString();
      const todayOrders = this.orders().filter(o => new Date(o.date).toDateString() === today);
      
      return {
          cash: todayOrders.filter(o => o.paymentMethod === 'Cash').reduce((acc, o) => acc + o.total, 0),
          kbz: todayOrders.filter(o => o.paymentMethod === 'KBZ Pay').reduce((acc, o) => acc + o.total, 0),
          wave: todayOrders.filter(o => o.paymentMethod === 'Wave Pay').reduce((acc, o) => acc + o.total, 0),
          total: todayOrders.reduce((acc, o) => acc + o.total, 0),
          profit: todayOrders.reduce((acc, o) => acc + (o.totalProfit || 0), 0),
          count: todayOrders.length
      };
  });

  // --- Currency Helpers ---
  convertPrice(priceMMK: number): number {
      const rate = this.exchangeRates[this.activeCurrency()];
      return Math.ceil(priceMMK / rate); 
  }

  getCurrencySymbol(): string {
      switch(this.activeCurrency()) {
          case 'MMK': return 'Ks';
          case 'THB': return '฿';
          case 'CNY': return '¥';
      }
  }

  // --- Cart Actions ---
  addToCart(product: Product) {
    if (product.stock <= 0) return;

    this.cart.update(items => {
      const existing = items.find(i => i.product.id === product.id);
      if (existing) {
          if (existing.quantity >= product.stock) return items;
          return items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...items, { product, quantity: 1 }];
    });
  }

  addToCartByBarcode(barcode: string): boolean {
      const product = this.products().find(p => p.barcode === barcode);
      if (product && product.stock > 0) {
          this.addToCart(product);
          return true;
      }
      return false;
  }

  removeFromCart(productId: number) {
    this.cart.update(items => items.filter(i => i.product.id !== productId));
  }

  updateQuantity(productId: number, delta: number) {
    this.cart.update(items => {
      return items.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty > item.product.stock) return item; 
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      });
    });
  }

  setDiscount(amount: number) {
      this.cartDiscount.set(amount);
  }

  clearCart() {
    this.cart.set([]);
    this.cartDiscount.set(0);
  }

  // --- Hold / Retrieve Bill ---
  parkOrder(note: string = 'Held Bill') {
      const currentCart = this.cart();
      if (currentCart.length === 0) return;
      
      const parked: ParkedOrder = {
          id: Date.now(),
          timestamp: new Date(),
          items: currentCart,
          note
      };
      
      this.parkedOrders.update(p => [...p, parked]);
      this.clearCart();
  }

  retrieveOrder(parkedId: number) {
      const parked = this.parkedOrders().find(p => p.id === parkedId);
      if (parked) {
          this.cart.set(parked.items);
          this.parkedOrders.update(p => p.filter(i => i.id !== parkedId));
      }
  }
  
  deleteParkedOrder(id: number) {
      this.parkedOrders.update(p => p.filter(i => i.id !== id));
  }

  // --- Checkout ---
  checkout(paymentMethod: 'Cash' | 'KBZ Pay' | 'Wave Pay'): Order | null {
    const currentCart = this.cart();
    if (currentCart.length === 0) return null;

    const totalSale = this.cartTotalMMK();
    const totalCost = this.cartTotalCostMMK();
    // Profit = (Total Sale - Discount) - Cost
    // Note: Discount cuts into profit.
    const totalProfit = totalSale - totalCost;

    // Deduct Stock
    this.products.update(allProducts => {
        return allProducts.map(p => {
            const cartItem = currentCart.find(c => c.product.id === p.id);
            if (cartItem) {
                const newStock = Math.max(0, p.stock - cartItem.quantity);
                return { ...p, stock: newStock };
            }
            return p;
        });
    });

    const newOrder: Order = {
      id: `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      date: new Date().toISOString(),
      items: currentCart,
      subtotal: this.cartSubTotalMMK(),
      discount: this.cartDiscount(),
      total: totalSale,
      totalCost: totalCost,
      totalProfit: totalProfit,
      paymentMethod,
      currency: 'MMK'
    };

    this.orders.update(orders => [newOrder, ...orders]);
    this.clearCart();
    return newOrder;
  }
  
  // --- Order Management ---
  voidOrder(orderId: string) {
      const order = this.orders().find(o => o.id === orderId);
      if(!order) return;

      // Restore stock
      this.products.update(allProducts => {
          return allProducts.map(p => {
              const item = order.items.find(i => i.product.id === p.id);
              if(item) {
                  return { ...p, stock: p.stock + item.quantity };
              }
              return p;
          });
      });

      // Remove order
      this.orders.update(orders => orders.filter(o => o.id !== orderId));
  }

  // --- Product & Category & Shop Management ---
  updateShopInfo(info: ShopConfig) {
      this.shopInfo.set(info);
  }

  addNewCategory(categoryName: string) {
      const trimmed = categoryName.trim();
      if (trimmed && !this.categories().includes(trimmed)) {
          this.categories.update(c => [...c, trimmed]);
      }
  }

  addNewProduct(name: string, price: number, cost: number, category: string, barcode: string, stock: number, imageBase64: string) {
    if (!this.isProVersion() && this.products().length >= 5) {
        alert("Free Version တွင် ပစ္စည်း ၅ မျိုးသာ ထည့်သွင်းခွင့်ရှိသည်။ အကန့်အသတ်မရှိသုံးရန် လိုင်စင်ဝယ်ယူပါ။");
        return;
    }

    this.addNewCategory(category);

    const newProduct: Product = {
        id: Date.now(),
        barcode: barcode || Date.now().toString(),
        name,
        price,
        cost,
        category,
        stock,
        image: imageBase64 || `https://picsum.photos/200/200?random=${Date.now()}`
    };
    this.products.update(p => [...p, newProduct]);
  }

  updateProduct(updatedProduct: Product) {
      this.addNewCategory(updatedProduct.category);
      this.products.update(products => 
        products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      );
      this.cart.update(items => 
        items.map(item => item.product.id === updatedProduct.id ? { ...item, product: updatedProduct } : item)
      );
  }

  deleteProduct(id: number) {
      this.products.update(products => products.filter(p => p.id !== id));
      this.removeFromCart(id);
  }

  // --- Admin & Security Management ---
  attemptActivation(key: string): boolean {
      if (key === this.requiredLicense()) {
          this.enteredLicense.set(key);
          return true;
      }
      return false;
  }

  updateSystemSettings(password: string, newLicenseKey?: string, newAdminPassword?: string): boolean {
      if (password !== this.adminPassword()) {
          return false;
      }
      if (newLicenseKey) this.requiredLicense.set(newLicenseKey);
      if (newAdminPassword) this.adminPassword.set(newAdminPassword);
      return true;
  }

  // --- Data Management ---
  exportData() {
      const data = {
          products: this.products(),
          orders: this.orders(),
          categories: this.categories(),
          shopInfo: this.shopInfo(),
          license: this.enteredLicense(),
          version: '1.3'
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FutureWorld_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
  }

  importData(file: File): Promise<boolean> {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e: any) => {
              try {
                  const data = JSON.parse(e.target.result);
                  if (data.products && data.orders) {
                      this.products.set(data.products);
                      this.orders.set(data.orders);
                      if(data.categories) this.categories.set(data.categories);
                      if(data.shopInfo) this.shopInfo.set(data.shopInfo);
                      if(data.license) this.enteredLicense.set(data.license);
                      resolve(true);
                  } else {
                      resolve(false);
                  }
              } catch (err) {
                  resolve(false);
              }
          };
          reader.readAsText(file);
      });
  }

  resetSystem(password: string): boolean {
      if (password !== this.adminPassword()) return false;
      
      const currentPass = this.adminPassword();
      const currentTargetLicense = this.requiredLicense();
      localStorage.clear();
      localStorage.setItem('fw_admin_pass', currentPass);
      localStorage.setItem('fw_target_license', currentTargetLicense);
      location.reload();
      return true;
  }
}