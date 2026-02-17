import { Injectable, signal, Type } from '@angular/core';

export interface ModalConfig {
    title: string;
    component: Type<any>;
    data?: any;
}

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    private activeModalSignal = signal<ModalConfig | null>(null);
    public activeModal = this.activeModalSignal.asReadonly();

    open(config: ModalConfig) {
        this.activeModalSignal.set(config);
    }

    close() {
        this.activeModalSignal.set(null);
    }
}
