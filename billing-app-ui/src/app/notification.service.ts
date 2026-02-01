import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor() { }

    success(message: string, title: string = 'Success') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3b82f6', // brand blue
            backdrop: `rgba(0,0,0,0.4)`
        });
    }

    error(message: string, title: string = 'Error') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ef4444', // brand red
            backdrop: `rgba(0,0,0,0.4)`
        });
    }

    warning(message: string, title: string = 'Warning') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'warning',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f59e0b', // brand amber
            backdrop: `rgba(0,0,0,0.4)`
        });
    }

    info(message: string, title: string = 'Info') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'info',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3b82f6',
            backdrop: `rgba(0,0,0,0.4)`
        });
    }

    confirm(message: string, title: string = 'Are you sure?', confirmText: string = 'Yes, do it!'): Promise<boolean> {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel',
            backdrop: `rgba(0,0,0,0.4)`
        }).then((result) => {
            return result.isConfirmed;
        });
    }
}
