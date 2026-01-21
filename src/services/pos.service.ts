import { Injectable, signal, computed, effect } from '@angular/core';

export interface Product {
  id: number;
  barcode: string;
  name: string;
  price: number; 
  cost: number;  
  category: string;
  image: string;
  stock: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  totalDebt: number; // Total Credit Amount
  lastPurchase: string;
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
  totalCost: number; 
  totalProfit: number; 
  paymentMethod: 'Cash' | 'KBZ Pay' | 'Wave Pay' | 'Credit'; // Added Credit
  customerId?: number; // Linked Customer
  currency: 'MMK' | 'THB' | 'CNY';
}

export interface ParkedOrder {
  id: number;
  timestamp: Date;
  items: CartItem[];
  note: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: 'General' | 'Salary' | 'Utility' | 'Restock';
  date: string;
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
  // Exchange Rates as Signal for editing
  exchangeRates = signal({
    MMK: 1,
    THB: 100,
    CNY: 450
  });

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
  customers = signal<Customer[]>([]); // Customer List
  cart = signal<CartItem[]>([]);
  orders = signal<Order[]>([]);
  parkedOrders = signal<ParkedOrder[]>([]);
  expenses = signal<Expense[]>([]); 

  activeCurrency = signal<'MMK' | 'THB' | 'CNY'>('MMK');
  
  cartDiscount = signal<number>(0); 
  selectedCustomerId = signal<number | null>(null); // Current customer in cart
  
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
    effect(() => localStorage.setItem('fw_expenses', JSON.stringify(this.expenses())));
    effect(() => localStorage.setItem('fw_customers', JSON.stringify(this.customers())));
    effect(() => localStorage.setItem('fw_shop_info', JSON.stringify(this.shopInfo())));
    effect(() => localStorage.setItem('fw_rates', JSON.stringify(this.exchangeRates()))); // Save Rates
    
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
    const exp = localStorage.getItem('fw_expenses');
    const cust = localStorage.getItem('fw_customers');
    const shop = localStorage.getItem('fw_shop_info');
    const rates = localStorage.getItem('fw_rates');
    
    if (p) this.products.set(JSON.parse(p));
    else this.products.set(this.initialProducts);

    if (o) this.orders.set(JSON.parse(o));
    if (park) this.parkedOrders.set(JSON.parse(park));
    if (cats) this.categories.set(JSON.parse(cats));
    if (exp) this.expenses.set(JSON.parse(exp));
    if (cust) this.customers.set(JSON.parse(cust));
    if (shop) this.shopInfo.set(JSON.parse(shop));
    if (rates) this.exchangeRates.set(JSON.parse(rates));
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

  // Today's Stats
  totalSalesToday = computed(() => {
      const today = new Date().toDateString();
      return this.orders()
        .filter(o => new Date(o.date).toDateString() === today && o.paymentMethod !== 'Credit') // Don't count credit as cash-in-hand
        .reduce((acc, order) => acc + order.total, 0);
  });
  
  totalExpensesToday = computed(() => {
      const today = new Date().toDateString();
      return this.expenses()
        .filter(e => new Date(e.date).toDateString() === today)
        .reduce((acc, exp) => acc + exp.amount, 0);
  });

  totalNetProfitToday = computed(() => {
      const today = new Date().toDateString();
      const grossProfit = this.orders()
        .filter(o => new Date(o.date).toDateString() === today)
        .reduce((acc, order) => acc + (order.totalProfit || 0), 0);
      
      return grossProfit - this.totalExpensesToday();
  });

  dailySalesSummary = computed(() => {
      const today = new Date().toDateString();
      const todayOrders = this.orders().filter(o => new Date(o.date).toDateString() === today);
      
      return {
          cash: todayOrders.filter(o => o.paymentMethod === 'Cash').reduce((acc, o) => acc + o.total, 0),
          kbz: todayOrders.filter(o => o.paymentMethod === 'KBZ Pay').reduce((acc, o) => acc + o.total, 0),
          wave: todayOrders.filter(o => o.paymentMethod === 'Wave Pay').reduce((acc, o) => acc + o.total, 0),
          credit: todayOrders.filter(o => o.paymentMethod === 'Credit').reduce((acc, o) => acc + o.total, 0),
          total: todayOrders.reduce((acc, o) => acc + o.total, 0),
          grossProfit: todayOrders.reduce((acc, o) => acc + (o.totalProfit || 0), 0),
          expenses: this.totalExpensesToday(),
          netProfit: this.totalNetProfitToday(),
          count: todayOrders.length
      };
  });

  // Last 7 Days Sales for Chart
  last7DaysSales = computed(() => {
      const result = [];
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toDateString();
          
          const total = this.orders()
              .filter(o => new Date(o.date).toDateString() === dateStr)
              .reduce((acc, o) => acc + o.total, 0);
          
          result.push({
              day: d.toLocaleDateString('en-US', { weekday: 'short' }),
              amount: total
          });
      }
      return result;
  });
  
  topSellingItems = computed(() => {
      const itemMap = new Map<string, number>();
      this.orders().forEach(order => {
          order.items.forEach(item => {
              const current = itemMap.get(item.product.name) || 0;
              itemMap.set(item.product.name, current + item.quantity);
          });
      });
      
      return Array.from(itemMap.entries())
          .map(([name, qty]) => ({ name, qty }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5); // Top 5
  });

  // Low Stock Items (< 5)
  lowStockItems = computed(() => {
      return this.products().filter(p => p.stock < 5);
  });

  // --- Currency Helpers ---
  convertPrice(priceMMK: number): number {
      const rate = this.exchangeRates()[this.activeCurrency()];
      return Math.ceil(priceMMK / rate); 
  }

  updateExchangeRate(currency: 'THB' | 'CNY', rate: number) {
      this.exchangeRates.update(r => ({...r, [currency]: rate}));
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

  selectCustomerForCart(custId: number | null) {
      this.selectedCustomerId.set(custId);
  }

  clearCart() {
    this.cart.set([]);
    this.cartDiscount.set(0);
    this.selectedCustomerId.set(null);
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
  checkout(paymentMethod: 'Cash' | 'KBZ Pay' | 'Wave Pay' | 'Credit'): Order | null {
    const currentCart = this.cart();
    if (currentCart.length === 0) return null;

    const totalSale = this.cartTotalMMK();
    const totalCost = this.cartTotalCostMMK();
    const totalProfit = totalSale - totalCost;

    // Handle Credit Logic
    if (paymentMethod === 'Credit') {
        const custId = this.selectedCustomerId();
        if (!custId) return null; // Cannot do credit without customer
        
        // Update Customer Debt
        this.customers.update(custs => custs.map(c => 
            c.id === custId 
            ? { ...c, totalDebt: c.totalDebt + totalSale, lastPurchase: new Date().toISOString() }
            : c
        ));
    } else if (this.selectedCustomerId()) {
        // Cash purchase but customer linked (update last purchase date)
        this.customers.update(custs => custs.map(c => 
            c.id === this.selectedCustomerId()
            ? { ...c, lastPurchase: new Date().toISOString() }
            : c
        ));
    }

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
      customerId: this.selectedCustomerId() || undefined,
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

      // Reverse Credit if applicable
      if (order.paymentMethod === 'Credit' && order.customerId) {
          this.customers.update(custs => custs.map(c => 
             c.id === order.customerId
             ? { ...c, totalDebt: Math.max(0, c.totalDebt - order.total) }
             : c
          ));
      }

      // Remove order
      this.orders.update(orders => orders.filter(o => o.id !== orderId));
  }

  // --- Customer Management ---
  addCustomer(name: string, phone: string) {
      const newCust: Customer = {
          id: Date.now(),
          name,
          phone,
          totalDebt: 0,
          lastPurchase: new Date().toISOString()
      };
      this.customers.update(c => [...c, newCust]);
  }

  deleteCustomer(id: number) {
      this.customers.update(c => c.filter(cust => cust.id !== id));
  }

  repayDebt(customerId: number, amount: number) {
      this.customers.update(custs => custs.map(c => {
          if (c.id === customerId) {
              return { ...c, totalDebt: Math.max(0, c.totalDebt - amount) };
          }
          return c;
      }));
  }

  // --- Expense Management ---
  addExpense(description: string, amount: number, category: Expense['category']) {
      const newExpense: Expense = {
          id: Date.now(),
          description,
          amount,
          category,
          date: new Date().toISOString()
      };
      this.expenses.update(e => [newExpense, ...e]);
  }

  deleteExpense(id: number) {
      this.expenses.update(e => e.filter(item => item.id !== id));
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
  
  // NEW: Update and Delete Category Logic
  updateCategory(oldName: string, newName: string) {
      const trimmed = newName.trim();
      if (!trimmed || oldName === trimmed) return;

      // 1. Update Products using this category
      this.products.update(ps => ps.map(p => p.category === oldName ? { ...p, category: trimmed } : p));

      // 2. Update Category List
      this.categories.update(cats => {
          // If new name exists, remove old and assume merge
          if (cats.includes(trimmed)) {
              return cats.filter(c => c !== oldName);
          }
          // Else rename
          return cats.map(c => c === oldName ? trimmed : c);
      });
  }

  deleteCategory(categoryName: string) {
      if (categoryName === 'Other') return; // Protect default

      // 1. Move products to 'Other'
      this.products.update(ps => ps.map(p => p.category === categoryName ? { ...p, category: 'Other' } : p));

      // 2. Remove from list
      this.categories.update(cats => cats.filter(c => c !== categoryName));
      
      // Ensure 'Other' exists
      if (!this.categories().includes('Other')) {
          this.categories.update(c => [...c, 'Other']);
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
          customers: this.customers(),
          expenses: this.expenses(),
          categories: this.categories(),
          shopInfo: this.shopInfo(),
          rates: this.exchangeRates(),
          license: this.enteredLicense(),
          version: '1.7'
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
                      if(data.expenses) this.expenses.set(data.expenses);
                      if(data.customers) this.customers.set(data.customers);
                      if(data.categories) this.categories.set(data.categories);
                      if(data.shopInfo) this.shopInfo.set(data.shopInfo);
                      if(data.rates) this.exchangeRates.set(data.rates);
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