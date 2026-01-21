import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PosService, Order } from '../services/pos.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="p-6 h-full overflow-y-auto custom-scroll">
      <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                အနာဂတ်ကမ္ဘာ စီမံခန့်ခွဲမှု
            </h1>
            <div class="flex items-center gap-2 mt-2">
                <span class="text-xs px-2 py-1 rounded border font-bold tracking-wider"
                    [class]="posService.isProVersion() ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'">
                    {{ posService.isProVersion() ? 'LICENSE ACTIVE' : 'LICENSE EXPIRED' }}
                </span>
                <span class="text-xs text-gray-500" *ngIf="!posService.isProVersion()">Max 5 items limit applied</span>
            </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <h3 class="text-gray-400 font-medium mb-1">ဒီနေ့ရောင်းအား (Sales)</h3>
          <div class="text-3xl font-bold text-white">{{ posService.totalSalesToday() | number }} Ks</div>
        </div>
        
         <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-green-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <h3 class="text-gray-400 font-medium mb-1">အသားတင်အမြတ် (Net Profit)</h3>
          <div class="text-3xl font-bold" [class.text-green-400]="posService.totalNetProfitToday() >= 0" [class.text-red-400]="posService.totalNetProfitToday() < 0">
             {{ posService.totalNetProfitToday() >= 0 ? '+' : '' }}{{ posService.totalNetProfitToday() | number }} Ks
          </div>
          <div class="text-[10px] text-gray-500 mt-1">Gross Profit - Expenses</div>
        </div>

        <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group">
           <div class="absolute -right-6 -top-6 w-24 h-24 bg-red-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <h3 class="text-gray-400 font-medium mb-1">ဒီနေ့ အသုံးစရိတ် (Expense)</h3>
          <div class="text-3xl font-bold text-red-400">{{ posService.totalExpensesToday() | number }} Ks</div>
        </div>
        
        <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group">
           <div class="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <h3 class="text-gray-400 font-medium mb-1">လက်ကျန်ပစ္စည်းမျိုးစုံ</h3>
          <div class="text-3xl font-bold text-white">{{ posService.products().length }}</div>
        </div>
      </div>

      <!-- Main Columns: Chart & Low Stock -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Weekly Sales Chart -->
          <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col">
               <h2 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                   ရက်သတ္တပတ် အရောင်း (Weekly Trend)
               </h2>
               <div class="flex items-end justify-between h-40 gap-2">
                   @for (data of posService.last7DaysSales(); track data.day) {
                       <div class="flex flex-col items-center flex-1 group">
                           <div class="w-full relative bg-gray-700/50 rounded-t-lg hover:bg-cyan-500/20 transition-all cursor-pointer flex items-end justify-center" style="height: 100%">
                                <div class="w-full bg-cyan-500 rounded-t-sm transition-all duration-500 group-hover:bg-cyan-400" 
                                    [style.height.%]="(data.amount / getMaxSales()) * 100"></div>
                                <div class="absolute -top-8 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {{ data.amount | number }}
                                </div>
                           </div>
                           <span class="text-xs text-gray-400 mt-2 font-mono">{{ data.day }}</span>
                       </div>
                   }
               </div>
          </div>

          <!-- Low Stock Warnings & Top Selling Tabs -->
           <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col">
                <div class="flex gap-4 border-b border-gray-700 pb-2 mb-4">
                    <button class="font-bold pb-2 transition-colors border-b-2" [class]="activeTab === 'low' ? 'text-red-400 border-red-400' : 'text-gray-500 border-transparent hover:text-gray-300'" (click)="activeTab = 'low'">Low Stock ({{ posService.lowStockItems().length }})</button>
                    <button class="font-bold pb-2 transition-colors border-b-2" [class]="activeTab === 'top' ? 'text-yellow-400 border-yellow-400' : 'text-gray-500 border-transparent hover:text-gray-300'" (click)="activeTab = 'top'">Top Selling</button>
                </div>

                @if (activeTab === 'low') {
                    <div class="flex-1 overflow-y-auto custom-scroll space-y-3 max-h-48">
                        @for (item of posService.lowStockItems(); track item.id) {
                            <div class="flex justify-between items-center bg-red-900/20 p-2 rounded border border-red-500/30">
                                <div class="flex items-center gap-2">
                                    <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    <span class="text-gray-200 text-sm font-medium">{{ item.name }}</span>
                                </div>
                                <span class="text-red-400 font-bold font-mono">{{ item.stock }} left</span>
                            </div>
                        }
                        @if (posService.lowStockItems().length === 0) {
                             <div class="h-full flex flex-col items-center justify-center text-green-500 opacity-60">
                                <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                <p class="text-sm">Stock အခြေအနေ ကောင်းမွန်ပါသည်</p>
                            </div>
                        }
                    </div>
                } @else {
                     <div class="space-y-4">
                        @for (item of posService.topSellingItems(); track item.name) {
                            <div class="relative">
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="text-gray-300 font-medium">{{ item.name }}</span>
                                    <span class="text-cyan-400 font-bold">{{ item.qty }} ခု</span>
                                </div>
                                <div class="w-full bg-gray-700 rounded-full h-2">
                                    <div class="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" [style.width.%]="(item.qty / posService.topSellingItems()[0].qty) * 100"></div>
                                </div>
                            </div>
                        }
                        @if (posService.topSellingItems().length === 0) {
                            <p class="text-gray-500 text-center py-4">အရောင်းမှတ်တမ်း မရှိသေးပါ</p>
                        }
                    </div>
                }
           </div>
      </div>

      <!-- Customer & Debt Management -->
      <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg mb-8">
           <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
               <svg class="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
               ဖောက်သည်နှင့် အကြွေးစာရင်း (CRM & Debt)
           </h2>
           
           <div class="flex gap-2 mb-4">
               <input type="text" [(ngModel)]="newCustName" placeholder="Name" class="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm">
               <input type="text" [(ngModel)]="newCustPhone" placeholder="Phone" class="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm">
               <button (click)="addCustomer()" class="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded font-bold text-sm">Add New</button>
           </div>

           <div class="overflow-x-auto max-h-60 custom-scroll">
               <table class="w-full text-left text-sm text-gray-400">
                   <thead class="bg-gray-900/50 uppercase font-medium">
                       <tr>
                           <th class="px-4 py-3">Name</th>
                           <th class="px-4 py-3">Phone</th>
                           <th class="px-4 py-3">Last Buy</th>
                           <th class="px-4 py-3">Total Debt (အကြွေး)</th>
                           <th class="px-4 py-3 text-center">Action</th>
                       </tr>
                   </thead>
                   <tbody class="divide-y divide-gray-700">
                       @for (cust of posService.customers(); track cust.id) {
                           <tr class="hover:bg-gray-700/30">
                               <td class="px-4 py-3 text-white">{{ cust.name }}</td>
                               <td class="px-4 py-3">{{ cust.phone }}</td>
                               <td class="px-4 py-3">{{ cust.lastPurchase | date:'shortDate' }}</td>
                               <td class="px-4 py-3 font-bold" [class.text-red-400]="cust.totalDebt > 0" [class.text-green-400]="cust.totalDebt === 0">
                                   {{ cust.totalDebt | number }} Ks
                               </td>
                               <td class="px-4 py-3 text-center flex justify-center gap-2">
                                   @if(cust.totalDebt > 0) {
                                       <button (click)="openDebtModal(cust)" class="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs">Pay</button>
                                   }
                                   <button (click)="posService.deleteCustomer(cust.id)" class="text-gray-500 hover:text-red-500">
                                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                   </button>
                               </td>
                           </tr>
                       }
                        @if (posService.customers().length === 0) {
                           <tr><td colspan="5" class="text-center py-4">No customers added yet.</td></tr>
                       }
                   </tbody>
               </table>
           </div>
      </div>

      <!-- Expense Management -->
      <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col mb-8">
           <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              အသုံးစရိတ် စာရင်းသွင်းရန်
           </h2>
           
           <div class="grid grid-cols-2 gap-2 mb-4">
               <input type="text" [(ngModel)]="newExpDesc" placeholder="အကြောင်းအရာ (ဥပမာ- ထမင်းဖိုး)" class="col-span-2 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm">
               <input type="number" [(ngModel)]="newExpAmount" placeholder="ပမာဏ (MMK)" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm">
               <select [(ngModel)]="newExpCat" class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm">
                   <option value="General">General</option>
                   <option value="Salary">Salary</option>
                   <option value="Utility">Utility</option>
                   <option value="Restock">Restock</option>
               </select>
               <button (click)="addExpense()" class="col-span-2 bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold text-sm">စာရင်းသွင်းမည်</button>
           </div>

           <div class="flex-1 overflow-y-auto custom-scroll max-h-48 border-t border-gray-700 pt-2">
               <h3 class="text-xs text-gray-400 mb-2 uppercase font-bold">Today's Expenses</h3>
               <div class="space-y-2">
                   @for (exp of posService.expenses(); track exp.id) {
                       <div class="flex justify-between items-center bg-gray-900/50 p-2 rounded border border-gray-700">
                           <div>
                               <div class="text-sm text-gray-200">{{ exp.description }}</div>
                               <div class="text-[10px] text-gray-500">{{ exp.category }} • {{ exp.date | date:'shortTime' }}</div>
                           </div>
                           <div class="flex items-center gap-2">
                               <span class="text-red-400 font-mono font-bold">{{ exp.amount | number }}</span>
                               <button (click)="posService.deleteExpense(exp.id)" class="text-gray-500 hover:text-red-500">
                                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                               </button>
                           </div>
                       </div>
                   }
                    @if (posService.expenses().length === 0) {
                       <p class="text-gray-500 text-xs text-center">မှတ်တမ်းမရှိပါ</p>
                   }
               </div>
           </div>
      </div>

      <!-- Settings & Maintenance Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <!-- Shop Configuration -->
          <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
              <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  ဆိုင် အချက်အလက်များ (Receipt Setup)
              </h2>
              <div class="space-y-3">
                  <div>
                      <label class="text-xs text-gray-500">Shop Name (ဆိုင်အမည် - မြန်မာလိုရိုက်ပါ)</label>
                      <input type="text" [(ngModel)]="shopName" class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white font-['Padauk']">
                  </div>
                   <div>
                      <label class="text-xs text-gray-500">Phone</label>
                      <input type="text" [(ngModel)]="shopPhone" class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white">
                  </div>
                   <div>
                      <label class="text-xs text-gray-500">Address</label>
                      <input type="text" [(ngModel)]="shopAddress" class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white">
                  </div>
                   <div>
                      <label class="text-xs text-gray-500">Footer Message</label>
                      <input type="text" [(ngModel)]="shopFooter" class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white">
                  </div>
                  
                  <!-- QR Code Uploads (NEW) -->
                  <div class="pt-2 border-t border-gray-700 mt-2">
                      <h3 class="text-xs font-bold text-gray-400 mb-2">Payment QR Codes (ငွေလက်ခံရန်)</h3>
                      <div class="flex gap-2">
                          <div class="flex-1">
                              <label class="text-[10px] text-gray-300 font-bold block mb-1">KBZ Pay QR</label>
                              <div class="relative bg-gray-900 border border-gray-600 rounded p-1 h-20 flex items-center justify-center cursor-pointer group hover:border-cyan-500">
                                   <input type="file" accept="image/*" (change)="onKbzQrSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer z-10">
                                   @if(kbzQrTemp) {
                                       <img [src]="kbzQrTemp" class="h-full object-contain">
                                   } @else {
                                       <span class="text-[9px] text-gray-500">Upload QR</span>
                                   }
                              </div>
                          </div>
                          <div class="flex-1">
                              <label class="text-[10px] text-gray-300 font-bold block mb-1">Wave Pay QR</label>
                              <div class="relative bg-gray-900 border border-gray-600 rounded p-1 h-20 flex items-center justify-center cursor-pointer group hover:border-cyan-500">
                                   <input type="file" accept="image/*" (change)="onWaveQrSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer z-10">
                                   @if(waveQrTemp) {
                                       <img [src]="waveQrTemp" class="h-full object-contain">
                                   } @else {
                                       <span class="text-[9px] text-gray-500">Upload QR</span>
                                   }
                              </div>
                          </div>
                      </div>
                  </div>

                  <!-- Exchange Rate Config (UPDATED for Clarity) -->
                  <div class="pt-2 border-t border-gray-700 mt-2">
                       <h3 class="text-xs font-bold text-gray-400 mb-2">ငွေလဲလှယ်နှုန်း သတ်မှတ်ချက် (Foreign Currency)</h3>
                       <p class="text-[10px] text-gray-500 mb-2">နိုင်ငံခြားငွေဖြင့် ရောင်းချလိုပါက ယနေ့ပေါက်ဈေးကို ထည့်သွင်းပါ။ (မသုံးပါက မူလအတိုင်းထားပါ)</p>
                       <div class="flex gap-2">
                            <div class="flex-1">
                                <label class="text-[10px] text-gray-300 font-bold block mb-1">၁ ဘတ် ပေါက်ဈေး (MMK)</label>
                                <input type="number" [ngModel]="posService.exchangeRates().THB" (ngModelChange)="updateRate('THB', $event)" class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs" placeholder="100">
                            </div>
                            <div class="flex-1">
                                <label class="text-[10px] text-gray-300 font-bold block mb-1">၁ ယွမ် ပေါက်ဈေး (MMK)</label>
                                <input type="number" [ngModel]="posService.exchangeRates().CNY" (ngModelChange)="updateRate('CNY', $event)" class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs" placeholder="450">
                            </div>
                       </div>
                  </div>

                  <button (click)="saveShopSettings()" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded font-bold text-sm mt-2">Save Settings</button>
              </div>
          </div>
          
           <!-- NEW: Category Management -->
          <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col">
              <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                 <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                 အမျိုးအစား စီမံခန့်ခွဲရန် (Category)
              </h2>
              <div class="flex-1 overflow-y-auto custom-scroll space-y-2 max-h-60">
                  @for (cat of posService.categories(); track cat) {
                      <div class="flex justify-between items-center bg-gray-900 p-2 rounded border border-gray-600 group">
                           <!-- Edit Mode -->
                           @if (editingCategory === cat) {
                               <input type="text" [(ngModel)]="tempCategoryName" class="flex-1 bg-gray-800 text-white text-sm px-2 py-1 rounded border border-cyan-500 outline-none mr-2">
                               <div class="flex gap-1">
                                    <button (click)="saveCategory(cat)" class="text-green-400 hover:text-green-300 p-1">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    </button>
                                    <button (click)="editingCategory = null" class="text-gray-400 hover:text-gray-300 p-1">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                               </div>
                           } @else {
                               <!-- View Mode -->
                               <span class="text-sm font-medium text-gray-300 pl-1">{{ cat }}</span>
                               <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button (click)="startEditCategory(cat)" class="text-cyan-400 hover:text-cyan-300 p-1" title="အမည်ပြောင်းမည်">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    </button>
                                    @if(cat !== 'Other') {
                                        <button (click)="deleteCategory(cat)" class="text-red-400 hover:text-red-300 p-1" title="ဖျက်မည်">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    }
                               </div>
                           }
                      </div>
                  }
              </div>
              <p class="text-[10px] text-gray-500 mt-2 text-center">Note: အမျိုးအစားဖျက်လျှင် ပစ္စည်းများ "Other" သို့ ရောက်ရှိသွားမည်။</p>
          </div>

          <!-- Data Backup & License -->
          <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col justify-between">
               <div>
                   <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                      Data System
                  </h2>
                  <div class="flex gap-3 mb-6">
                      <button (click)="posService.exportData()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium border border-gray-600 transition-colors">
                          Download Backup
                      </button>
                      <label class="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium cursor-pointer text-center transition-colors">
                          Restore Data
                          <input type="file" (change)="handleFileImport($event)" accept=".json" class="hidden">
                      </label>
                  </div>
               </div>

               <div>
                   <h2 class="text-sm font-bold text-gray-400 mb-2">License Information</h2>
                   @if (!posService.isProVersion()) {
                      <div class="bg-red-500/10 border border-red-500/30 p-3 rounded-lg mb-3">
                          <p class="text-red-400 text-xs font-bold mb-1">Status: EXPIRED / TRIAL</p>
                          <p class="text-gray-500 text-[10px]">Please contact Admin to renew subscription.</p>
                      </div>
                      <div class="flex gap-2">
                          <input type="text" [(ngModel)]="inputLicenseKey" placeholder="Activation Key (e.g. FW20251231)" class="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-mono">
                          <button (click)="activateLicense()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Renew</button>
                      </div>
                   } @else {
                      <div class="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
                          <p class="text-green-400 text-sm font-bold">License Active</p>
                          <p class="text-gray-400 text-xs mt-1">Valid Until: <span class="text-white font-mono">{{ posService.licenseExpiryDate() | date:'mediumDate' }}</span></p>
                      </div>
                   }
               </div>
          </div>
      </div>

      <!-- Recent Orders Table -->
      <div class="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden mb-8">
        <div class="p-4 border-b border-gray-700">
          <h2 class="text-lg font-bold text-white">လတ်တလော အရောင်းစာရင်းများ</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-400">
            <thead class="bg-gray-900/50 uppercase font-medium">
              <tr>
                <th class="px-6 py-4">Order ID</th>
                <th class="px-6 py-4">အချိန်</th>
                <th class="px-6 py-4">ပစ္စည်းများ</th>
                <th class="px-6 py-4 text-right">တန်ဖိုး</th>
                <th class="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              @for (order of posService.orders(); track order.id) {
                <tr class="hover:bg-gray-700/50 transition-colors group">
                  <td class="px-6 py-4 font-mono text-cyan-400">{{ order.id }}</td>
                  <td class="px-6 py-4">{{ order.date | date:'shortTime' }}</td>
                  <td class="px-6 py-4 text-white">
                    {{ order.items.length }} မျိုး
                    <span class="text-xs text-gray-500 block">
                        ({{ getOrderItemsSummary(order) }})
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right font-bold text-white">{{ order.total | number }} Ks</td>
                  <td class="px-6 py-4 text-center flex items-center justify-center gap-2">
                      <button (click)="openReceiptModal(order)" class="text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10 p-2 rounded transition-colors" title="View/Print">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      </button>
                      <button (click)="voidOrder(order.id)" class="text-red-500 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-colors" title="Void Order">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                  </td>
                </tr>
              }
              @if (posService.orders().length === 0) {
                 <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">အရောင်းမှတ်တမ်း မရှိသေးပါ</td>
                 </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Admin Control Panel (Owner Side) -->
      <div class="bg-red-900/10 p-6 rounded-2xl border border-dashed border-red-500/30 mb-8">
          <div class="flex items-center gap-2 mb-4">
             <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
             <h2 class="text-md font-bold text-red-200 uppercase tracking-wider">Admin Control Panel</h2>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Auth -->
              <div class="space-y-4">
                 <div>
                     <label class="text-xs text-gray-500 mb-1 block">Admin Password (Required to save)</label>
                     <input type="password" [(ngModel)]="authAdminPassword" placeholder="Enter Admin Password" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none">
                 </div>
                 
                 <div class="pt-4 border-t border-gray-700/50">
                    <button (click)="handleReset()" class="text-xs text-red-500 hover:text-red-400 hover:underline flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Factory Reset System (Delete All Data)
                    </button>
                 </div>
              </div>

              <!-- Settings (Subscription Management) -->
              <div class="space-y-4">
                  <div>
                     <label class="text-xs text-gray-500 mb-1 block">Set Subscription Expiry Date (Valid Until)</label>
                     <!-- Date Picker for Direct Management -->
                     <input type="date" [(ngModel)]="adminNewExpiryDate" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none">
                     <p class="text-[10px] text-gray-500 mt-1">Current Expiry: {{ posService.licenseExpiryDate() | date:'mediumDate' }}</p>
                 </div>
                 <div>
                     <label class="text-xs text-gray-500 mb-1 block">Change Admin Password (Optional)</label>
                     <input type="text" [(ngModel)]="adminNewPassword" placeholder="New Password" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono">
                 </div>
                 <button (click)="saveAdminSettings()" class="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg text-sm font-bold shadow-lg transition-colors">
                     Save Settings
                 </button>
              </div>
          </div>
      </div>
      
      <!-- REPAYMENT MODAL -->
      @if (showDebtModal()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div class="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-gray-700">
                  <h3 class="text-white font-bold mb-4">Repay Debt (အကြွေးဆပ်မည်)</h3>
                  <div class="mb-4 text-sm text-gray-400">
                      Customer: <span class="text-white font-bold">{{ selectedDebtCust?.name }}</span><br>
                      Total Debt: <span class="text-red-400 font-bold">{{ selectedDebtCust?.totalDebt | number }} Ks</span>
                  </div>
                  
                  <label class="text-xs text-gray-500 mb-1 block">Amount to Pay</label>
                  <input type="number" [(ngModel)]="repayAmount" class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white mb-4 focus:ring-2 focus:ring-cyan-500 outline-none">
                  
                  <div class="flex gap-3">
                      <button (click)="showDebtModal.set(false)" class="flex-1 py-2 bg-gray-700 rounded-lg text-white">Cancel</button>
                      <button (click)="processRepayment()" class="flex-1 py-2 bg-green-600 rounded-lg text-white font-bold">Confirm Pay</button>
                  </div>
              </div>
          </div>
      }

      <!-- RECEIPT MODAL (Reprint) -->
      @if (receiptOrder()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn print:bg-white print:p-0 print:block">
              <!-- Thermal Paper Style -->
              <div class="bg-white text-black p-4 w-[300px] shadow-2xl relative print:shadow-none print:w-full print:max-w-none">
                  <!-- Header -->
                  <div class="text-center pb-2 mb-2 border-b-2 border-dashed border-gray-300">
                      <h1 class="text-xl font-bold font-mono">{{ posService.shopInfo().name }}</h1>
                      <p class="text-[10px] text-gray-500">{{ posService.shopInfo().address }}</p>
                      <p class="text-[10px] text-gray-500">Tel: {{ posService.shopInfo().phone }}</p>
                      <div class="bg-gray-200 text-xs font-bold rounded mt-1">COPY RECEIPT</div>
                  </div>
                  
                  <!-- Info -->
                  <div class="text-[10px] font-mono mb-2 flex flex-col gap-0.5">
                      <div class="flex justify-between"><span>Date:</span> <span>{{ receiptOrder()!.date | date:'dd/MM/yy HH:mm' }}</span></div>
                      <div class="flex justify-between"><span>Invoice:</span> <span>{{ receiptOrder()!.id }}</span></div>
                      <div class="flex justify-between"><span>Payment:</span> <span class="uppercase font-bold">{{ receiptOrder()!.paymentMethod }}</span></div>
                      @if (receiptOrder()!.customerId) {
                          <div class="flex justify-between"><span>Customer:</span> <span>{{ getCustomerName(receiptOrder()!.customerId!) }}</span></div>
                      }
                  </div>

                  <!-- Items -->
                  <div class="text-[11px] font-mono border-b-2 border-dashed border-gray-300 pb-2 mb-2">
                      <div class="flex font-bold mb-1 border-b border-gray-200 pb-1">
                          <span class="w-1/2">Item</span>
                          <span class="w-1/4 text-center">Qty</span>
                          <span class="w-1/4 text-right">Price</span>
                      </div>
                      @for (item of receiptOrder()!.items; track item.product.id) {
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
                          <span>{{ posService.convertPrice(receiptOrder()!.subtotal) | number }}</span>
                      </div>
                      @if (receiptOrder()!.discount > 0) {
                          <div class="flex justify-between text-black">
                              <span>Discount:</span>
                              <span>-{{ posService.convertPrice(receiptOrder()!.discount) | number }}</span>
                          </div>
                      }
                      <div class="flex justify-between font-bold text-sm border-t border-dashed border-gray-300 pt-1 mt-1">
                          <span>TOTAL:</span>
                          <span>{{ posService.convertPrice(receiptOrder()!.total) | number }} {{ posService.getCurrencySymbol() }}</span>
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
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z"></path></svg>
                        PRINT
                    </button>
                    <button (click)="receiptOrder.set(null)" class="bg-gray-200 text-gray-800 py-2 rounded text-xs font-bold hover:bg-gray-300">
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
  `]
})
export class DashboardComponent {
  posService = inject(PosService);
  
  // UI Tabs
  activeTab: 'low' | 'top' = 'low';

  // Client Activation Model
  inputLicenseKey = '';

  // Expense Models
  newExpDesc = '';
  newExpAmount = 0;
  newExpCat: 'General' | 'Salary' | 'Utility' | 'Restock' = 'General';
  
  // Customer Models
  newCustName = '';
  newCustPhone = '';
  
  // Debt Modal
  showDebtModal = signal(false);
  selectedDebtCust: any = null;
  repayAmount = 0;

  // Receipt Modal
  receiptOrder = signal<Order | null>(null);

  // Shop Config Models
  shopName = '';
  shopAddress = '';
  shopPhone = '';
  shopFooter = '';
  
  // QR Images Temp
  kbzQrTemp = '';
  waveQrTemp = '';
  
  // Category Config Models
  editingCategory: string | null = null;
  tempCategoryName = '';

  // Admin Panel Models
  authAdminPassword = '';
  adminNewExpiryDate = ''; // New: Date Model
  adminNewPassword = '';

  constructor() {
      const info = this.posService.shopInfo();
      this.shopName = info.name;
      this.shopAddress = info.address;
      this.shopPhone = info.phone;
      this.shopFooter = info.footerMessage;
      this.kbzQrTemp = info.kbzQr || '';
      this.waveQrTemp = info.waveQr || '';
      
      // Initialize admin date picker with current expiry
      const expiry = new Date(this.posService.licenseExpiryDate());
      this.adminNewExpiryDate = expiry.toISOString().split('T')[0];
  }

  getMaxSales() {
      const max = Math.max(...this.posService.last7DaysSales().map(d => d.amount));
      return max > 0 ? max : 10000; // default scale
  }

  getOrderItemsSummary(order: any): string {
      return order.items.map((i: any) => i.product.name).join(', ').slice(0, 30) + (order.items.length > 2 ? '...' : '');
  }
  
  voidOrder(id: string) {
      if(confirm('ဤဘေလ်ကို ဖျက်မည်မှာ သေချာပါသလား? Stock များပြန်လည်ဖြည့်သွင်းသွားပါမည်။')) {
          this.posService.voidOrder(id);
      }
  }

  openReceiptModal(order: Order) {
      this.receiptOrder.set(order);
  }

  printReceipt() {
      window.print();
  }

  getCustomerName(id: number) {
      return this.posService.customers().find(c => c.id === id)?.name || 'Unknown';
  }

  // Expenses
  addExpense() {
      if(!this.newExpDesc || this.newExpAmount <= 0) {
          alert('Please enter valid description and amount.');
          return;
      }
      this.posService.addExpense(this.newExpDesc, this.newExpAmount, this.newExpCat);
      this.newExpDesc = '';
      this.newExpAmount = 0;
  }

  // Customers
  addCustomer() {
      if(!this.newCustName) return;
      this.posService.addCustomer(this.newCustName, this.newCustPhone);
      this.newCustName = '';
      this.newCustPhone = '';
  }

  openDebtModal(cust: any) {
      this.selectedDebtCust = cust;
      this.repayAmount = cust.totalDebt;
      this.showDebtModal.set(true);
  }

  processRepayment() {
      if(this.repayAmount > 0 && this.selectedDebtCust) {
          this.posService.repayDebt(this.selectedDebtCust.id, this.repayAmount);
          this.showDebtModal.set(false);
      }
  }

  // Shop Config
  saveShopSettings() {
      this.posService.updateShopInfo({
          name: this.shopName,
          address: this.shopAddress,
          phone: this.shopPhone,
          footerMessage: this.shopFooter,
          kbzQr: this.kbzQrTemp,
          waveQr: this.waveQrTemp
      });
      alert('ဆိုင်အချက်အလက်များ သိမ်းဆည်းပြီးပါပြီ။');
  }

  // Image Handlers
  onKbzQrSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
          if (file.size > 500000) { 
              alert('File size too large. Please use image under 500KB.');
              return;
          }
          const reader = new FileReader();
          reader.onload = (e: any) => {
              this.kbzQrTemp = e.target.result;
          };
          reader.readAsDataURL(file);
      }
  }

  onWaveQrSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
          if (file.size > 500000) { 
              alert('File size too large. Please use image under 500KB.');
              return;
          }
          const reader = new FileReader();
          reader.onload = (e: any) => {
              this.waveQrTemp = e.target.result;
          };
          reader.readAsDataURL(file);
      }
  }

  updateRate(currency: 'THB' | 'CNY', val: number) {
      this.posService.updateExchangeRate(currency, val);
  }
  
  // Category Config
  startEditCategory(name: string) {
      this.editingCategory = name;
      this.tempCategoryName = name;
  }
  
  saveCategory(oldName: string) {
      if(this.tempCategoryName && this.tempCategoryName !== oldName) {
          this.posService.updateCategory(oldName, this.tempCategoryName);
      }
      this.editingCategory = null;
  }
  
  deleteCategory(name: string) {
      if(confirm(`'${name}' အမျိုးအစားကို ဖျက်မည်မှာ သေချာပါသလား? ပါဝင်သော ပစ္စည်းများသည် "Other" သို့ ရောက်သွားပါမည်။`)) {
          this.posService.deleteCategory(name);
      }
  }

  // Client Action: Activate by Key (Format FW20251231)
  activateLicense() {
      if(this.posService.attemptActivation(this.inputLicenseKey)) {
          alert('License Renewed Successfully!');
          this.inputLicenseKey = '';
      } else {
          alert('Invalid Key Format! Use FWYYYYMMDD (e.g., FW20251231)');
      }
  }

  // Admin Action: Save Date directly
  saveAdminSettings() {
      if (!this.authAdminPassword) {
          alert('Please enter your current Admin Password to save changes.');
          return;
      }

      // Convert date string to ISO
      let newDateIso = undefined;
      if (this.adminNewExpiryDate) {
          const d = new Date(this.adminNewExpiryDate);
          d.setHours(23, 59, 59, 999);
          newDateIso = d.toISOString();
      }

      const success = this.posService.updateSystemSettings(
          this.authAdminPassword, 
          newDateIso,
          this.adminNewPassword || undefined
      );

      if (success) {
          alert('Settings Saved Successfully!');
          this.authAdminPassword = '';
          this.adminNewPassword = '';
      } else {
          alert('Incorrect Admin Password!');
      }
  }

  handleReset() {
      if (!this.authAdminPassword) {
          alert('Please enter Admin Password to perform a reset.');
          return;
      }
      if(confirm('Warning: This will delete ALL sales and product data. Are you sure?')) {
          const success = this.posService.resetSystem(this.authAdminPassword);
          if(!success) {
              alert('Incorrect Admin Password!');
          }
      }
  }

  handleFileImport(event: any) {
      const file = event.target.files[0];
      if(file) {
          if(confirm('Data Restore လုပ်လိုက်လျှင် လက်ရှိစာရင်းများ ပျောက်သွားနိုင်ပါသည်။ ဆက်လုပ်မည်လား?')) {
              this.posService.importData(file).then(success => {
                  if(success) alert('Data Restored Successfully!');
                  else alert('Invalid Backup File');
              });
          }
      }
  }
}