import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notificationsSignal = signal<Notification[]>([]);
    public notifications = this.notificationsSignal.asReadonly();
    private nextId = 0;

    show(message: string, type: NotificationType = 'info') {
        const id = this.nextId++;
        const notification = { id, message, type };
        this.notificationsSignal.update(n => [...n, notification]);

        // Auto-remove after 5 seconds
        setTimeout(() => this.remove(id), 5000);
    }

    success(message: string) { this.show(message, 'success'); }
    error(message: string) { this.show(message, 'error'); }
    warning(message: string) { this.show(message, 'warning'); }

    remove(id: number) {
        this.notificationsSignal.update(n => n.filter(x => x.id !== id));
    }
}
