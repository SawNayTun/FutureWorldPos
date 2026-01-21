import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PosService } from '../services/pos.service';
import { GeminiService } from '../services/gemini.service';
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
                    [class]="posService.isProVersion() ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-yellow-500/20 border-yellow-500 text-yellow-400'">
                    {{ posService.isProVersion() ? 'PRO LICENSE' : 'TRIAL VERSION' }}
                </span>
                <span class="text-xs text-gray-500" *ngIf="!posService.isProVersion()">Max 5 items only</span>
            </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <h3 class="text-gray-400 font-medium mb-1">ဒီနေ့ရောင်းအား</h3>
          <div class="text-3xl font-bold text-white">{{ posService.totalSalesToday() | number }} Ks</div>
        </div>
        
         <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-green-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <h3 class="text-gray-400 font-medium mb-1">ဒီနေ့ အသားတင်အမြတ်</h3>
          <div class="text-3xl font-bold text-green-400">+{{ posService.totalProfitToday() | number }} Ks</div>
        </div>

        <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group">
           <div class="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <h3 class="text-gray-400 font-medium mb-1">စုစုပေါင်း အော်ဒါ</h3>
          <div class="text-3xl font-bold text-white">{{ posService.orders().length }}</div>
        </div>
        
        <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group">
           <div class="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <h3 class="text-gray-400 font-medium mb-1">ကုန်ပစ္စည်းမျိုးစုံ</h3>
          <div class="text-3xl font-bold text-white">{{ posService.products().length }}</div>
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
                      <label class="text-xs text-gray-500">Shop Name (ဆိုင်အမည်)</label>
                      <input type="text" [(ngModel)]="shopName" class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white">
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
                  <button (click)="saveShopSettings()" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded font-bold text-sm">Save Shop Info</button>
              </div>
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
                   <h2 class="text-sm font-bold text-gray-400 mb-2">License Key</h2>
                   @if (!posService.isProVersion()) {
                      <div class="flex gap-2">
                          <input type="text" [(ngModel)]="inputLicenseKey" placeholder="Enter Product Key" class="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                          <button (click)="activateLicense()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Activate</button>
                      </div>
                   } @else {
                      <div class="text-green-400 text-sm font-bold border border-green-500/30 bg-green-500/10 p-2 rounded text-center">License Active</div>
                   }
               </div>
          </div>
      </div>

      <!-- AI Insight Section -->
      <div class="bg-gradient-to-br from-indigo-900 to-gray-900 rounded-2xl p-6 mb-8 border border-indigo-700/50 shadow-xl">
        <div class="flex justify-between items-start mb-4">
            <h2 class="text-xl font-bold text-indigo-200 flex items-center gap-2">
                <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                AI စီးပွားရေးအကြံပေး
            </h2>
            <button 
                (click)="askAi()" 
                [disabled]="isLoadingAi()"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                @if (isLoadingAi()) {
                    <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    စဉ်းစားနေသည်...
                } @else {
                    အကြံဉာဏ်ရယူမည်
                }
            </button>
        </div>
        
        <div class="bg-black/30 rounded-xl p-4 min-h-[100px] text-gray-300 leading-relaxed whitespace-pre-line border border-white/5">
             @if (aiResponse()) {
                 {{ aiResponse() }}
             } @else {
                 <span class="text-gray-500 italic">"အကြံဉာဏ်ရယူမည်" ခလုတ်ကိုနှိပ်ပြီး AI ၏ သုံးသပ်ချက်ကို ရယူပါ။</span>
             }
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
                  <td class="px-6 py-4 text-center">
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

              <!-- Settings -->
              <div class="space-y-4">
                  <div>
                     <label class="text-xs text-gray-500 mb-1 block">Set Valid License Key (For Client)</label>
                     <input type="text" [(ngModel)]="adminNewLicenseKey" [placeholder]="posService.requiredLicense()" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono">
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

    </div>
  `,
  styles: [`
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
  `]
})
export class DashboardComponent {
  posService = inject(PosService);
  geminiService = inject(GeminiService);
  
  aiResponse = signal<string>('');
  isLoadingAi = signal<boolean>(false);
  
  // Client Activation Model
  inputLicenseKey = '';

  // Shop Config Models
  shopName = '';
  shopAddress = '';
  shopPhone = '';
  shopFooter = '';

  // Admin Panel Models
  authAdminPassword = '';
  adminNewLicenseKey = '';
  adminNewPassword = '';

  constructor() {
      const info = this.posService.shopInfo();
      this.shopName = info.name;
      this.shopAddress = info.address;
      this.shopPhone = info.phone;
      this.shopFooter = info.footerMessage;
  }

  getOrderItemsSummary(order: any): string {
      return order.items.map((i: any) => i.product.name).join(', ').slice(0, 30) + (order.items.length > 2 ? '...' : '');
  }
  
  voidOrder(id: string) {
      if(confirm('ဤဘေလ်ကို ဖျက်မည်မှာ သေချာပါသလား? Stock များပြန်လည်ဖြည့်သွင်းသွားပါမည်။')) {
          this.posService.voidOrder(id);
      }
  }

  async askAi() {
    this.isLoadingAi.set(true);
    const salesSummary = `
      Total Sales Today: ${this.posService.totalSalesToday()} MMK.
      Total Profit: ${this.posService.totalProfitToday()} MMK.
      Total Transactions: ${this.posService.orders().length}.
      Products Sold: ${this.posService.orders().map(o => o.items.map(i => i.product.name).join(', ')).join(', ')}.
    `;
    
    const advice = await this.geminiService.getBusinessAdvice(salesSummary);
    this.aiResponse.set(advice);
    this.isLoadingAi.set(false);
  }

  // Shop Config
  saveShopSettings() {
      this.posService.updateShopInfo({
          name: this.shopName,
          address: this.shopAddress,
          phone: this.shopPhone,
          footerMessage: this.shopFooter
      });
      alert('ဆိုင်အချက်အလက်များ သိမ်းဆည်းပြီးပါပြီ။');
  }

  // Client Action
  activateLicense() {
      if(this.posService.attemptActivation(this.inputLicenseKey)) {
          alert('License Activated Successfully!');
          this.inputLicenseKey = '';
      } else {
          alert('Invalid License Key');
      }
  }

  // Admin Action
  saveAdminSettings() {
      if (!this.authAdminPassword) {
          alert('Please enter your current Admin Password to save changes.');
          return;
      }

      const success = this.posService.updateSystemSettings(
          this.authAdminPassword, 
          this.adminNewLicenseKey || undefined, 
          this.adminNewPassword || undefined
      );

      if (success) {
          alert('Settings Saved Successfully!');
          this.authAdminPassword = '';
          this.adminNewLicenseKey = '';
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