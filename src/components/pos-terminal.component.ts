import { Component, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosService, Product, Order } from '../services/pos.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex h-full flex-col md:flex-row gap-4 p-4 relative print:p-0">
      
      <!-- Product Grid (Left) -->
      <div class="flex-1 flex flex-col min-w-0 bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-700 print:hidden">
        <!-- Top Bar -->
        <div class="mb-4 flex flex-col gap-3">
            <div class="flex flex-col md:flex-row gap-3">
                <!-- Barcode Input -->
                <div class="relative flex-1 group">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="w-5 h-5 text-gray-500 group-focus-within:text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                    </div>
                    <input 
                        #barcodeInput
                        type="text" 
                        placeholder="Barcode ဖတ်ပါ (သို့) ပစ္စည်းရှာပါ..." 
                        class="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500 transition-all font-mono"
                        [ngModel]="searchTerm()"
                        (ngModelChange)="onSearchChange($event)"
                        (keydown.enter)="handleBarcodeScan()"
                    >
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2 shrink-0">
                     <!-- Recall Bill -->
                    <button (click)="showParkedModal.set(true)" class="relative bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-xl transition-all" title="ဘေလ်ဟောင်းပြန်ခေါ်မည်">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        @if (posService.parkedOrders().length > 0) {
                            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{{ posService.parkedOrders().length }}</span>
                        }
                    </button>
                    
                    <!-- Daily Summary -->
                     <button (click)="showReportModal.set(true)" class="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-xl transition-all" title="နေ့စဉ်စာရင်းချုပ်">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    </button>

                    <!-- Add Product -->
                    <button (click)="openProductModal()" class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg active:scale-95 whitespace-nowrap justify-center">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        <span class="hidden lg:inline">ပစ္စည်းသစ်</span>
                    </button>
                </div>
            </div>
          
          <div class="flex flex-col md:flex-row justify-between gap-3 items-center">
              <!-- Category Tabs (Dynamic) -->
              <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar w-full md:w-auto">
                <button 
                    class="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors" 
                    [class]="selectedCategory() === 'All' ? 'bg-cyan-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'" 
                    (click)="selectedCategory.set('All')">
                    အားလုံး
                </button>
                @for (cat of posService.categories(); track cat) {
                    <button 
                        class="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors" 
                        [class]="selectedCategory() === cat ? 'bg-cyan-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'" 
                        (click)="selectedCategory.set(cat)">
                        {{ cat }}
                    </button>
                }
              </div>

              <!-- Currency Switcher -->
              <div class="flex gap-1 bg-gray-700 rounded-lg p-1 shrink-0">
                  <button (click)="setCurrency('MMK')" [class]="posService.activeCurrency() === 'MMK' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'" class="px-3 py-1.5 rounded-md text-xs font-bold transition-all">MMK</button>
                  <button (click)="setCurrency('THB')" [class]="posService.activeCurrency() === 'THB' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'" class="px-3 py-1.5 rounded-md text-xs font-bold transition-all">THB</button>
                  <button (click)="setCurrency('CNY')" [class]="posService.activeCurrency() === 'CNY' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'" class="px-3 py-1.5 rounded-md text-xs font-bold transition-all">CNY</button>
              </div>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 overflow-y-auto pr-2 custom-scroll flex-1 content-start">
          @for (product of filteredProducts(); track product.id) {
            <div 
              class="group relative bg-gray-900 rounded-xl p-2 border border-gray-700 hover:border-cyan-500 transition-all duration-200 flex flex-col gap-1 shadow-sm hover:shadow-cyan-500/20"
              [class.opacity-60]="product.stock === 0">
              
              <div (click)="product.stock > 0 ? posService.addToCart(product) : null" class="h-28 w-full rounded-lg overflow-hidden relative bg-gray-800 mb-1 cursor-pointer">
                <img [src]="product.image" loading="lazy" alt="{{product.name}}" class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300 opacity-90 group-hover:opacity-100">
                <div class="absolute top-1 right-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-white z-10 border border-gray-600 shadow-sm">
                  {{ posService.convertPrice(product.price) | number }}
                </div>
                 <div class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold z-10 shadow-sm" [class]="product.stock === 0 ? 'bg-red-500/90 text-white' : (product.stock < 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800/90 text-gray-300 border border-gray-600')">
                   {{ product.stock === 0 ? 'ပစ္စည်းကုန်' : (product.stock < 5 ? 'Low: ' + product.stock : 'Stock: ' + product.stock) }}
                </div>
              </div>

              <div class="mt-auto flex justify-between items-center px-1">
                <div class="min-w-0 flex-1 mr-1">
                    <h3 class="font-bold text-gray-200 text-xs truncate leading-tight">{{ product.name }}</h3>
                </div>
                <button (click)="openProductModal(product); $event.stopPropagation()" class="text-gray-500 hover:text-cyan-400 transition-colors shrink-0 p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
              </div>
            </div>
          }
          @if (filteredProducts().length === 0) {
             <div class="col-span-full flex flex-col items-center justify-center text-gray-500 py-10">
                <p class="text-lg">ကုန်ပစ္စည်းမတွေ့ပါ</p>
             </div>
          }
        </div>
      </div>

      <!-- Cart Sidebar (Width w-80) -->
      <div class="w-full md:w-80 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 flex flex-col print:hidden">
        <div class="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-800/50 rounded-t-2xl">
          <h2 class="text-xl font-bold text-white flex items-center gap-2"><span>🛒</span> ခြင်းတောင်း</h2>
          <div class="flex items-center gap-2">
               <!-- Park Bill Button -->
               <button (click)="parkCurrentOrder()" [disabled]="posService.cart().length === 0" class="text-gray-400 hover:text-yellow-400 disabled:opacity-30" title="ဘေလ်ခဏသိမ်းမည်">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               </button>
               <!-- Clear Cart -->
               <button (click)="posService.clearCart()" [disabled]="posService.cart().length === 0" class="text-gray-400 hover:text-red-400 disabled:opacity-30" title="ရှင်းမည်">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
               </button>
               <span class="bg-cyan-900 text-cyan-200 text-xs px-2 py-1 rounded-full">{{ posService.cartCount() }} ခု</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
            @if (posService.cart().length === 0) {
                <div class="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                    <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    <p>ခြင်းတောင်း ရှင်းနေပါသည်</p>
                </div>
            }
            @for (item of posService.cart(); track item.product.id) {
            <div class="bg-gray-900 rounded-xl p-3 flex gap-3 border border-gray-700 animate-fadeIn">
              <div class="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                 <img [src]="item.product.image" class="w-full h-full object-cover">
              </div>
              <div class="flex-1 flex flex-col justify-between">
                <div class="flex justify-between items-start">
                  <h4 class="font-medium text-gray-200 text-sm">{{ item.product.name }}</h4>
                  <button (click)="posService.removeFromCart(item.product.id)" class="text-gray-500 hover:text-red-400 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div class="flex justify-between items-end">
                  <div class="text-cyan-400 font-bold text-sm">{{ posService.convertPrice(item.product.price) * item.quantity | number }} {{ posService.getCurrencySymbol() }}</div>
                  <div class="flex items-center gap-3 bg-gray-800 rounded-lg px-2 py-1">
                    <button (click)="posService.updateQuantity(item.product.id, -1)" class="w-5 h-5 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 text-white">-</button>
                    <span class="text-sm font-medium w-4 text-center">{{ item.quantity }}</span>
                    <button (click)="posService.updateQuantity(item.product.id, 1)" [disabled]="item.quantity >= item.product.stock" class="w-5 h-5 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 text-white disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                  </div>
                </div>
              </div>
            </div>
            }
        </div>

        <div class="p-5 bg-gray-900 border-t border-gray-700 rounded-b-2xl space-y-3">
          <!-- Discount Row -->
          <div class="flex justify-between items-center text-sm">
              <span class="text-gray-400">စုစုပေါင်း (Subtotal)</span>
              <span class="text-white font-mono">{{ posService.convertPrice(posService.cartSubTotalMMK()) | number }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
              <button (click)="toggleDiscount()" class="text-cyan-400 hover:text-cyan-300 text-xs border-b border-dashed border-cyan-500">
                  Discount (လျှော့ဈေး) {{ posService.cartDiscount() > 0 ? 'Edit' : 'Add' }}
              </button>
              <span class="text-red-400 font-mono">- {{ posService.convertPrice(posService.cartDiscount()) | number }}</span>
          </div>
          
          <div class="flex justify-between items-center pt-2 border-t border-gray-700">
            <span class="text-lg font-bold text-gray-200">ကျသင့်ငွေ</span>
            <span class="text-2xl font-bold text-cyan-400">{{ posService.convertPrice(posService.cartTotalMMK()) | number }} {{ posService.getCurrencySymbol() }}</span>
          </div>
          <button (click)="showPaymentModal.set(true)" [disabled]="posService.cart().length === 0" class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2">
            <span>ငွေချေမည်</span>
          </button>
        </div>
      </div>

      <!-- --- MODALS --- -->

      <!-- DISCOUNT MODAL -->
      @if (showDiscountModal()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div class="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-gray-700">
                  <h3 class="text-white font-bold mb-4">လျှော့ဈေး သတ်မှတ်ပါ (MMK)</h3>
                  <input type="number" [(ngModel)]="tempDiscount" class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white mb-4 focus:ring-2 focus:ring-cyan-500 outline-none">
                  <div class="flex gap-3">
                      <button (click)="showDiscountModal.set(false)" class="flex-1 py-2 bg-gray-700 rounded-lg text-white">Cancel</button>
                      <button (click)="applyDiscount()" class="flex-1 py-2 bg-cyan-600 rounded-lg text-white font-bold">Apply</button>
                  </div>
              </div>
          </div>
      }

      <!-- PARKED BILLS MODAL -->
      @if (showParkedModal()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div class="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 max-h-[80vh] flex flex-col">
                  <h3 class="text-white font-bold mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      သိမ်းဆည်းထားသော ဘေလ်များ
                  </h3>
                  
                  <div class="flex-1 overflow-y-auto custom-scroll space-y-2 mb-4">
                      @if (posService.parkedOrders().length === 0) {
                          <p class="text-gray-500 text-center py-4">မရှိပါ</p>
                      }
                      @for (order of posService.parkedOrders(); track order.id) {
                          <div class="bg-gray-900 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
                              <div>
                                  <div class="text-white font-bold text-sm">{{ order.note }}</div>
                                  <div class="text-xs text-gray-500">{{ order.timestamp | date:'shortTime' }} • {{ order.items.length }} Items</div>
                              </div>
                              <div class="flex gap-2">
                                  <button (click)="posService.deleteParkedOrder(order.id)" class="p-2 text-red-500 hover:bg-red-500/10 rounded">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                  </button>
                                  <button (click)="retrieveParked(order.id)" class="px-3 py-1 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-500">
                                      ပြန်ယူမည်
                                  </button>
                              </div>
                          </div>
                      }
                  </div>
                  <button (click)="showParkedModal.set(false)" class="w-full py-2 bg-gray-700 rounded-lg text-white">ပိတ်မည်</button>
              </div>
          </div>
      }
      
      <!-- DAILY REPORT MODAL -->
      @if (showReportModal()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div class="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-gray-700">
                  <h3 class="text-white font-bold mb-4 text-center border-b border-gray-700 pb-2">နေ့စဉ် စာရင်းချုပ် ({{ todayDate | date:'shortDate' }})</h3>
                  
                  <div class="space-y-3 mb-6">
                      <div class="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                          <span class="text-gray-400">Cash (လက်ငင်း)</span>
                          <span class="text-green-400 font-mono font-bold">{{ posService.dailySalesSummary().cash | number }} Ks</span>
                      </div>
                      <div class="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                          <span class="text-gray-400">KBZ Pay</span>
                          <span class="text-blue-400 font-mono font-bold">{{ posService.dailySalesSummary().kbz | number }} Ks</span>
                      </div>
                      <div class="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                          <span class="text-gray-400">Wave Pay</span>
                          <span class="text-yellow-400 font-mono font-bold">{{ posService.dailySalesSummary().wave | number }} Ks</span>
                      </div>
                      <div class="flex justify-between items-center pt-2 border-t border-gray-600">
                          <span class="text-white font-bold">Total Sales</span>
                          <span class="text-cyan-400 font-mono font-bold text-lg">{{ posService.dailySalesSummary().total | number }} Ks</span>
                      </div>
                       <div class="flex justify-between items-center pt-1">
                          <span class="text-gray-400 text-sm">Total Profit (အမြတ်)</span>
                          <span class="text-green-500 font-mono font-bold text-md">+{{ posService.dailySalesSummary().profit | number }} Ks</span>
                      </div>
                      <p class="text-center text-xs text-gray-500">Total Transactions: {{ posService.dailySalesSummary().count }}</p>
                  </div>
                  
                  <button (click)="showReportModal.set(false)" class="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">ပိတ်မည်</button>
              </div>
          </div>
      }

      <!-- PAYMENT MODAL -->
       @if (showPaymentModal()) {
          <div class="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn print:hidden">
              <div class="bg-gray-800 rounded-2xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl">
                  <h2 class="text-xl font-bold text-white mb-6 text-center">ငွေချေစနစ် ရွေးချယ်ပါ</h2>
                  <div class="grid grid-cols-3 gap-4 mb-6">
                      <button (click)="selectPayment('Cash')" [class]="selectedPayment() === 'Cash' ? 'bg-green-600 ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'" class="p-4 rounded-xl flex flex-col items-center gap-2 transition-all">
                          <span class="text-3xl">💵</span><span class="font-bold text-white">လက်ငင်း</span>
                      </button>
                      <button (click)="selectPayment('KBZ Pay')" [class]="selectedPayment() === 'KBZ Pay' ? 'bg-blue-600 ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'" class="p-4 rounded-xl flex flex-col items-center gap-2 transition-all">
                          <div class="w-8 h-8 rounded bg-white flex items-center justify-center font-bold text-blue-600">K</div><span class="font-bold text-white">KBZ Pay</span>
                      </button>
                      <button (click)="selectPayment('Wave Pay')" [class]="selectedPayment() === 'Wave Pay' ? 'bg-yellow-500 ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'" class="p-4 rounded-xl flex flex-col items-center gap-2 transition-all">
                           <div class="w-8 h-8 rounded bg-white flex items-center justify-center font-bold text-yellow-600">W</div><span class="font-bold text-white">Wave Pay</span>
                      </button>
                  </div>
                  @if (selectedPayment() !== 'Cash') {
                      <div class="flex flex-col items-center mb-6 animate-fadeIn">
                          <div class="bg-white p-2 rounded-lg">
                              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DemoPayment" class="w-32 h-32" alt="QR Code">
                          </div>
                          <p class="text-sm text-cyan-400 mt-2">Scan to Pay</p>
                      </div>
                  }
                  <div class="text-center mb-6">
                      <p class="text-gray-400 mb-1">ကျသင့်ငွေ</p>
                      <p class="text-3xl font-bold text-white">{{ posService.convertPrice(posService.cartTotalMMK()) | number }} {{ posService.getCurrencySymbol() }}</p>
                  </div>
                  <div class="flex gap-3">
                      <button (click)="showPaymentModal.set(false)" class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold">မလုပ်တော့ပါ</button>
                      <button (click)="processPayment()" class="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg">အတည်ပြုမည်</button>
                  </div>
              </div>
          </div>
      }

      <!-- ADD/EDIT PRODUCT MODAL -->
      @if (showProductModal()) {
          <div class="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn print:hidden">
              <div class="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto custom-scroll">
                  <div class="flex justify-between items-center mb-4">
                      <h2 class="text-xl font-bold text-white">{{ isEditing() ? 'ပစ္စည်းစာရင်း ပြင်ဆင်ရန်' : 'ပစ္စည်းအသစ် ထည့်သွင်းရန်' }}</h2>
                      @if (isEditing()) {
                          <button (click)="deleteProduct()" class="text-red-500 hover:bg-red-500/10 p-2 rounded-lg" title="ဖျက်မည်">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                      }
                  </div>
                  
                  <div class="space-y-4">
                        <!-- Image Upload -->
                       <div class="flex justify-center">
                            <div class="relative w-32 h-32 bg-gray-700 rounded-lg overflow-hidden border-2 border-dashed border-gray-500 hover:border-cyan-500 transition-colors group cursor-pointer">
                                <input type="file" accept="image/*" (change)="onFileSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer z-10">
                                @if (modalProductImage) {
                                    <img [src]="modalProductImage" class="w-full h-full object-cover">
                                } @else {
                                    <div class="flex flex-col items-center justify-center h-full text-gray-400">
                                        <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <span class="text-xs">ပုံတင်ရန်</span>
                                    </div>
                                }
                            </div>
                       </div>

                       <div>
                          <label class="block text-sm text-gray-400 mb-1">Barcode (ဘားကုဒ်)</label>
                          <input type="text" [(ngModel)]="modalProductBarcode" class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none font-mono">
                      </div>
                      <div>
                          <label class="block text-sm text-gray-400 mb-1">ပစ္စည်းအမည်</label>
                          <input type="text" [(ngModel)]="modalProductName" class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none">
                      </div>
                      <div class="flex gap-4">
                        <div class="flex-1">
                            <label class="block text-sm text-gray-400 mb-1">အရောင်းဈေး (Selling)</label>
                            <input type="number" [(ngModel)]="modalProductPrice" class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none">
                        </div>
                        <div class="flex-1">
                            <label class="block text-sm text-gray-400 mb-1">အရင်းဈေး (Cost)</label>
                            <input type="number" [(ngModel)]="modalProductCost" class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none">
                        </div>
                      </div>
                      <div>
                          <label class="block text-sm text-gray-400 mb-1">လက်ကျန် (Stock)</label>
                          <input type="number" [(ngModel)]="modalProductStock" class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none">
                      </div>
                      <div>
                          <label class="block text-sm text-gray-400 mb-1">အမျိုးအစား (ရွေးပါ သို့မဟုတ် အသစ်ရိုက်ထည့်ပါ)</label>
                          <input 
                            list="categoryList" 
                            [(ngModel)]="modalProductCategory" 
                            placeholder="Select or type new..."
                            class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none">
                          <datalist id="categoryList">
                              @for (cat of posService.categories(); track cat) {
                                  <option [value]="cat"></option>
                              }
                          </datalist>
                      </div>
                  </div>

                  <div class="flex gap-3 mt-6">
                      <button (click)="closeProductModal()" class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">မလုပ်တော့ပါ</button>
                      <button (click)="submitProduct()" class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold">
                          {{ isEditing() ? 'ပြင်ဆင်မည်' : 'သိမ်းဆည်းမည်' }}
                      </button>
                  </div>
              </div>
          </div>
      }

      <!-- RECEIPT MODAL (Thermal Style) -->
      @if (lastOrder()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn print:bg-white print:p-0 print:block">
              <!-- Thermal Paper Style -->
              <div class="bg-white text-black p-4 w-[300px] shadow-2xl relative print:shadow-none print:w-full print:max-w-none">
                  <!-- Header -->
                  <div class="text-center pb-2 mb-2 border-b-2 border-dashed border-gray-300">
                      <h1 class="text-xl font-bold font-mono">{{ posService.shopInfo().name }}</h1>
                      <p class="text-[10px] text-gray-500">{{ posService.shopInfo().address }}</p>
                      <p class="text-[10px] text-gray-500">Tel: {{ posService.shopInfo().phone }}</p>
                  </div>
                  
                  <!-- Info -->
                  <div class="text-[10px] font-mono mb-2 flex flex-col gap-0.5">
                      <div class="flex justify-between"><span>Date:</span> <span>{{ lastOrder()!.date | date:'dd/MM/yy HH:mm' }}</span></div>
                      <div class="flex justify-between"><span>Invoice:</span> <span>{{ lastOrder()!.id }}</span></div>
                      <div class="flex justify-between"><span>Payment:</span> <span class="uppercase">{{ lastOrder()!.paymentMethod }}</span></div>
                  </div>

                  <!-- Items -->
                  <div class="text-[11px] font-mono border-b-2 border-dashed border-gray-300 pb-2 mb-2">
                      <div class="flex font-bold mb-1 border-b border-gray-200 pb-1">
                          <span class="w-1/2">Item</span>
                          <span class="w-1/4 text-center">Qty</span>
                          <span class="w-1/4 text-right">Price</span>
                      </div>
                      @for (item of lastOrder()!.items; track item.product.id) {
                          <div class="flex mb-1">
                              <span class="w-1/2 truncate pr-1">{{ item.product.name }}</span>
                              <span class="w-1/4 text-center">{{item.quantity}}</span>
                              <span class="w-1/4 text-right">{{ posService.convertPrice(item.product.price) * item.quantity | number }}</span>
                          </div>
                      }
                  </div>

                  <!-- Totals -->
                  <div class="text-[11px] font-mono space-y-1 mb-4">
                      <div class="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{{ posService.convertPrice(lastOrder()!.subtotal) | number }}</span>
                      </div>
                      @if (lastOrder()!.discount > 0) {
                          <div class="flex justify-between text-black">
                              <span>Discount:</span>
                              <span>-{{ posService.convertPrice(lastOrder()!.discount) | number }}</span>
                          </div>
                      }
                      <div class="flex justify-between font-bold text-sm border-t border-dashed border-gray-300 pt-1 mt-1">
                          <span>TOTAL:</span>
                          <span>{{ posService.convertPrice(lastOrder()!.total) | number }} {{ posService.getCurrencySymbol() }}</span>
                      </div>
                  </div>

                  <!-- Footer -->
                  <div class="text-center text-[10px] font-mono mt-4 border-t border-gray-200 pt-2">
                      <p>{{ posService.shopInfo().footerMessage }}</p>
                      <p class="mt-1 opacity-50 text-[8px]">Power by Future World POS</p>
                  </div>

                  <!-- Actions -->
                  <div class="grid grid-cols-2 gap-2 mt-4 print:hidden">
                    <button (click)="printReceipt()" class="bg-gray-900 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-800">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        PRINT
                    </button>
                    <button (click)="lastOrder.set(null)" class="bg-gray-200 text-gray-800 py-2 rounded text-xs font-bold hover:bg-gray-300">
                        CLOSE
                    </button>
                  </div>
              </div>
          </div>
      }

    </div>
  `,
  styles: [`
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
  `]
})
export class PosTerminalComponent {
  posService = inject(PosService);
  searchTerm = signal('');
  selectedCategory = signal('All');
  todayDate = new Date();

  // Modal States
  showProductModal = signal(false);
  isEditing = signal(false);
  editingProductId: number | null = null;
  showPaymentModal = signal(false);
  showDiscountModal = signal(false);
  showParkedModal = signal(false);
  showReportModal = signal(false);
  
  lastOrder = signal<Order | null>(null);
  selectedPayment = signal<'Cash' | 'KBZ Pay' | 'Wave Pay'>('Cash');
  tempDiscount = 0;

  // Form Models
  modalProductBarcode = '';
  modalProductName = '';
  modalProductPrice = 0;
  modalProductCost = 0;
  modalProductStock = 0;
  modalProductCategory = 'Other';
  modalProductImage = ''; // For Preview

  @ViewChild('barcodeInput') barcodeInput!: ElementRef;

  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const category = this.selectedCategory();
    return this.posService.products().filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(term) || p.barcode.includes(term);
      const matchesCategory = category === 'All' || p.category === category;
      return matchesSearch && matchesCategory;
    });
  });

  onSearchChange(val: string) { this.searchTerm.set(val); }

  handleBarcodeScan() {
      const barcode = this.searchTerm();
      if (!barcode) return;
      
      const success = this.posService.addToCartByBarcode(barcode);
      
      // Force clear the input using nativeElement for speed (critical for scanners)
      if (this.barcodeInput) {
          this.barcodeInput.nativeElement.value = '';
          this.barcodeInput.nativeElement.focus();
      }
      // Also update the signal
      this.searchTerm.set('');

      if (success) {
          this.playBeep();
      }
  }

  setCurrency(curr: 'MMK' | 'THB' | 'CNY') { this.posService.activeCurrency.set(curr); }
  selectPayment(method: 'Cash' | 'KBZ Pay' | 'Wave Pay') { this.selectedPayment.set(method); }

  processPayment() {
      this.speakTotal();
      const order = this.posService.checkout(this.selectedPayment());
      if (order) {
          this.lastOrder.set(order);
          this.showPaymentModal.set(false);
          this.selectedPayment.set('Cash');
          // Clear discount after sale
          this.posService.setDiscount(0);
      }
  }

  // --- New Features ---
  toggleDiscount() {
      this.tempDiscount = this.posService.cartDiscount();
      this.showDiscountModal.set(true);
  }

  applyDiscount() {
      if(this.tempDiscount < 0) this.tempDiscount = 0;
      this.posService.setDiscount(this.tempDiscount);
      this.showDiscountModal.set(false);
  }

  parkCurrentOrder() {
      if(confirm('လက်ရှိဘေလ်ကို ခေတ္တသိမ်းထားမည်လား?')) {
          this.posService.parkOrder(`Bill #${Math.floor(Math.random()*1000)}`);
      }
  }

  retrieveParked(id: number) {
      if(this.posService.cart().length > 0) {
          if(!confirm('လက်ရှိခြင်းတောင်းကို ဖျက်ပြီး သိမ်းထားသောဘေလ်ကို ပြန်ယူမည်လား?')) return;
      }
      this.posService.retrieveOrder(id);
      this.showParkedModal.set(false);
  }

  playBeep() {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.start();
      osc.stop(0.1);
  }

  speakTotal() {
      if ('speechSynthesis' in window) {
          const total = this.posService.convertPrice(this.posService.cartTotalMMK());
          const currency = this.posService.activeCurrency();
          let text = '';
          if (currency === 'MMK') text = `Total is ${total} Kyats`; 
          else if (currency === 'THB') text = `Total is ${total} Baht`;
          else text = `Total is ${total} Yuan`;
          const utterance = new SpeechSynthesisUtterance(text);
          window.speechSynthesis.speak(utterance);
      }
  }

  // --- Product Management Logic ---
  onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
          if (file.size > 500000) { // Limit 500KB to save localStorage
              alert('ဓာတ်ပုံဖိုင်ဆိုဒ် ကြီးလွန်းပါသည်။ 500KB အောက်ပုံကို ရွေးပါ။');
              return;
          }
          const reader = new FileReader();
          reader.onload = (e: any) => {
              this.modalProductImage = e.target.result;
          };
          reader.readAsDataURL(file);
      }
  }

  openProductModal(productData?: Product) {
      if (productData) {
          // IMPORTANT: Fetch the latest data from the service to ensure we have current Stock
          // The productData passed from the template loop might be stale if checkout happened recently
          const freshProduct = this.posService.products().find(p => p.id === productData.id) || productData;

          this.isEditing.set(true);
          this.editingProductId = freshProduct.id;
          this.modalProductBarcode = freshProduct.barcode;
          this.modalProductName = freshProduct.name;
          this.modalProductPrice = freshProduct.price;
          this.modalProductCost = freshProduct.cost || 0;
          this.modalProductStock = freshProduct.stock;
          this.modalProductCategory = freshProduct.category;
          this.modalProductImage = freshProduct.image;
      } else {
          // Check limit if adding new
          if (!this.posService.isProVersion() && this.posService.products().length >= 5) {
             alert("Free Version တွင် ပစ္စည်း ၅ မျိုးသာ ထည့်သွင်းခွင့်ရှိသည်။");
             return;
          }
          this.isEditing.set(false);
          this.editingProductId = null;
          this.modalProductBarcode = '';
          this.modalProductName = '';
          this.modalProductPrice = 0;
          this.modalProductCost = 0;
          this.modalProductStock = 0;
          this.modalProductCategory = 'Other';
          this.modalProductImage = '';
      }
      this.showProductModal.set(true);
  }

  closeProductModal() { this.showProductModal.set(false); }

  submitProduct() {
      if (!this.modalProductName || this.modalProductPrice <= 0) {
          alert('Please fill all required fields correctly.');
          return;
      }

      const imageToSave = this.modalProductImage || `https://picsum.photos/200/200?random=${Date.now()}`;

      if (this.isEditing() && this.editingProductId) {
          const updated: Product = {
              id: this.editingProductId,
              name: this.modalProductName,
              price: this.modalProductPrice,
              cost: this.modalProductCost,
              stock: this.modalProductStock,
              category: this.modalProductCategory,
              barcode: this.modalProductBarcode,
              image: imageToSave
          };
          this.posService.updateProduct(updated);
      } else {
          this.posService.addNewProduct(
              this.modalProductName, 
              this.modalProductPrice,
              this.modalProductCost,
              this.modalProductCategory,
              this.modalProductBarcode,
              this.modalProductStock,
              imageToSave
            );
      }
      this.closeProductModal();
  }

  deleteProduct() {
      if (this.editingProductId && confirm('Are you sure you want to delete this product?')) {
          this.posService.deleteProduct(this.editingProductId);
          this.closeProductModal();
      }
  }

  printReceipt() { window.print(); }
}