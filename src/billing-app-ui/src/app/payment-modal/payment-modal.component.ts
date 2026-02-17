import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, QRCodeModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="close()">
      <div class="modal-content glass" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Scan to Pay</h3>
          <button class="close-btn" (click)="close()">×</button>
        </div>
        
        <div class="modal-body">
            <div class="qr-container">
                <!-- UPI URL Format: upi://pay?pa=ADDRESS&pn=NAME&am=AMOUNT&cu=INR -->
                <qrcode [qrdata]="upiString" [width]="200" [errorCorrectionLevel]="'M'"></qrcode>
            </div>
            
            <div class="payment-details">
                <p class="amount">₹{{ amount | number:'1.2-2' }}</p>
                <p class="upi-id">{{ shopUpiId }}</p>
                <div class="helper-text">Scan with any UPI App (GPay, PhonePe, Paytm)</div>
            </div>
            
            <div class="info-alert">
                <span class="icon">ℹ️</span>
                <p>Payment confirmation is manual. Please check your phone/soundbox for confirmation.</p>
            </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close()">Cancel</button>
          <button class="btn btn-success" (click)="confirmPayment()">
            ✅ Payment Received
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease-out;
    }
    
    .modal-content {
      background: white; width: 90%; max-width: 400px;
      border-radius: 20px;
      padding: 0;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    
    .modal-header {
      padding: 16px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex; justify-content: space-between; align-items: center;
    }
    
    .modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }
    .close-btn { background: none; border: none; font-size: 24px; color: #64748b; cursor: pointer; }
    
    .modal-body { padding: 20px 24px; text-align: center; }
    
    .qr-container { 
        background: white; 
        padding: 16px; 
        border-radius: 12px; 
        display: inline-block;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-bottom: 16px;
    }
    
    .amount { font-size: 32px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }
    .upi-id { font-family: monospace; color: #64748b; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-bottom: 16px; }
    .helper-text { font-size: 13px; color: #64748b; }
    
    .info-alert {
        margin-top: 16px;
        background: #eff6ff;
        border: 1px solid #dbeafe;
        border-radius: 8px;
        padding: 12px;
        font-size: 12px;
        color: #1e40af;
        display: flex; gap: 8px; align-items: start; text-align: left;
    }
    
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex; justify-content: flex-end; gap: 12px;
    }
    
    .btn { padding: 10px 20px; border-radius: 10px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-success { background: #10b981; color: white; }
    .btn-success:hover { background: #059669; transform: translateY(-1px); }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class PaymentModalComponent {
  @Input() isOpen = false;
  @Input() amount = 0;
  @Input() shopUpiId = '';
  @Input() shopName = '';

  @Output() closeEvent = new EventEmitter<void>();
  @Output() confirmEvent = new EventEmitter<void>();

  get upiString(): string {
    // Format: upi://pay?pa=ADDRESS&pn=NAME&am=AMOUNT&cu=INR
    if (!this.shopUpiId) return '';

    const params = new URLSearchParams();
    params.append('pa', this.shopUpiId);
    params.append('pn', this.shopName || 'Merchant');
    params.append('am', this.amount.toString());
    params.append('cu', 'INR');

    return `upi://pay?${params.toString()}`;
  }

  close() {
    this.closeEvent.emit();
  }

  confirmPayment() {
    this.confirmEvent.emit();
  }
}
