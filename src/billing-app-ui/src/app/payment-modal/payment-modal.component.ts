import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, QRCodeModule],
  template: `
    <div class="modal fade" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="modal-header border-0 bg-light p-4">
            <h5 class="modal-title fw-bold text-dark">Scan to Pay</h5>
            <button type="button" class="btn-close" (click)="close()" aria-label="Close"></button>
          </div>
          
          <div class="modal-body p-4 text-center">
              <div class="qr-wrapper p-3 bg-white shadow-sm rounded-4 d-inline-block border mb-4">
                  <!-- UPI URL Format: upi://pay?pa=ADDRESS&pn=NAME&am=AMOUNT&cu=INR -->
                  <qrcode [qrdata]="upiString" [width]="200" [margin]="2" [errorCorrectionLevel]="'M'"></qrcode>
              </div>
              
              <div class="payment-info mb-4">
                  <div class="display-5 fw-bold text-primary mb-1">₹{{ amount | number:'1.2-2' }}</div>
                  <div class="badge bg-light text-muted border px-3 py-2 rounded-pill font-monospace small mb-3">{{ shopUpiId }}</div>
                  <p class="text-muted small px-4">Scan this QR code with any UPI app like GPay, PhonePe, or Paytm to complete the transaction.</p>
              </div>
              
              <div class="alert alert-info border-0 bg-info-subtle text-info d-flex align-items-start gap-3 p-3 rounded-3 text-start mb-0">
                  <span class="fs-4">ℹ️</span>
                  <p class="small mb-0 fw-medium">Payment confirmation is manual. Once you've verified the payment on your device, please click the button below.</p>
              </div>
          </div>
          
          <div class="modal-footer border-0 p-4 pt-0 d-flex gap-3">
            <button type="button" class="btn btn-light rounded-pill px-4 flex-grow-1 fw-bold text-muted border" (click)="close()">Cancel</button>
            <button type="button" class="btn btn-success rounded-pill px-4 flex-grow-1 fw-bold shadow-sm" (click)="confirmPayment()">
              ✅ Payment Received
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="isOpen"></div>
  `,
  styles: [`
    .modal.show { display: block; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); }
    .qr-wrapper { transition: transform 0.3s ease; }
    .qr-wrapper:hover { transform: scale(1.02); }
    
    .modal-content {
      animation: modalSlideUp 0.3s ease-out;
    }
    
    @keyframes modalSlideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
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
